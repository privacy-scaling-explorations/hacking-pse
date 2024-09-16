import { createPublicClient, createWalletClient, http} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { PRIVATE_KEY } from './constants'
import getNetwork from './getNetwork';
import { getRpcUrl } from './getRpcUrl';

// create an account from the private key
export const account = privateKeyToAccount(PRIVATE_KEY)

const chain = getNetwork();

// a public client for reading data
export const publicClient = createPublicClient({
    chain,
    transport: http(getRpcUrl())
})

// a wallet client for signing transactions
export const walletClient = createWalletClient({
    account,
    chain,
    transport: http(getRpcUrl())
})
