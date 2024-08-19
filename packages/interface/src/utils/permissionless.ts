import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient,
} from "permissionless/clients/pimlico";
import { createPublicClient, http } from "viem";

import { getRPCURL, getPimlicoRPCURL } from "~/config";

export const publicClient = createPublicClient({
  transport: http(getRPCURL()),
});

export const paymasterClient = createPimlicoPaymasterClient({
  transport: http(getPimlicoRPCURL()),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});

export const pimlicoBundlerClient = createPimlicoBundlerClient({
  transport: http(getPimlicoRPCURL()),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});
