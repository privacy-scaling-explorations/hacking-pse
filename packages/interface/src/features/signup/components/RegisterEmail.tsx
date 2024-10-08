import { useState } from "react";
import { toast } from "sonner";

import { config } from "~/config";
import { Form, FormControl, FormSection } from "~/components/ui/Form";
import { Input } from "~/components/ui/Input";
import { EmailFieldSchema, EmailField } from "../types";
import { Button } from "~/components/ui/Button";
import { Spinner } from "~/components/ui/Spinner";

interface IRegisterEmailProps {
  otpVerified: boolean;
  setEmail: (emailField: EmailField) => void;
}

const RegisterEmail = ({
  otpVerified,
  setEmail,
}: IRegisterEmailProps): JSX.Element => {
  const [registering, setRegistering] = useState(false);

  const registerEmail = async (emailField: EmailField) => {
    try {
      setRegistering(true);
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
    } catch (error: any) {
      console.error(error);
      toast.error("An unexpected error occured registering your email");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="w-72 sm:w-96">
      <Form
        schema={EmailFieldSchema}
        onSubmit={(email) => registerEmail(email)}
      >
        <FormSection
          description="Please register with your 'pse.dev' or 'ethereum.org' email."
          title="Register"
        >
          <FormControl
            required
            hint="This is your 'pse.dev' or 'ethereum.org' email address"
            label="Email address"
            name="email"
          >
            <Input placeholder="bob@pse.dev | alice@ethereum.org" />
          </FormControl>
          <Button
            suppressHydrationWarning
            size="auto"
            type="submit"
            variant={otpVerified ? "disabled" : "secondary"}
          >
            {registering ? <Spinner className="h-6 w-6" /> : "Submit"}
          </Button>
        </FormSection>
      </Form>
    </div>
  );
};

export default RegisterEmail;
