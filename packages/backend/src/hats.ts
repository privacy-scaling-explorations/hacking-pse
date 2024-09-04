import { HatsClient } from '@hatsprotocol/sdk-v1-core'
import { type PublicClient } from 'viem'
import { publicClient, walletClient } from './account'
import getNetwork from './getNetwork'

/**
 * Create a write-enabled hats client 
 */
export const hatsClient = new HatsClient({
    chainId: getNetwork().id,
    publicClient: publicClient as unknown as PublicClient,
    walletClient,
})
