import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  // ── Article Types ──────────────────────────────────────────────────────────
  await prisma.articleType.createMany({
    data: [
      { name: 'Article' },
      { name: 'Blog Post' },
      { name: 'Webpage Copy' },
      { name: 'Social Post' },
      { name: 'Product Description' },
      { name: 'Email Newsletter' },
      { name: 'Press Release' },
      { name: 'Case Study' },
    ],
    skipDuplicates: true,
  })
  console.log('✓ Article types')

  // ── Clients ────────────────────────────────────────────────────────────────
  await prisma.client.createMany({
    data: [
      { name: 'Acme Corp' },
      { name: 'Bright Ideas Ltd' },
      { name: 'Nova Digital' },
      { name: 'Peak Performance' },
      { name: 'Greenleaf Organic' },
      { name: 'Horizon Tech' },
    ],
    skipDuplicates: true,
  })
  console.log('✓ Clients')

  // ── Users ──────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@agency.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@agency.com', password, role: 'ADMIN' },
  })

  const sarah = await prisma.user.upsert({
    where:  { email: 'sarah@agency.com' },
    update: {},
    create: { name: 'Sarah Chen', email: 'sarah@agency.com', password, role: 'WRITER' },
  })

  const james = await prisma.user.upsert({
    where:  { email: 'james@agency.com' },
    update: {},
    create: { name: 'James Okafor', email: 'james@agency.com', password, role: 'WRITER' },
  })

  const priya = await prisma.user.upsert({
    where:  { email: 'priya@agency.com' },
    update: {},
    create: { name: 'Priya Nair', email: 'priya@agency.com', password, role: 'WRITER' },
  })

  console.log('✓ Users (password for all: password123)')

  // ── Lookup IDs ─────────────────────────────────────────────────────────────
  const types   = await prisma.articleType.findMany()
  const clients = await prisma.client.findMany()

  const typeId   = (name) => types.find(t => t.name === name)?.id
  const clientId = (name) => clients.find(c => c.name === name)?.id

  const today  = new Date()
  const days   = (n) => new Date(today.getTime() + n * 86400000)

  // ── Sample Articles ────────────────────────────────────────────────────────
  const articles = [
    {
      title:            'How to Scale Your Content Strategy in 2025',
      status:           'WRITING',
      clientId:         clientId('Acme Corp'),
      articleTypeId:    typeId('Blog Post'),
      assignedWriterId: sarah.id,
      createdById:      admin.id,
      deadline:         days(5),
    },
    {
      title:            'Homepage Refresh — Hero and Feature Sections',
      status:           'REVIEW',
      clientId:         clientId('Nova Digital'),
      articleTypeId:    typeId('Webpage Copy'),
      assignedWriterId: james.id,
      createdById:      admin.id,
      deadline:         days(3),
    },
    {
      title:            'Spring Product Launch Email',
      status:           'BRIEF_PENDING',
      clientId:         clientId('Greenleaf Organic'),
      articleTypeId:    typeId('Email Newsletter'),
      assignedWriterId: priya.id,
      createdById:      admin.id,
      deadline:         days(10),
    },
    {
      title:            'Customer Success Story — Horizon Tech',
      status:           'REVISION',
      clientId:         clientId('Horizon Tech'),
      articleTypeId:    typeId('Case Study'),
      assignedWriterId: sarah.id,
      createdById:      admin.id,
      deadline:         days(2),
    },
    {
      title:            '5 Tips for Better Sleep — Sponsored Article',
      status:           'COMPLETED',
      clientId:         clientId('Peak Performance'),
      articleTypeId:    typeId('Article'),
      assignedWriterId: james.id,
      createdById:      admin.id,
      deadline:         days(-3),
    },
    {
      title:            'New Product Range — Social Campaign Copy',
      status:           'WRITING',
      clientId:         clientId('Bright Ideas Ltd'),
      articleTypeId:    typeId('Social Post'),
      assignedWriterId: priya.id,
      createdById:      admin.id,
      deadline:         days(7),
    },
    {
      title:            'Q2 Company Update Press Release',
      status:           'REVIEW',
      clientId:         clientId('Acme Corp'),
      articleTypeId:    typeId('Press Release'),
      assignedWriterId: sarah.id,
      createdById:      admin.id,
      deadline:         days(1),
    },
    {
      title:            'Organic Skincare Line — Product Descriptions',
      status:           'BRIEF_PENDING',
      clientId:         clientId('Greenleaf Organic'),
      articleTypeId:    typeId('Product Description'),
      assignedWriterId: james.id,
      createdById:      admin.id,
      deadline:         days(14),
    },
  ]

  for (const data of articles) {
    const existing = await prisma.article.findFirst({ where: { title: data.title } })
    if (existing) continue

    const article = await prisma.article.create({ data })

    await prisma.activityLog.create({
      data: {
        articleId:   article.id,
        changedById: admin.id,
        oldStatus:   null,
        newStatus:   'BRIEF_PENDING',
        note:        'Article created',
      },
    })

    // Add a second log entry for articles that have progressed
    if (data.status !== 'BRIEF_PENDING') {
      await prisma.activityLog.create({
        data: {
          articleId:   article.id,
          changedById: data.assignedWriterId,
          oldStatus:   'BRIEF_PENDING',
          newStatus:   data.status,
          note:        null,
        },
      })
    }
  }

  console.log('✓ Sample articles')
  console.log('\nSeed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
