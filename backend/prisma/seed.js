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
  const password = await bcrypt.hash('Lexiconn@2025', 10)

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@lexiconn.in' },
    update: {},
    create: { name: 'Admin', email: 'admin@lexiconn.in', password, role: 'ADMIN' },
  })

  const nandakumar = await prisma.user.upsert({
    where:  { email: 'nandakumar@lexiconn.in' },
    update: {},
    create: { name: 'Nandakumar Menon', email: 'nandakumar@lexiconn.in', password, role: 'WRITER' },
  })

  const abhijeet = await prisma.user.upsert({
    where:  { email: 'abhijeet@lexiconn.in' },
    update: {},
    create: { name: 'Abhijeet Padhy', email: 'abhijeet@lexiconn.in', password, role: 'WRITER' },
  })

  const anjana = await prisma.user.upsert({
    where:  { email: 'anjana@lexiconn.in' },
    update: {},
    create: { name: 'Anjana M R', email: 'anjana@lexiconn.in', password, role: 'WRITER' },
  })

  const dinu = await prisma.user.upsert({
    where:  { email: 'dinu@lexiconn.in' },
    update: {},
    create: { name: 'Dinu Varkey', email: 'dinu@lexiconn.in', password, role: 'WRITER' },
  })

  const harsh = await prisma.user.upsert({
    where:  { email: 'harsh@lexiconn.in' },
    update: {},
    create: { name: 'Harsh Dugar', email: 'harsh@lexiconn.in', password, role: 'WRITER' },
  })

  const raavi = await prisma.user.upsert({
    where:  { email: 'raavi@lexiconn.in' },
    update: {},
    create: { name: 'Raavi Rathee', email: 'raavi@lexiconn.in', password, role: 'WRITER' },
  })

  const sakshi = await prisma.user.upsert({
    where:  { email: 'sakshi@lexiconn.in' },
    update: {},
    create: { name: 'Sakshi Bhatia', email: 'sakshi@lexiconn.in', password, role: 'WRITER' },
  })

  const sameer = await prisma.user.upsert({
    where:  { email: 'sameer@lexiconn.in' },
    update: {},
    create: { name: 'Sameer Saptiskar', email: 'sameer@lexiconn.in', password, role: 'WRITER' },
  })

  const taher = await prisma.user.upsert({
    where:  { email: 'taher@lexiconn.in' },
    update: {},
    create: { name: 'Taher Rajgara', email: 'taher@lexiconn.in', password, role: 'WRITER' },
  })

  const titash = await prisma.user.upsert({
    where:  { email: 'titash@lexiconn.in' },
    update: {},
    create: { name: 'Titash Sinha', email: 'titash@lexiconn.in', password, role: 'WRITER' },
  })

  console.log('✓ Users')

  // ── Lookup IDs ─────────────────────────────────────────────────────────────
  const types   = await prisma.articleType.findMany()
  const clients = await prisma.client.findMany()

  const typeId   = (name) => types.find(t => t.name === name)?.id
  const clientId = (name) => clients.find(c => c.name === name)?.id

  const today = new Date()
  const days  = (n) => new Date(today.getTime() + n * 86400000)

  // ── Sample Articles ────────────────────────────────────────────────────────
  const articles = [
    {
      title:            'How to Scale Your Content Strategy in 2025',
      status:           'WRITING',
      clientId:         clientId('Acme Corp'),
      articleTypeId:    typeId('Blog Post'),
      assignedWriterId: nandakumar.id,
      createdById:      admin.id,
      deadline:         days(5),
    },
    {
      title:            'Homepage Refresh — Hero and Feature Sections',
      status:           'REVIEW',
      clientId:         clientId('Nova Digital'),
      articleTypeId:    typeId('Webpage Copy'),
      assignedWriterId: abhijeet.id,
      createdById:      admin.id,
      deadline:         days(3),
    },
    {
      title:            'Spring Product Launch Email',
      status:           'BRIEF_PENDING',
      clientId:         clientId('Greenleaf Organic'),
      articleTypeId:    typeId('Email Newsletter'),
      assignedWriterId: anjana.id,
      createdById:      admin.id,
      deadline:         days(10),
    },
    {
      title:            'Customer Success Story — Horizon Tech',
      status:           'REVISION',
      clientId:         clientId('Horizon Tech'),
      articleTypeId:    typeId('Case Study'),
      assignedWriterId: dinu.id,
      createdById:      admin.id,
      deadline:         days(2),
    },
    {
      title:            '5 Tips for Better Sleep — Sponsored Article',
      status:           'COMPLETED',
      clientId:         clientId('Peak Performance'),
      articleTypeId:    typeId('Article'),
      assignedWriterId: harsh.id,
      createdById:      admin.id,
      deadline:         days(-3),
    },
    {
      title:            'New Product Range — Social Campaign Copy',
      status:           'WRITING',
      clientId:         clientId('Bright Ideas Ltd'),
      articleTypeId:    typeId('Social Post'),
      assignedWriterId: raavi.id,
      createdById:      admin.id,
      deadline:         days(7),
    },
    {
      title:            'Q2 Company Update Press Release',
      status:           'REVIEW',
      clientId:         clientId('Acme Corp'),
      articleTypeId:    typeId('Press Release'),
      assignedWriterId: sakshi.id,
      createdById:      admin.id,
      deadline:         days(1),
    },
    {
      title:            'Organic Skincare Line — Product Descriptions',
      status:           'BRIEF_PENDING',
      clientId:         clientId('Greenleaf Organic'),
      articleTypeId:    typeId('Product Description'),
      assignedWriterId: sameer.id,
      createdById:      admin.id,
      deadline:         days(14),
    },
    {
      title:            'B2B SaaS Onboarding Guide',
      status:           'WRITING',
      clientId:         clientId('Horizon Tech'),
      articleTypeId:    typeId('Article'),
      assignedWriterId: taher.id,
      createdById:      admin.id,
      deadline:         days(6),
    },
    {
      title:            'Autumn Collection Launch — Email Series',
      status:           'BRIEF_PENDING',
      clientId:         clientId('Bright Ideas Ltd'),
      articleTypeId:    typeId('Email Newsletter'),
      assignedWriterId: titash.id,
      createdById:      admin.id,
      deadline:         days(9),
    },
    {
      title:            'Peak Performance — Athlete Spotlight Blog',
      status:           'REVIEW',
      clientId:         clientId('Peak Performance'),
      articleTypeId:    typeId('Blog Post'),
      assignedWriterId: nandakumar.id,
      createdById:      admin.id,
      deadline:         days(4),
    },
    {
      title:            'Nova Digital — Services Page Rewrite',
      status:           'WRITING',
      clientId:         clientId('Nova Digital'),
      articleTypeId:    typeId('Webpage Copy'),
      assignedWriterId: abhijeet.id,
      createdById:      admin.id,
      deadline:         days(8),
    },
    {
      title:            'Horizon Tech — LinkedIn Thought Leadership Series',
      status:           'BRIEF_PENDING',
      clientId:         clientId('Horizon Tech'),
      articleTypeId:    typeId('Social Post'),
      assignedWriterId: anjana.id,
      createdById:      admin.id,
      deadline:         days(12),
    },
    {
      title:            'Acme Corp — Annual Report Case Study',
      status:           'REVISION',
      clientId:         clientId('Acme Corp'),
      articleTypeId:    typeId('Case Study'),
      assignedWriterId: dinu.id,
      createdById:      admin.id,
      deadline:         days(3),
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
