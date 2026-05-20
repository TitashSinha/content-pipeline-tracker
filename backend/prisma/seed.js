import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  // ── Article Types ──────────────────────────────────────────────────────────
  await prisma.articleType.createMany({
    data: [
      { name: 'Article' },
      { name: 'Blog' },
      { name: 'Webpage Copy' },
      { name: 'Social Post' },
      { name: 'Product Description' },
    ],
    skipDuplicates: true,
  })
  console.log('✓ Article types')

  // ── Clients ────────────────────────────────────────────────────────────────
  await prisma.client.createMany({
    data: [
      { name: 'Acme Corp' },
      { name: 'Bright Ideas Ltd' },
    ],
    skipDuplicates: true,
  })
  console.log('✓ Clients')

  // ── Users ──────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('password123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@agency.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@agency.com', password, role: 'ADMIN' },
  })

  await prisma.user.upsert({
    where: { email: 'sarah@agency.com' },
    update: {},
    create: { name: 'Sarah Chen', email: 'sarah@agency.com', password, role: 'WRITER' },
  })

  await prisma.user.upsert({
    where: { email: 'james@agency.com' },
    update: {},
    create: { name: 'James Okafor', email: 'james@agency.com', password, role: 'WRITER' },
  })

  console.log('✓ Users (password for all: password123)')

  console.log('\nSeed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
