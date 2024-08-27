import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

import { sendOtp, verifyOtp } from './otp'
import { getDb, initDb } from './db'
import { hatsClient } from './hats'
import { HAT_ID } from './constants'
import { account } from './account'
import { SendOtpSchema, VerifyOtpSchema } from './types';

const app = express()
const port = 3001

// todo: update origin to the frontend domain
app.use(cors({
    allowedHeaders: '*',
    origin: '*',
    methods: 'POST'
}))
app.use(bodyParser.json())

/**
 * Endpoint to request an OTP
 * 
 * @param email - the email address to send the OTP to
 * @returns a message indicating the OTP was sent successfully
 */
app.post('/send-otp', async (req, res) => {
    const result = SendOtpSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.issues.map((issue) => `${issue.path.join(".")} - ${issue.message}`);
        return res
            .status(400)
            .json({
                message: "Validation error(s)",
                errors
            });
    }
    const { email } = result.data;

    try {
        await sendOtp(email)
        return res.status(200).json({ message: 'OTP sent successfully' })
    } catch (error) {
        if (error instanceof Error) {
            // TODO: (merge-ok) 500 isn't appropriate in all cases e.g. "User already registered". Add better error handling
            return res.status(500).json({ message: error.message })
        }
        return res.status(500).json({ message: 'Failed to send OTP' })
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
    const result = VerifyOtpSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.issues.map((issue) => `${issue.path.join(".")} - ${issue.message}`);
        return res
            .status(400)
            .json({
                message: "Validation error(s)",
                errors
            });
    }

    const { email, otp, address } = result.data;

    // check otp
    const isValid = await verifyOtp(email, otp)
    if (!isValid) {
        return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    try {
        // mint the hat
        const mintRes = await hatsClient.mintHat({
            account,
            hatId: BigInt(HAT_ID),
            wearer: address as `0x${string}`,
        })

        // we want to throw an error if the minting failed
        if (!mintRes.status) {
            throw new Error('Transaction to mint hat reverted')
        }
    } catch (error) {
        return res.status(500).json({ message: 'Failed to mint hat' })
    }

    const db = await getDb()
    try {
        // store the address in the db and give hat 
        const stmt = await db.prepare('INSERT INTO accounts (email, address) VALUES (?, ?)')
        await stmt.run(email, address)
        await stmt.finalize()

        // return success
        return res.status(200).json({ message: 'OTP verified successfully' })
    } catch (error) {
        return res.status(500).json({ message: 'Could not store account', error })
    } finally {
        await db.close()
    }
})

// init db then start listening service
initDb().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })}).catch((err: any) => {
        console.error('Failed to initialize database', err)
    })
