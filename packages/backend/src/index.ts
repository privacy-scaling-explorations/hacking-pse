import express from 'express'
import bodyParser from 'body-parser'
import { isAddress } from "ethers"
import cors from "cors"

import { sendOtp, verifyOtp } from './otp'
import { getDb, initDb } from './db'
import { hatsClient } from './hats'
import { HAT_ID } from './constants'
import { account } from './account'

const app = express()
const port = 3001

// todo: update origin to the frontend domain
app.use(cors({
    allowedHeaders: "*",
    origin: "*",
    methods: "POST"
}))
app.use(bodyParser.json())

/**
 * Endpoint to request an OTP
 * 
 * @param email - the email address to send the OTP to
 * @returns a message indicating the OTP was sent successfully
 */
app.post('/send-otp', async (req, res) => {
    const { email } = req.body
    if (!email) {
        return res.status(400).json({ message: 'Email is required' })
    }

    // check email is from pse.dev
    if (!email.endsWith('@pse.dev')) {
        return res.status(400).json({ message: 'Invalid email domain' })
    }

    try {
        await sendOtp(email)
        res.status(200).json({ message: 'OTP sent successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Failed to send OTP', error })
    }
})

/**
 * Endpoint to verify an OTP
 * 
 * @param email - the email address to verify the OTP for
 * @param otp - the OTP to verify
 * @param address - the address to associate with the email
 * @returns a message indicating the OTP was verified successfully
 */
app.post('/verify-otp', async (req, res) => {
    const { email, otp, address } = req.body
    if (!email || !otp || !address) {
        return res.status(400).json({ message: 'Email, OTP and address are required' })
    }

    // check address
    if (!isAddress(address)) {
        return res.status(400).json({ message: 'Invalid address' })
    }

    // check email 
    if (!email.endsWith('@pse.dev')) {
        return res.status(400).json({ message: 'Invalid email domain' })
    }

    // check otp
    const isValid = await verifyOtp(email, otp)
    if (isValid) {
        const db = await getDb();

        try {
            // mint the hat
            const mintRes = await hatsClient.mintHat({
                account,
                hatId: BigInt(HAT_ID),
                wearer: address as `0x${string}`,
            })

            // we want to throw an error if the minting failed
            if (!mintRes.status) {
                throw new Error('Failed to mint hat')
            }

            // store the address in the db and give hat 
            const stmt = await db.prepare('INSERT INTO accounts (email, address) VALUES (?, ?)')
            await stmt.run(email, address)
            await stmt.finalize()

            // return success
            res.status(200).json({ message: 'OTP verified successfully' })
        } catch (error) {
            res.status(500).json({ message: 'Could not store account', error })
        } finally {
            await db.close()
        }
    } else {
        res.status(400).json({ message: 'Invalid or expired OTP' })
    }
})

// init db then start listening service
initDb().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })}).catch((err: any) => {
        console.error('Failed to initialize database', err)
    })
