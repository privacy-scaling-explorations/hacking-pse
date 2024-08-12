import dotenv from 'dotenv'
dotenv.config()

export const HATS_ADDRESS = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137"
export const HAT_ID = process.env.HAT_ID || "0"
export const CHAIN_ID = "11155420"
export const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY && process.env.ETH_PRIVATE_KEY.startsWith("0x") ? process.env.ETH_PRIVATE_KEY as `0x${string}` : `0x${process.env.ETH_PRIVATE_KEY}` as `0x${string}`