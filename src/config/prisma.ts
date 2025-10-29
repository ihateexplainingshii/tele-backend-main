import { PrismaClient } from '@prisma/client'

// Initialize the Prisma Client
const prisma = new PrismaClient({
  // Optional: Log database queries for debugging purposes
  log: ['query', 'info', 'warn', 'error'],
})

// Export the initialized client as the default export
export default prisma