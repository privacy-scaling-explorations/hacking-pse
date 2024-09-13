import { AttestationRequest, NO_EXPIRATION, ZERO_ADDRESS, ZERO_BYTES32, type MultiAttestationRequest } from "@ethereum-attestation-service/eas-sdk";
import { EAS__factory as EASFactory } from '@ethereum-attestation-service/eas-contracts';
import { type DefaultError, type UseMutationResult, useMutation } from "@tanstack/react-query";

import { useEthersSigner } from "~/hooks/useEthersSigner";
import { createAttestation } from "~/lib/eas/createAttestation";
import useSmartAccount from "./useSmartAccount";
import { Address, encodeFunctionData, Hex } from "viem";
import { eas } from "~/config";
import sendUserOperation from "~/utils/sendUserOperation";

export function useCreateAttestation(): UseMutationResult<
  AttestationRequest,
  DefaultError,
  { values: Record<string, unknown>; schemaUID: string }
> {
  const { smartAccountClient } = useSmartAccount();
  const signer = useEthersSigner({ client: smartAccountClient });

  return useMutation({
    mutationFn: async (data: { values: Record<string, unknown>; schemaUID: string }) => {
      if (!signer) {
        throw new Error("Connect wallet first");
      }

      return createAttestation(data, signer);
    },
  });
}

export function useAttest(): UseMutationResult<Hex, DefaultError, MultiAttestationRequest[]> {
  const { smartAccount, smartAccountClient } = useSmartAccount();
  const signer = useEthersSigner({ client: smartAccountClient });

  return useMutation({
    mutationFn: async (attestations: MultiAttestationRequest[]) => {
      if (!smartAccount || !smartAccountClient) {
        throw new Error("Smart account not connected");
      }
      
      const multiAttestationRequests = attestations.map((r) => ({
        schema: r.schema as Hex,
        data: r.data.map((d) => ({
          recipient: (d.recipient ?? ZERO_ADDRESS) as Address,
          expirationTime: d.expirationTime ?? NO_EXPIRATION,
          revocable: d.revocable ?? true,
          refUID: (d.refUID ?? ZERO_BYTES32) as Hex,
          data: (d.data ?? ZERO_BYTES32) as Hex,
          value: d.value ?? 0n
        }))
      }));
      
      const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
        const total = data.reduce((res, r) => res + r.value, 0n);
        return res + total;
      }, 0n);
      
      if (requestedValue > 0n) {
        throw new Error("Cannot sponsor a user operation that sends value")
      }
      
      try {
        const to = eas.contracts.eas as Address;
        const calldata = encodeFunctionData({
          abi: EASFactory.abi,
          functionName: "multiAttest",
          args: [multiAttestationRequests],
        });
        return await sendUserOperation(
          to,
          calldata,
          smartAccount,
          smartAccountClient
        );
      } catch (error: unknown) {
        console.error(error);
        throw new Error(`Error attesting ${error instanceof Error ? `- ${error.message}` : ""}`);
      }
    },
  });
}
