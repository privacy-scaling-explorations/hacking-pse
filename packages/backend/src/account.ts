import { createPublicClient, createWalletClient, http} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { optimismSepolia } from "viem/chains"
import { PRIVATE_KEY } from './constants'

// create an account from the private key
export const account = privateKeyToAccount(PRIVATE_KEY)

// a public client for reading data
export const publicClient = createPublicClient({
    chain: optimismSepolia,
    transport: http()
})

// a wallet client for signing transactions
export const walletClient = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http()
})
