import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'

/**
 * Initialize the database
 * @returns the database
 */
export const initDb = async (): Promise<void> => {
  const db = await open({
    filename: './db.db',
    driver: sqlite3.Database
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS otps (
      email TEXT PRIMARY KEY,
      otp TEXT,
      expiresAt INTEGER
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      email TEXT PRIMARY KEY,
      address TEXT UNIQUE
    )
  `)
}

/**
 * Get the database
 * @returns the database
 */
export const getDb = async (): Promise<Database> => {
  return await open({
    filename: './db.db',
    driver: sqlite3.Database
  })
}
