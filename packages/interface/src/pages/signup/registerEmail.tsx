import { useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";

import { EligibilityDialog } from "~/components/EligibilityDialog";
import { Heading } from "~/components/ui/Heading";
import { config } from "~/config";
import { FAQList } from "~/features/signup/components/FaqList";
import { Layout } from "~/layouts/DefaultLayout";
import { Form, FormControl, FormSection } from "~/components/ui/Form";
import { Input } from "~/components/ui/Input";
import {
  EmailSchema,
  Email,
  OtpSchema,
  OTP,
} from "../../features/signup/types";
import { Button } from "~/components/ui/Button";

const RegisterEmail = (): JSX.Element => {
  const [otpEmailSent, setOtpEmailSent] = useState(false);
  const router = useRouter();

  const registerEmail = async (email: Email) => {
    console.log("OTP has been sent to ", email);

    // TODO: (merge-ok) add this logic after scaffolding flow
    // const url = "http://localhost:3001/send-otp";
    // try {
    //   const response = await fetch(url, {
    //     method: "POST",
    //     body: JSON.stringify({ email: email }),
    //   });
    //   if (!response.ok) {
    //     console.log(response.status);
    //   } else {
    //     console.log(response);
    //   }
    // } catch (error: any) {
    //   console.error(error);
    // }
    setOtpEmailSent(true);
  };

  const verifyOtp = async (otp: OTP) => {
    console.log("Verifying OTP: ", otp);

    const account = await generateEmbeddedAccount();
    await joinSemaporeGroup(account);

    // update state so that other options now show on signup page?
    router.push("/signup");
  };

  const generateEmbeddedAccount = async () => {
    console.log("Generating new account");
    return "";
  };

  const joinSemaporeGroup = async (account: string) => {
    console.log("Joining Semaphore group with account ", account);
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

        <Form schema={EmailSchema} onSubmit={(email) => registerEmail(email)}>
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
        {otpEmailSent && (
          <Form schema={OtpSchema} onSubmit={(otp) => verifyOtp(otp)}>
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
