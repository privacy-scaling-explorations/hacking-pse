import { useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { Address, encodeAbiParameters, parseAbiParameters } from "viem";
import { publicClient } from "~/utils/permissionless";
import { Identity } from "@semaphore-protocol/core";
import SemaphoreAbi from "contracts/out/Semaphore.sol/Semaphore.json";

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

const RegisterEmail = (): JSX.Element => {
  const { address, smartAccount, smartAccountClient } = useSmartAccount();
  const router = useRouter();
  const [emailField, setEmail] = useState<EmailField>();

  const registerEmail = async (emailField: EmailField) => {
    const url = "http://localhost:3001/send-otp";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailField),
      });

      if (!response.ok) {
        console.log(response.status);
        console.log(await response.json());
      } else {
        setEmail(emailField);
        console.log("OTP has been sent to ", emailField.email);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const verifyOtp = async (otpField: OtpField) => {
    console.log("Verifying OTP: ", otpField.otp);
    if (!address) {
      throw new Error("Smart account does not exist");
    }

    const { email: email } = emailField!; // the component that can call this function only renders when the email exists
    const { otp: otp } = otpField;

    try {
      const url = "http://localhost:3001/verify-otp";
      const response = await fetch(url, {
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

      if (!response.ok) {
        console.log(response.status);
        console.log(await response.json());
      } else {
        await joinSemaphoreGroup();
        router.push("/signup");
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const joinSemaphoreGroup = async () => {
    console.log("Joining Semaphore group");

    if (!smartAccount || !smartAccountClient) {
      throw new Error("Smart account does not exist");
    }

    const semaphoreIdentity = localStorage.getItem("semaphoreIdentity");
    if (!semaphoreIdentity) {
      throw new Error("No Semaphore Identity");
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
              Submit
            </Button>
          </FormSection>
        </Form>
        {emailField && (
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
                Verify OTP
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
