// Seed data for a fresh install. Run directly (`npm run seed`) to wipe and
// reseed, or call seedIfEmpty() on boot to populate an empty database.
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { getDB, load, replaceAll } from './db.js';

const ADMIN_NOTE = 'Approved. Nice work — shipping it.';

export function buildSeedData() {
  const passwordHash = bcrypt.hashSync('Lexiconn@2025', 10);
  const now = new Date();

  const articleTypes = [
    'Article', 'Blog Post', 'Webpage Copy', 'Social Post',
    'Product Description', 'Email Newsletter', 'Press Release', 'Case Study',
  ].map((name, i) => ({ id: i + 1, name }));

  const clientSeed = [
    ['Acme Corp', 'Blog Post', 'B2B SaaS', 'https://acme.example.com'],
    ['Bright Ideas Ltd', 'Webpage Copy', 'Design agency', 'https://brightideas.example.com'],
    ['Nova Digital', 'Article', 'Performance marketing', 'https://novadigital.example.com'],
    ['Peak Performance', 'Case Study', 'Executive coaching', 'https://peakperformance.example.com'],
    ['Greenleaf Organic', 'Social Post', 'Food & beverage', 'https://greenleaf.example.com'],
    ['Horizon Tech', 'Email Newsletter', 'Enterprise software', 'https://horizontech.example.com'],
  ];
  const clients = clientSeed.map(([name, typeName, industry, website], i) => ({
    id: i + 1,
    name,
    contentTypeId: articleTypes.find((t) => t.name === typeName).id,
    industry,
    competitors: null,
    website,
    sampleLinks: [],
    onboardingDate: null,
    pilotDate: null,
    pilotNotes: null,
    notes: null,
  }));

  const users = [
    ['Admin', 'admin@lexiconn.in', 'ADMIN', null],
    ['Nandakumar Menon', 'nandakumar@lexiconn.in', 'WRITER', 'Long-form, B2B SaaS'],
    ['Abhijeet Padhy', 'abhijeet@lexiconn.in', 'WRITER', 'Listicles, Automation'],
    ['Anjana M R', 'anjana@lexiconn.in', 'WRITER', 'Web copy, Brand voice'],
    ['Dinu Varkey', 'dinu@lexiconn.in', 'WRITER', 'Case studies, Interviews'],
    ['Harsh Dugar', 'harsh@lexiconn.in', 'WRITER', 'Social, Short-form'],
    ['Raavi Rathee', 'raavi@lexiconn.in', 'WRITER', 'Email, Newsletters'],
    ['Sakshi Bhatia', 'sakshi@lexiconn.in', 'WRITER', 'Product copy, Ecommerce'],
    ['Sameer Saptiskar', 'sameer@lexiconn.in', 'WRITER', 'PR, Announcements'],
    ['Taher Rajgara', 'taher@lexiconn.in', 'WRITER', 'Thought leadership'],
    ['Titash Sinha', 'titash@lexiconn.in', 'WRITER', 'Research-led, Long-form'],
  ].map(([name, email, role, specialties], i) => ({
    id: i + 1, name, email, password: passwordHash, role,
    createdAt: now.toISOString(),
    joinedDate: now.toISOString(),
    specialties: specialties || null,
    bio: null, portfolioLinks: [], notes: null,
    avatarUrl: null,
  }));

  // --- lookup helpers ---------------------------------------------------
  const typeId = (name) => articleTypes.find((t) => t.name === name).id;
  const clientId = (name) => clients.find((c) => c.name === name).id;
  const userId = (email) => users.find((u) => u.email === email).id;
  const adminId = userId('admin@lexiconn.in');

  // ISO timestamp for `daysAgo` days back at a given hour:minute.
  const at = (daysAgo, h = 9, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const deadlineIn = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(18, 0, 0, 0);
    return d.toISOString();
  };

  // Who performed a given transition, and a sensible default note.
  const changedBy = (from, to, writerEmail) => {
    if (to === 'COMPLETED') return adminId;
    if (from === 'REVIEW' && to === 'WRITING') return adminId; // sent back
    return userId(writerEmail);
  };
  const defaultNote = (from, to) => {
    if (from === 'BRIEF_PENDING' && to === 'WRITING') return 'Started writing.';
    if (from === 'WRITING' && to === 'REVIEW') return 'Submitted for review.';
    if (from === 'REVIEW' && to === 'WRITING')
      return 'Sent back — tighten the intro and add a clear CTA at the end.';
    if (from === 'REVIEW' && to === 'COMPLETED') return ADMIN_NOTE;
    return '';
  };

  // --- article specs ----------------------------------------------------
  // `transitions` carry only { to, at }; old status is inferred from the
  // previous step. Same-day writing windows keep TTW realistic (hours, not days).
  const specs = [
    {
      title: 'How to Scale Your Content Strategy in 2026',
      writer: 'nandakumar@lexiconn.in', client: 'Acme Corp', type: 'Blog Post',
      createdDaysAgo: 7, deadlineDays: -3, wordCountTarget: 1000, ttwTargetMinutes: 90,
      briefNotes: 'Target keyword: "content strategy at scale". Audience: marketing leads at B2B SaaS. Tone: confident, practical. Include 3 actionable frameworks and a short conclusion with a CTA to our newsletter.',
      transitions: [
        { to: 'WRITING', at: at(6, 9) }, { to: 'REVIEW', at: at(6, 11) },
        { to: 'WRITING', at: at(5, 14) }, { to: 'REVIEW', at: at(5, 16) },
        { to: 'COMPLETED', at: at(4, 10) },
      ],
    },
    {
      title: '10 Automation Wins for Lean Marketing Teams',
      writer: 'abhijeet@lexiconn.in', client: 'Nova Digital', type: 'Article',
      createdDaysAgo: 11, deadlineDays: -8, wordCountTarget: 800, ttwTargetMinutes: 60,
      briefNotes: 'Listicle. Each item: one short paragraph plus one concrete example. Keep it skimmable with bold lead-ins.',
      transitions: [
        { to: 'WRITING', at: at(10, 9) }, { to: 'REVIEW', at: at(10, 10, 10) },
        { to: 'COMPLETED', at: at(9, 12) },
      ],
    },
    {
      title: 'Bright Ideas — Pricing Page Refresh',
      writer: 'anjana@lexiconn.in', client: 'Bright Ideas Ltd', type: 'Webpage Copy',
      createdDaysAgo: 3, deadlineDays: 2, wordCountTarget: 500, ttwTargetMinutes: 45,
      briefNotes: 'Rewrite the pricing hero plus three tier descriptions. Emphasize value, not feature lists. Match the brand voice guide linked in the doc.',
      transitions: [{ to: 'WRITING', at: at(2, 9) }, { to: 'REVIEW', at: at(2, 11) }],
    },
    {
      title: 'Peak Performance — Customer Success Case Study',
      writer: 'dinu@lexiconn.in', client: 'Peak Performance', type: 'Case Study',
      createdDaysAgo: 9, deadlineDays: -1, wordCountTarget: 1500, ttwTargetMinutes: 120,
      briefNotes: 'Interview notes are in the doc. Structure: Challenge → Solution → Results (with metrics). Pull two strong client quotes.',
      transitions: [{ to: 'WRITING', at: at(7, 9) }, { to: 'REVIEW', at: at(7, 13) }],
    },
    {
      title: 'Greenleaf — Earth Day Social Pack',
      writer: 'harsh@lexiconn.in', client: 'Greenleaf Organic', type: 'Social Post',
      createdDaysAgo: 2, deadlineDays: 1, wordCountTarget: 200, ttwTargetMinutes: 25,
      briefNotes: 'Five posts for Instagram and LinkedIn. Warm, optimistic tone. Include hashtags and a CTA to the Earth Day landing page.',
      transitions: [{ to: 'WRITING', at: at(0, 9) }],
    },
    {
      title: 'Horizon Tech — Monthly Product Newsletter',
      writer: 'raavi@lexiconn.in', client: 'Horizon Tech', type: 'Email Newsletter',
      createdDaysAgo: 6, deadlineDays: -2, wordCountTarget: 600, ttwTargetMinutes: 50,
      briefNotes: 'Sections: product updates, one customer spotlight, upcoming webinar. Put two subject-line options at the top.',
      transitions: [{ to: 'WRITING', at: at(0, 10) }],
    },
    {
      title: 'Acme Widget — Product Description Set',
      writer: 'sakshi@lexiconn.in', client: 'Acme Corp', type: 'Product Description',
      createdDaysAgo: 6, deadlineDays: 3, wordCountTarget: 300, ttwTargetMinutes: 30,
      briefNotes: 'Eight product descriptions, 30–40 words each. Benefit-led. Avoid repeating the same opening verb.',
      transitions: [
        { to: 'WRITING', at: at(5, 9) }, { to: 'REVIEW', at: at(5, 12) },
        { to: 'WRITING', at: at(0, 11) },
      ],
    },
    {
      title: 'Nova Digital — Series B Announcement',
      writer: 'sameer@lexiconn.in', client: 'Nova Digital', type: 'Press Release',
      createdDaysAgo: 1, deadlineDays: 5, wordCountTarget: 700, ttwTargetMinutes: 70,
      briefNotes: 'Standard press release format. Lead with the raise amount and lead investor. Include a founder quote and boilerplate at the end.',
      transitions: [],
    },
    {
      title: "Bright Ideas — The Founder's Guide to Brand Voice",
      writer: 'taher@lexiconn.in', client: 'Bright Ideas Ltd', type: 'Blog Post',
      createdDaysAgo: 4, deadlineDays: -1, wordCountTarget: 1200, ttwTargetMinutes: 100,
      briefNotes: 'Long-form. Define brand voice vs. tone, give a 4-step framework, end with a downloadable worksheet CTA.',
      transitions: [],
    },
    {
      title: 'Peak Performance — Habit Science for High Performers',
      writer: 'titash@lexiconn.in', client: 'Peak Performance', type: 'Article',
      createdDaysAgo: 1, deadlineDays: 4, wordCountTarget: 900, ttwTargetMinutes: 80,
      briefNotes: 'Evidence-led but accessible. Cite at least two studies. Practical takeaways box at the end.',
      transitions: [],
    },
    {
      title: 'Greenleaf — Why Regenerative Farming Matters',
      writer: 'anjana@lexiconn.in', client: 'Greenleaf Organic', type: 'Blog Post',
      createdDaysAgo: 6, deadlineDays: -2, wordCountTarget: 1100, ttwTargetMinutes: 95,
      briefNotes: 'Educational and hopeful. Explain regenerative vs. conventional, include a simple diagram suggestion, end with how readers can support it.',
      transitions: [
        { to: 'WRITING', at: at(5, 9) }, { to: 'REVIEW', at: at(5, 11, 30) },
        { to: 'COMPLETED', at: at(4, 12) },
      ],
    },
    {
      title: 'Horizon Tech — Integrations Landing Page',
      writer: 'nandakumar@lexiconn.in', client: 'Horizon Tech', type: 'Webpage Copy',
      createdDaysAgo: 2, deadlineDays: 2, wordCountTarget: 400, ttwTargetMinutes: 40,
      briefNotes: 'Hero + three benefit blocks + logo wall caption. Keep it punchy. CTA: "Browse all integrations".',
      transitions: [{ to: 'WRITING', at: at(0, 9) }],
    },
    {
      title: 'Acme — Spring Product Newsletter',
      writer: 'harsh@lexiconn.in', client: 'Acme Corp', type: 'Email Newsletter',
      createdDaysAgo: 13, deadlineDays: -10, wordCountTarget: 650, ttwTargetMinutes: 55,
      briefNotes: 'Friendly, concise. One hero update, two secondary items, single clear CTA button copy.',
      transitions: [
        { to: 'WRITING', at: at(12, 9) }, { to: 'REVIEW', at: at(12, 10) },
        { to: 'COMPLETED', at: at(11, 12) },
      ],
    },
    {
      title: 'Greenleaf — Farmers Market Social Teasers',
      writer: 'abhijeet@lexiconn.in', client: 'Greenleaf Organic', type: 'Social Post',
      createdDaysAgo: 1, deadlineDays: 6, wordCountTarget: 150, ttwTargetMinutes: 20,
      briefNotes: 'Three short teasers announcing the weekend market. Playful, seasonal. One emoji max per post.',
      transitions: [],
    },
  ];

  const articles = [];
  const activityLogs = [];
  let logId = 1;

  specs.forEach((spec, i) => {
    const id = i + 1;
    let prev = 'BRIEF_PENDING';
    let lastTs = at(spec.createdDaysAgo, 8);

    for (const t of spec.transitions) {
      activityLogs.push({
        id: logId++,
        articleId: id,
        changedById: changedBy(prev, t.to, spec.writer),
        oldStatus: prev,
        newStatus: t.to,
        note: t.note ?? defaultNote(prev, t.to),
        createdAt: t.at,
      });
      prev = t.to;
      lastTs = t.at;
    }

    const status = prev;
    articles.push({
      id,
      title: spec.title,
      status,
      clientId: clientId(spec.client),
      articleTypeId: typeId(spec.type),
      assignedWriterId: userId(spec.writer),
      createdById: adminId,
      deadline: spec.deadlineDays == null ? null : deadlineIn(spec.deadlineDays),
      wordCountTarget: spec.wordCountTarget ?? null,
      ttwTargetMinutes: spec.ttwTargetMinutes ?? null,
      referenceLinks:
        spec.referenceLinks ??
        (status !== 'BRIEF_PENDING'
          ? [`https://docs.google.com/document/d/cpt-sample-${id}/edit`]
          : []),
      ttwOverrideMinutes: null,
      briefNotes: spec.briefNotes ?? null,
      createdAt: at(spec.createdDaysAgo, 8),
      updatedAt: lastTs,
    });
  });

  return { users, clients, articleTypes, articles, activityLogs, archivedUsers: [] };
}

/** Populate the DB only if it has no users yet. */
export function seedIfEmpty() {
  if (getDB().users.length === 0) {
    replaceAll(buildSeedData());
    console.log('Database was empty — seeded with demo data.');
  }
}

// Run directly to force a full reseed.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  load();
  replaceAll(buildSeedData());
  console.log('Database reseeded from scratch.');
}
