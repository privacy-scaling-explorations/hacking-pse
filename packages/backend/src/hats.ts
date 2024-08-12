import { HatsClient } from '@hatsprotocol/sdk-v1-core'
import { type PublicClient } from 'viem'
import { optimismSepolia } from "viem/chains"
import { publicClient, walletClient } from './account'

/**
 * Create a write-enabled hats client 
 */
export const hatsClient = new HatsClient({
    chainId: optimismSepolia.id,
    publicClient: publicClient as unknown as PublicClient,
    walletClient,
})
