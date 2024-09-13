import {
  UserOperation,
  EstimateUserOperationGasParameters,
  ENTRYPOINT_ADDRESS_V07,
  SmartAccountClient,
} from "permissionless";
import { EntryPoint, ENTRYPOINT_ADDRESS_V07_TYPE } from "permissionless/types";
import { Address, Chain, Hex, HttpTransport } from "viem";
import { publicClient, pimlicoBundlerClient } from "./permissionless";
import { KernelEcdsaSmartAccount } from "permissionless/accounts";

export default async function sendUserOperation(
  to: Address,
  calldata: Hex,
  smartAccount: KernelEcdsaSmartAccount<EntryPoint, HttpTransport, Chain>,
  smartAccountClient: SmartAccountClient<EntryPoint, HttpTransport, Chain>
) {
  const estimateGasFees = await publicClient.estimateFeesPerGas();

  const partialUserOperation: UserOperation<"v0.7"> = {
    sender: smartAccount.address,
    nonce: await smartAccount.getNonce(),
    callData: await smartAccount.encodeCallData({
      to,
      value: 0n,
      data: calldata,
    }),
    callGasLimit: 0n,
    verificationGasLimit: 0n,
    preVerificationGas: 0n,
    maxFeePerGas: estimateGasFees.maxFeePerGas,
    maxPriorityFeePerGas: estimateGasFees.maxPriorityFeePerGas,
    signature: "0x",
  };

  const dummySignature =
    await smartAccount.getDummySignature(partialUserOperation);

  const estimateGasUserOperation: EstimateUserOperationGasParameters<ENTRYPOINT_ADDRESS_V07_TYPE> =
    {
      userOperation: {
        ...partialUserOperation,
        signature: dummySignature,
      },
      entryPoint: ENTRYPOINT_ADDRESS_V07,
    };
  const gasValues = await pimlicoBundlerClient.estimateUserOperationGas(
    estimateGasUserOperation
  );

  // estimateUserOperationGas fails to accurately estimate the callGasLimit when sending a
  // userOp with calldata over a certain size. Adding a buffer ensures the userOp succeeds
  // in this case
  const multiplier = 10n; // 10%
  const callGasLimitBuffer = (gasValues.callGasLimit / 100n) * multiplier;

  const userOpHash = await smartAccountClient.sendUserOperation({
    account: smartAccount,
    userOperation: {
      ...partialUserOperation,
      callGasLimit: gasValues.callGasLimit + callGasLimitBuffer,
      verificationGasLimit: gasValues.verificationGasLimit,
      preVerificationGas: gasValues.preVerificationGas,
    },
  });

  const userOpReceipt = await pimlicoBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
    timeout: 20000,
  });

  if (userOpReceipt && !userOpReceipt.success) {
    throw new Error(
      `User Operation reverted ${userOpHash}. ${userOpReceipt.reason ?? ""}`
    );
  }

  return userOpHash;
}
