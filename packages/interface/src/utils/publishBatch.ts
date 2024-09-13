import {
  IPublishBatchArgs,
  IPublishBatchData,
  PubKey,
  MACI__factory as MACIFactory,
  Poll__factory as PollFactory,
} from "maci-cli/sdk";
import {
  IG1ContractParams,
  IMessageContractParams,
  Keypair,
  PCommand,
  PrivKey,
} from "maci-domainobjs";
import { genRandomSalt } from "maci-crypto";
import { SmartAccountClient } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { KernelEcdsaSmartAccount } from "permissionless/accounts";
import { Address, HttpTransport, Chain, encodeFunctionData } from "viem";
import sendUserOperation from "./sendUserOperation";

const MESSAGE_TREE_ARITY = 5;

type ISmartAccountPublishBatchArgs = IPublishBatchArgs & {
  smartAccount: KernelEcdsaSmartAccount<EntryPoint, HttpTransport, Chain>;
  smartAccountClient: SmartAccountClient<EntryPoint, HttpTransport, Chain>;
};

/**
 * @notice copied from maci-cli/sdk to add sponsorship
 * Batch publish new messages to a MACI Poll contract
 * @param {IPublishBatchArgs} args - The arguments for the publish command
 * @returns {IPublishBatchData} The ephemeral private key used to encrypt the message, transaction hash
 */
export const publishBatch = async ({
  messages,
  pollId,
  maciAddress,
  publicKey,
  privateKey,
  signer,
  quiet = true,
  smartAccount,
  smartAccountClient,
}: ISmartAccountPublishBatchArgs): Promise<IPublishBatchData> => {
  if (!PubKey.isValidSerializedPubKey(publicKey)) {
    throw new Error("invalid MACI public key");
  }

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    throw new Error("invalid MACI private key");
  }

  if (pollId < 0n) {
    throw new Error(`invalid poll id ${pollId}`);
  }

  const userMaciPubKey = PubKey.deserialize(publicKey);
  const userMaciPrivKey = PrivKey.deserialize(privateKey);
  const maciContract = MACIFactory.connect(maciAddress, signer);
  const pollContracts = await maciContract.getPoll(pollId);

  const pollContract = PollFactory.connect(pollContracts.poll, signer);

  const [treeDepths, coordinatorPubKeyResult] = await Promise.all([
    pollContract.treeDepths(),
    pollContract.coordinatorPubKey(),
  ]);
  const maxVoteOptions = Number(
    BigInt(MESSAGE_TREE_ARITY) ** treeDepths.voteOptionTreeDepth
  );

  // validate the vote options index against the max leaf index on-chain
  messages.forEach(({ stateIndex, voteOptionIndex, salt, nonce }) => {
    if (voteOptionIndex < 0 || maxVoteOptions < voteOptionIndex) {
      throw new Error("invalid vote option index");
    }

    // check < 1 cause index zero is a blank state leaf
    if (stateIndex < 1) {
      throw new Error("invalid state index");
    }

    if (nonce < 0) {
      throw new Error("invalid nonce");
    }
  });

  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyResult.x.toString()),
    BigInt(coordinatorPubKeyResult.y.toString()),
  ]);

  const encryptionKeypair = new Keypair();
  const sharedKey = Keypair.genEcdhSharedKey(
    encryptionKeypair.privKey,
    coordinatorPubKey
  );

  const payload: [IMessageContractParams, IG1ContractParams][] = messages.map(
    ({ salt, stateIndex, voteOptionIndex, newVoteWeight, nonce }) => {
      const userSalt = salt ? BigInt(salt) : genRandomSalt();

      // create the command object
      const command = new PCommand(
        stateIndex,
        userMaciPubKey,
        voteOptionIndex,
        newVoteWeight,
        nonce,
        BigInt(pollId),
        userSalt
      );

      // sign the command with the user private key
      const signature = command.sign(userMaciPrivKey);

      const message = command.encrypt(signature, sharedKey);

      return [
        message.asContractParam(),
        encryptionKeypair.pubKey.asContractParam(),
      ];
    }
  );

  const preparedMessages = payload.map(([message]) => message);
  const preparedKeys = payload.map(([, key]) => key);

  // TODO: (merge-ok) make this type casting/handling nicer
  const reversedMessages = preparedMessages.reverse().map((item) => ({
    data: item.data.map((val) => BigInt(val)) as [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
    ],
  }));
  const reversedKeys = preparedKeys.reverse() as readonly {
    x: bigint;
    y: bigint;
  }[];

  const to = pollContracts.poll as Address;
  const calldata = encodeFunctionData({
    abi: PollFactory.abi,
    functionName: "publishMessageBatch",
    args: [reversedMessages, reversedKeys],
  });

  const userOpHash = await sendUserOperation(
    to,
    calldata,
    smartAccount,
    smartAccountClient
  );
  console.log("publishMessageBatch userOpHash", userOpHash);

  return {
    hash: userOpHash,
    encryptedMessages: preparedMessages,
    privateKey: encryptionKeypair.privKey.serialize(),
  };
};
