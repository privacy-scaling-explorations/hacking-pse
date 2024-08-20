import { isAddress } from "viem";
import z from "zod";

export const VerifyOtpSchema = z.object({
  email: z.string().email().endsWith("@pse.dev"),
  otp: z.number().int().gte(100000).lte(999999),
  address: z.string().refine(isAddress, {
    message: "Invalid address",
  }),
  identityCommitment: z.string().transform((val) => BigInt(val)),
});

export type VerifyOtp = z.infer<typeof VerifyOtpSchema>;
