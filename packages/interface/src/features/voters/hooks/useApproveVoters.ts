import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { Hex } from "viem";

import { config, eas } from "~/config";
import { useAttest } from "~/hooks/useEAS";
import { useEthersSigner } from "~/hooks/useEthersSigner";
import useSmartAccount from "~/hooks/useSmartAccount";
import { createAttestation } from "~/lib/eas/createAttestation";

// TODO: Move this to a shared folders
export interface TransactionError {
  reason?: string;
  data?: { message: string };
}

export function useApproveVoters(options: {
  onSuccess: () => void;
  onError: (err: TransactionError) => void;
}): UseMutationResult<Hex, unknown, string[]> {
  const attest = useAttest();
  const { smartAccountClient } = useSmartAccount();
  const signer = useEthersSigner({ client: smartAccountClient });

  return useMutation({
    mutationFn: async (voters: string[]) => {
      if (!signer) {
        throw new Error("Connect wallet first");
      }

      const attestations = await Promise.all(
        voters.map((recipient) =>
          createAttestation(
            {
              values: { type: "voter", round: config.roundId },
              schemaUID: eas.schemas.approval,
              recipient,
            },
            signer,
          ),
        ),
      );
      return attest.mutateAsync(attestations.map((att) => ({ ...att, data: [att.data] })));
    },
    ...options,
  });
}
