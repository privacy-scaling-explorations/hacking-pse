import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Hex } from "viem";

import { config, eas } from "~/config";
import { type TransactionError } from "~/features/voters/hooks/useApproveVoters";
import { useAttest } from "~/hooks/useEAS";
import { useEthersSigner } from "~/hooks/useEthersSigner";
import useSmartAccount from "~/hooks/useSmartAccount";
import { createAttestation } from "~/lib/eas/createAttestation";

export function useApproveApplication(opts?: {
  onSuccess?: () => void;
}): UseMutationResult<Hex, Error | TransactionError, string[]> {
  const attest = useAttest();
  const { smartAccountClient } = useSmartAccount();
  const signer = useEthersSigner({ client: smartAccountClient });

  return useMutation({
    mutationFn: async (applicationIds: string[]) => {
      if (!signer) {
        throw new Error("Connect wallet first");
      }

      const attestations = await Promise.all(
        applicationIds.map((refUID) =>
          createAttestation(
            {
              values: { type: "application", round: config.roundId },
              schemaUID: eas.schemas.approval,
              refUID,
            },
            signer,
          ),
        ),
      );
      return attest.mutateAsync(attestations.map((att) => ({ ...att, data: [att.data] })));
    },
    onSuccess: () => {
      toast.success("Application approved successfully!");
      opts?.onSuccess?.();
    },
    onError: (err: Error | { reason?: string; data?: { message: string } }) =>
      toast.error("Application approve error", {
        description: err instanceof Error ? err.message : err.reason ?? err.data?.message
      }),
  });
}
