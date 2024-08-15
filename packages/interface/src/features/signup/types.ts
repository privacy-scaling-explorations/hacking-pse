import type { ReactNode } from "react";
import { z } from "zod";

export interface FAQItemProps {
  title: string;
  description: ReactNode;
}

export const EmailSchema = z.object({
  email: z.string().email()
});

export type Email = z.infer<typeof EmailSchema>;

export const OtpSchema = z.object({
  otp: z.number()
});

export type OTP = z.infer<typeof OtpSchema>;
