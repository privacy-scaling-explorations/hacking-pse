import { useEffect, useState } from "react";
import { format } from "date-fns";

import { EligibilityDialog } from "~/components/EligibilityDialog";
import { Heading } from "~/components/ui/Heading";
import { config } from "~/config";
import { FAQList } from "~/features/signup/components/FaqList";
import { Layout } from "~/layouts/DefaultLayout";
import { EmailField } from "../../features/signup/types";
import VerifyOtp from "~/features/signup/components/VerifyOtp";
import RegisterEmail from "~/features/signup/components/RegisterEmail";
import useSmartAccount from "~/hooks/useSmartAccount";

const Register = (): JSX.Element => {
  const { address } = useSmartAccount();

  const [emailField, setEmail] = useState<EmailField>();
  const [otpVerified, setOtpVerified] = useState(false);

  const handleSetEmail = (emailField: EmailField) => {
    setEmail(emailField);
    localStorage.setItem("email", emailField.email);
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      setEmail({ email });
    }
  }, []);

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

        <RegisterEmail otpVerified={otpVerified} setEmail={handleSetEmail} />

        {emailField && address && (
          <VerifyOtp
            emailField={emailField}
            otpVerified={otpVerified}
            setOtpVerified={setOtpVerified}
          />
        )}
      </div>

      <FAQList />
    </Layout>
  );
};

export default Register;
