import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import dotenv from "dotenv" 
import { randomInt } from 'crypto'

import { getDb } from './db'

dotenv.config()

/**
 * Send an OTP to the given email address
 * @param email - the email address to send the OTP to
 * @returns a message indicating the OTP was sent successfully
 */
export const sendOtp = async (email: string): Promise<SMTPTransport.SentMessageInfo> => {
  const otp = randomInt(100000, 1000000).toString() // Generate a 6-digit OTP
  const expiresAt = Date.now() + 5 * 60 * 1000 // OTP valid for 5 minutes

  const db = await getDb()

  // let's first check whether the caller has already registered
  const rowsAccount = await db.get(`SELECT email FROM accounts WHERE email = ?`, email)
  if (rowsAccount && rowsAccount.email) {
    throw new Error('User already registered')
  }

  // then let's check if there's already an otp which has not expired yet
  const rowsOtp = await db.get(`SELECT expiresAt FROM otps WHERE email = ?`, email)
  if (rowsOtp && rowsOtp.expiresAt >= Date.now()) {
    throw new Error('OTP already sent')
  }

  await db.run(
    `INSERT INTO otps (email, otp, expiresAt) VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET otp=excluded.otp, expiresAt=excluded.expiresAt`,
    email, otp, expiresAt
  )
  
  await db.close()
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.APP_PASSWORD,
    },
  });

  return transporter.sendMail(mailOptions)
}

/**
 * Verify an OTP for the given email address
 * @param email - the email address to verify the OTP for
 * @param otp - the OTP to verify
 * @returns a boolean indicating whether the OTP was verified successfully
 */
export const verifyOtp = async (email: string, otp: number): Promise<boolean> => {
  const db = await getDb()

  try {
    const row = await db.get(
      `SELECT otp, expiresAt FROM otps WHERE email = ?`,
      email
    )

    if (!row) return false
    if (row.expiresAt < Date.now()) return false
    if (row.otp.toString() !== otp.toString()) return false
  
    await db.run(`DELETE FROM otps WHERE email = ?`, email)
    return true
  } catch (error) {
    return false
  } finally {
    await db.close()
  }
}
