import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Address, encodeAbiParameters, parseAbiParameters } from "viem";
import { publicClient } from "~/utils/permissionless";
import { Identity } from "@semaphore-protocol/core";
import SemaphoreAbi from "~/utils/Semaphore.json";

import { config, semaphore } from "~/config";
import { Form, FormControl, FormSection } from "~/components/ui/Form";
import { Input } from "~/components/ui/Input";
import { OtpFieldSchema, OtpField } from "../types";
import { Button } from "~/components/ui/Button";
import useSmartAccount from "~/hooks/useSmartAccount";
import { getSemaphoreProof } from "~/utils/semaphore";
import { useMaci } from "~/contexts/Maci";
import { useEthersSigner } from "~/hooks/useEthersSigner";
import { Spinner } from "~/components/ui/Spinner";
import { getHatsClient } from "~/utils/hatsProtocol";
import { Signer } from "ethers";

interface IVerifyOtpProps {
  emailField: {
    email: string;
  };
  otpVerified: boolean;
  setOtpVerified: Dispatch<SetStateAction<boolean>>;
}

const VerifyOtp = ({
  emailField,
  otpVerified,
  setOtpVerified,
}: IVerifyOtpProps): JSX.Element => {
  const { address, smartAccount, smartAccountClient } = useSmartAccount();
  const signer = useEthersSigner({ client: smartAccountClient });
  const { updateEligibility } = useMaci();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isWearerOfHat, setIsWearerOfHat] = useState(false);
  const [isSemaphoreMember, setIsSemaphoreMember] = useState(false);

  useEffect(() => {
    const getElegibility = async () => {
      if (!address) {
        return;
      }

      const hatsClient = getHatsClient();
      const wearingHat = await hatsClient.isWearerOfHat({
        wearer: address!,
        hatId: semaphore.hatId,
      });
      setIsWearerOfHat(wearingHat);

      const semaphoreIdentity = localStorage.getItem("semaphoreIdentity");
      if (!semaphoreIdentity) {
        return;
      }
      
      const identityCommitment = new Identity(semaphoreIdentity).commitment;

      // check if already signed to semaphore
      const isMember = await publicClient.readContract({
        address: semaphore.contracts.semaphore as Address,
        abi: SemaphoreAbi.abi,
        functionName: "hasMember",
        args: [1n, identityCommitment]
      }) as unknown as boolean;

      setIsSemaphoreMember(isMember);
    }

    getElegibility().catch(console.error);
  }, [address, otpVerified, setIsWearerOfHat, setIsSemaphoreMember]);

  const verifyOtp = async (otpField: OtpField) => {
    if (!address) {
      throw new Error("Smart account does not exist");
    }

    let response: Response | undefined;
    try {
      setLoading(true);

      const { email: email } = emailField // the component that can call this function only renders when the email exists
      const { otp: otp } = otpField

      response = await fetch(`${config.backendUrl}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          address,
        }),
      });
    } catch (error: any) {
      console.error(error);
      setLoading(false);
      toast.error(
        `An unexpected error occured verifying the OTP ${error instanceof Error ? `- ${error.message}` : ""}`
      );
      return;
    }

    if (!response.ok) {
      const json = await response.json();
      console.log(response.status);
      console.error(json);
      toast.error((json.errors && json.errors[0]) ?? json.message);
      setLoading(false);
    } else {
      toast.success("OTP verified - now joining Semaphore group");
      setOtpVerified(true);
      await joinSemaphoreGroup();
    }
  }

  const joinSemaphoreGroup = async () => {
    try {
      setLoading(true);
      if (!address || !smartAccount || !smartAccountClient) {
        throw new Error("Smart account does not exist");
      }

      const semaphoreIdentity = localStorage.getItem("semaphoreIdentity");
      if (!semaphoreIdentity || !signer) {
        throw new Error("No Semaphore Identity or signer");
      }

      const hatsClient = getHatsClient();
      const wearingHat = await hatsClient.isWearerOfHat({
        wearer: address!,
        hatId: semaphore.hatId,
      });
      setIsWearerOfHat(wearingHat);

      if (!wearingHat) {
        throw new Error("Account not wearing hat");
      }

      const identityCommitment = new Identity(semaphoreIdentity).commitment;
      const data = encodeAbiParameters(parseAbiParameters("uint"), [
        semaphore.hatId,
      ]);

      const { request } = await publicClient.simulateContract({
        account: smartAccount,
        address: semaphore.contracts.semaphore as Address,
        abi: SemaphoreAbi.abi,
        functionName: "gateAndAddMember",
        args: [identityCommitment, data],
      });
      const txHash = await smartAccountClient.writeContract(request);
      console.log("txHash", txHash);

      // TODO: (merge-ok) come up with a better fix
      await new Promise((resolve) => setTimeout(resolve, 20000));
      toast.success("Joined Semaphore group");

      await tryUpdateEligibility(signer, semaphoreIdentity);
    } catch (error) {
      toast.error(
        `An unexpected error occured ${error instanceof Error ? `- ${error.message}` : ""}`
      );
    } finally {
      setLoading(false);
    }
  };

  const tryUpdateEligibility = async (
    signer: Signer,
    semaphoreIdentity: string
  ) => {
    try {
      const proof = await getSemaphoreProof(
        signer,
        new Identity(semaphoreIdentity)
      );
      await updateEligibility(proof, address);
      router.push("/signup");
    } catch {
      throw new Error(
        "Could not update eligibility but joined semaphore group. Navigate to the homepage and wait a few mins for eligibility to be updated"
      );
    }
  };

  return (
    <div className="w-72 sm:w-96">
      {!isWearerOfHat && !isSemaphoreMember && (
        <Form schema={OtpFieldSchema} onSubmit={(otp) => verifyOtp(otp)}>
          <FormSection
            description="Please enter the one-time-password (OTP) you recieved in your email"
            title="Enter OTP"
          >
            <FormControl
              required
              valueAsNumber
              hint="Check your 'pse.dev' or 'ethereum.org' inbox for the OTP"
              label="OTP"
              name="otp"
            >
              <Input placeholder="1234" type="number" />
            </FormControl>
            <Button
              suppressHydrationWarning
              size="auto"
              type="submit"
              variant="secondary"
            >
              {loading ? <Spinner className="h-6 w-6" /> : "Verify OTP"}
            </Button>
          </FormSection>
        </Form>
      )} 

      {
        isWearerOfHat && !isSemaphoreMember && (
          <Button variant="secondary" onClick={joinSemaphoreGroup}>
            {loading ? <Spinner className="h-6 w-6" /> : "Join Semaphore group"}
          </Button>
        )
      }
    </div>
  )
}

export default VerifyOtp
