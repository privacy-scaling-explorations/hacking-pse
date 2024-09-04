import dotenv from 'dotenv'
dotenv.config()

export const HAT_ID = process.env.HAT_ID || "0"
export const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY && process.env.ETH_PRIVATE_KEY.startsWith("0x") ? process.env.ETH_PRIVATE_KEY as `0x${string}` : `0x${process.env.ETH_PRIVATE_KEY}` as `0x${string}`
export const PORT = Number.parseInt(process.env.PORT!) || 3001
export const BIND_IP = process.env.BIND_IP || "0.0.0.0"
export const TLS_KEY = process.env.TLS_KEY || "./key.pem"
export const TLS_CERT = process.env.TLS_CERT || "./cert.pem"
