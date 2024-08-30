import { z } from 'zod';

import { EthAddressSchema } from '~/features/voters/types';
import { reverseKeys } from '~/utils/reverseKeys';

export const MetadataSchema = z.object({
  name: z.string().min(3),
  metadataType: z.enum(['1']),
  metadataPtr: z.string().min(3)
});

export const contributionTypes = {
  DEMO_VIDEO: 'Demo Video',
  GITHUB_REPO: 'Github repo',
  OTHER: 'Other'
} as const;

export const ApplicationSchema = z.object({
  name: z.string().min(3),
  bio: z.string().min(3),
  profileImageUrl: z.string().optional(),
  bannerImageUrl: z.string().optional(),
  websiteUrl: z
    .string()
    .min(1)
    .transform((url) =>
      // Automatically prepend "https://" if it's missing
      /^(http:\/\/|https:\/\/)/i.test(url) ? url : `https://${url}`
    ),
  github: z.string().optional(),
  twitter: z.string().optional(),
  contributionDescription: z.string().min(3),
  impactDescription: z.string().min(3),
  contributionLinks: z
    .array(
      z.object({
        description: z.string().min(3),
        type: z.nativeEnum(reverseKeys(contributionTypes)),
        url: z
          .string()
          .min(1)
          .transform((url) =>
            // Automatically prepend "https://" if it's missing
            /^(http:\/\/|https:\/\/)/i.test(url) ? url : `https://${url}`
          )
      })
    )
    .default([])
    .optional()
});

export type Application = z.infer<typeof ApplicationSchema>;

export const ApplicationsToApproveSchema = z.object({
  selected: z.array(z.string())
});
export type TApplicationsToApprove = z.infer<typeof ApplicationsToApproveSchema>;
