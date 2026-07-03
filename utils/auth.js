import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing")
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}
