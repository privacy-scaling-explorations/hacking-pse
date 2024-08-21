import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient,
} from "permissionless/clients/pimlico";
import { createPublicClient, http } from "viem";

import { getRPCURL, getPimlicoRPCURL, config } from "~/config";

export const publicClient = createPublicClient({
  chain: config.network,
  transport: http(getRPCURL()),
});

export const paymasterClient = createPimlicoPaymasterClient({
  chain: config.network,
  transport: http(getPimlicoRPCURL()),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});

export const pimlicoBundlerClient = createPimlicoBundlerClient({
  chain: config.network,
  transport: http(getPimlicoRPCURL()),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});
