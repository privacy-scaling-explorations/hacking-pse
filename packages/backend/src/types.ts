import { isAddress } from "viem";
import z from "zod";

export const SendOtpSchema = z.object({
  email: z.string().email().endsWith("@pse.dev").refine(email => !email.includes('+'), {
    message: "Email must not contain '+'"
  }),
});

export type SendOtp = z.infer<typeof SendOtpSchema>;

export const VerifyOtpSchema = z.object({
  email: z.string()
    .email()
    .endsWith("@pse.dev")
    .refine(email => !email.includes('+'), {
      message: "Email must not contain '+'"
    }),
  otp: z.number().int().gte(100000).lte(999999),
  address: z.string().refine(isAddress, {
    message: "Invalid address",
  }),
});

export type VerifyOtp = z.infer<typeof VerifyOtpSchema>;
