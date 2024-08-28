import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import { HttpTransport, Chain, createWalletClient, http } from "viem";
import { SmartAccountClient } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { useConnectorClient } from "wagmi";
import { getRPCURL } from "~/config";

function clientToSigner(client: SmartAccountClient<EntryPoint, HttpTransport, Chain>): JsonRpcSigner | undefined {
  const { account, chain } = client;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!chain || !account) {
    return undefined;
  }

  const walletClient = createWalletClient({
    account, 
    chain: chain,
    transport: http(getRPCURL()), 
  })

  const provider = new BrowserProvider(walletClient.transport, {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  });

  return new JsonRpcSigner(provider, account.address);
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId, client }: { chainId?: number, client?: SmartAccountClient<EntryPoint, HttpTransport, Chain> } = {}): JsonRpcSigner | undefined {
  const { data: connectorClient } = useConnectorClient({ chainId });
  const resolvedClient = client ?? connectorClient;

  return useMemo(() => (resolvedClient ? clientToSigner(resolvedClient) : undefined), [resolvedClient]);
}
