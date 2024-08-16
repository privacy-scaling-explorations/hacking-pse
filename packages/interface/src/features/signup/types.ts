import type { ReactNode } from "react";
import { z } from "zod";

export interface FAQItemProps {
  title: string;
  description: ReactNode;
}

export const EmailFieldSchema = z.object({
  email: z.string().email(),
});

export type EmailField = z.infer<typeof EmailFieldSchema>;

export const OtpFieldSchema = z.object({
  otp: z.number(),
});

export type OtpField = z.infer<typeof OtpFieldSchema>;
