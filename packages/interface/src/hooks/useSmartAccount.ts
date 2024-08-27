import { useState, useEffect } from "react";
import { HttpTransport, Chain, http, Address } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  createSmartAccountClient,
  ENTRYPOINT_ADDRESS_V07,
  SmartAccountClient,
} from "permissionless";
import {
  KernelEcdsaSmartAccount,
  signerToEcdsaKernelSmartAccount,
} from "permissionless/accounts";
import { EntryPoint } from "permissionless/types";
import {
  paymasterClient,
  pimlicoBundlerClient,
  publicClient,
} from "~/utils/permissionless";

import { config, getPimlicoRPCURL } from "~/config";

const createAccount = async (
  privateKey: string
): Promise<KernelEcdsaSmartAccount<EntryPoint, HttpTransport, Chain>> => {
  const signer = privateKeyToAccount(privateKey);
  return await signerToEcdsaKernelSmartAccount(publicClient, {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    signer,
    index: 0n,
  });
};

const createAccountClient = async (
  kernelAccount: KernelEcdsaSmartAccount<EntryPoint, HttpTransport, Chain>
) => {
  return createSmartAccountClient({
    account: kernelAccount,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: config.network,
    bundlerTransport: http(getPimlicoRPCURL()),
    middleware: {
      sponsorUserOperation: paymasterClient.sponsorUserOperation,
      gasPrice: async () =>
        (await pimlicoBundlerClient.getUserOperationGasPrice()).fast,
    },
  });
};

const useSmartAccount = () => {
  const [address, setAddress] = useState<Address>();
  const [smartAccount, setSmartAccount] =
    useState<KernelEcdsaSmartAccount<EntryPoint, HttpTransport, Chain>>();
  const [smartAccountClient, setSmartAccountClient] =
    useState<SmartAccountClient<EntryPoint, HttpTransport, Chain>>();

  useEffect(() => {
    const getSmartAccount = async () => {
      const ecdsaPrivKey = localStorage.getItem("ecdsaPrivKey");
      const accountAddress = localStorage.getItem("accountAddress");

      let kernelAccount: KernelEcdsaSmartAccount<
        EntryPoint,
        HttpTransport,
        Chain
      >;
      let kernelAccountClient: SmartAccountClient<
        EntryPoint,
        HttpTransport,
        Chain
      >;
      if (ecdsaPrivKey && accountAddress) {
        // return account with existing private key
        kernelAccount = await createAccount(ecdsaPrivKey);
        kernelAccountClient = await createAccountClient(kernelAccount);
      } else {
        // return account with new private key
        const newPrivateKey = generatePrivateKey();
        kernelAccount = await createAccount(newPrivateKey);
        kernelAccountClient = await createAccountClient(kernelAccount);

        localStorage.setItem("ecdsaPrivKey", newPrivateKey);
        localStorage.setItem("accountAddress", kernelAccount.address);
      }

      setAddress(kernelAccount.address);
      setSmartAccount(kernelAccount);
      setSmartAccountClient(kernelAccountClient);
    };
    getSmartAccount();
  }, []);

  return { address, smartAccount, smartAccountClient };
};

export default useSmartAccount;
