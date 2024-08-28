import dotenv from 'dotenv'
dotenv.config()

export const HATS_ADDRESS = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137"
export const SEMAPHORE_ADDRESS = "0x71B93f8b0583f4033FAA1EE47d448B572933cefe"
export const HAT_ID = process.env.HAT_ID || "0"
export const CHAIN_ID = "11155420"
export const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY && process.env.ETH_PRIVATE_KEY.startsWith("0x") ? process.env.ETH_PRIVATE_KEY as `0x${string}` : `0x${process.env.ETH_PRIVATE_KEY}` as `0x${string}`
export const PORT = Number.parseInt(process.env.PORT!) || 3001
export const BIND_IP = process.env.BIND_IP || "0.0.0.0"
export const TLS_KEY = process.env.TLS_KEY || "./key.pem"
export const TLS_CERT = process.env.TLS_CERT || "./cert.pem"
