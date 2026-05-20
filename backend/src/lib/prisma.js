import { PrismaClient } from '@prisma/client'

// Single shared instance — avoids opening multiple DB connections
const prisma = new PrismaClient()

export default prisma
