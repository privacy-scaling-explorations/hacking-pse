import { PubKey, MACI__factory as MACIFactory } from "maci-cli/sdk";
import {
  parseEventLogs,
  decodeEventLog,
  Address,
  HttpTransport,
  Chain,
} from "viem";
import { SmartAccountClient } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { KernelEcdsaSmartAccount } from "permissionless/accounts";
import { config } from "~/config";
import { publicClient } from "./permissionless";

const signUp = async (
  smartAccount: KernelEcdsaSmartAccount<EntryPoint, HttpTransport, Chain>,
  smartAccountClient: SmartAccountClient<EntryPoint, HttpTransport, Chain>,
  maciPubKey: string,
  sgData: string
) => {
  const pubKey = PubKey.deserialize(maciPubKey);
  const { request } = await publicClient.simulateContract({
    account: smartAccount,
    address: config.maciAddress! as Address,
    abi: MACIFactory.abi,
    functionName: "signUp",
    args: [
      {
        x: pubKey.rawPubKey[0],
        y: pubKey.rawPubKey[1],
      },
      sgData as Address,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ],
  });
  const txHash = await smartAccountClient.writeContract(request);
  console.log(txHash);
  const txReceipt = await publicClient.getTransactionReceipt({
    hash: txHash,
  });

  const logs = parseEventLogs({
    abi: MACIFactory.abi,
    eventName: "SignUp",
    args: {
      _userPubKeyX: PubKey.deserialize(maciPubKey).rawPubKey[0],
    },
    logs: txReceipt.logs,
  });

  if (!logs[0]) {
    throw new Error("Unexpected event logs");
  }

  const topics = decodeEventLog({
    abi: MACIFactory.abi,
    data: logs[0]?.data,
    topics: logs[0]?.topics,
    eventName: "SignUp",
  });
  if (!topics.args) {
    throw new Error("Expected event to have arguments but found none");
  }

  const stateIndex = (topics.args as unknown as { _stateIndex: bigint })
    ._stateIndex;
  return stateIndex;
};

export default signUp;
