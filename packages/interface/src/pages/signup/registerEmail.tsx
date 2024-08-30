import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { format } from "date-fns";
import { Address, encodeAbiParameters, parseAbiParameters } from "viem";
import { publicClient } from "~/utils/permissionless";
import { Identity } from "@semaphore-protocol/core";
import SemaphoreAbi from "~/utils/Semaphore.json";

import { EligibilityDialog } from "~/components/EligibilityDialog";
import { Heading } from "~/components/ui/Heading";
import { config, semaphore } from "~/config";
import { FAQList } from "~/features/signup/components/FaqList";
import { Layout } from "~/layouts/DefaultLayout";
import { Form, FormControl, FormSection } from "~/components/ui/Form";
import { Input } from "~/components/ui/Input";
import {
  EmailFieldSchema,
  EmailField,
  OtpFieldSchema,
  OtpField,
} from "../../features/signup/types";
import { Button } from "~/components/ui/Button";
import useSmartAccount from "~/hooks/useSmartAccount";
import { getSemaphoreProof } from "~/utils/semaphore";
import { useMaci } from "~/contexts/Maci";
import { useEthersSigner } from "~/hooks/useEthersSigner";
import { Spinner } from "~/components/ui/Spinner";

const RegisterEmail = (): JSX.Element => {
  const { address, smartAccount, smartAccountClient } = useSmartAccount();
  const signer = useEthersSigner({ client: smartAccountClient });
  const { updateEligibility } = useMaci();
  const router = useRouter();

  const [emailField, setEmail] = useState<EmailField>();
  const [loading, setLoading] = useState(false);

  const registerEmail = async (emailField: EmailField) => {
    try {
      setLoading(true);
      const response = await fetch(`${config.backendUrl}/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailField),
      });
      const json = await response.json();

      if (!response.ok) {
        console.log(response.status);
        console.error(json);
        toast.error((json.errors && json.errors[0]) ?? json.message);
      } else {
        setEmail(emailField);
        toast.success(`OTP has been sent to ${emailField.email}`);
      }

      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      toast.error("An unexpected error occured registering your email");
    }
  };

  const verifyOtp = async (otpField: OtpField) => {
    try {
      setLoading(true);
      if (!address) {
        throw new Error("Smart account does not exist");
      }

      const { email: email } = emailField!; // the component that can call this function only renders when the email exists
      const { otp: otp } = otpField;

      const response = await fetch(`${config.backendUrl}/verify-otp`, {
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
      const json = await response.json();

      if (!response.ok) {
        console.log(response.status);
        console.error(json);
        toast.error((json.errors && json.errors[0]) ?? json.message);
      } else {
        toast.success("OTP verified - now joining Semaphore group");
        await joinSemaphoreGroup();
        router.push("/signup");
      }

      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      toast.error("An unexpected error occured verifying the OTP");
    }
  };

  const joinSemaphoreGroup = async () => {
    if (!smartAccount || !smartAccountClient) {
      throw new Error("Smart account does not exist");
    }

    const semaphoreIdentity = localStorage.getItem("semaphoreIdentity");
    if (!semaphoreIdentity || !signer) {
      throw new Error("No Semaphore Identity or signer");
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

    const proof = await getSemaphoreProof(
      signer,
      new Identity(semaphoreIdentity)
    );
    await updateEligibility(proof, address);

    toast.success("Joined Semaphore group");
  };

  return (
    <Layout type="home">
      <EligibilityDialog />

      <div className="flex h-[90vh] w-screen flex-col items-center justify-center gap-4 bg-blue-50 dark:bg-black">
        <Heading className="max-w-screen-lg text-center" size="6xl">
          {config.eventName}
        </Heading>

        <Heading as="h2" className="max-w-screen-lg text-center" size="4xl">
          {config.roundId.toUpperCase()}
        </Heading>

        <p className="flex max-w-screen-md gap-2 text-center text-xl dark:text-gray-400">
          <span>
            {config.startsAt && format(config.startsAt, "d MMMM, yyyy")}
          </span>

          <span>-</span>

          <span>
            {config.resultsAt && format(config.resultsAt, "d MMMM, yyyy")}
          </span>
        </p>

        <Form
          schema={EmailFieldSchema}
          onSubmit={(email) => registerEmail(email)}
        >
          <FormSection
            description="Please register with your 'pse.dev' email."
            title="Register"
          >
            <FormControl
              required
              hint="This is your 'pse.dev' email address"
              label="Email address"
              name="email"
            >
              <Input placeholder="bob@pse.dev" />
            </FormControl>
            <Button
              suppressHydrationWarning
              size="auto"
              type="submit"
              variant="primary"
            >
              {loading ? <Spinner className="h-6 w-6" /> : "Submit"}
            </Button>
          </FormSection>
        </Form>
        {emailField && address && (
          <Form schema={OtpFieldSchema} onSubmit={(otp) => verifyOtp(otp)}>
            <FormSection
              description="Please enter the one-time-password (OTP) you recieved in your email"
              title="Enter OTP"
            >
              <FormControl
                required
                valueAsNumber
                hint="Check your 'pse.dev' inbox for the OTP"
                label="OTP"
                name="otp"
              >
                <Input placeholder="1234" type="number" />
              </FormControl>
              <Button
                suppressHydrationWarning
                size="auto"
                type="submit"
                variant="primary"
              >
                {loading ? <Spinner className="h-6 w-6" /> : "Verify OTP"}
              </Button>
            </FormSection>
          </Form>
        )}
      </div>

      <FAQList />
    </Layout>
  );
};

export default RegisterEmail;
