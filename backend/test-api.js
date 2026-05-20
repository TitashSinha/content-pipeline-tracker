/**
 * Quick smoke test — run with: node test-api.js
 * Requires the server to already be running on port 3001.
 */

const BASE = 'http://localhost:3001'

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  return { status: res.status, data }
}

function pass(label) { console.log(`  ✓ ${label}`) }
function fail(label, got) { console.error(`  ✗ ${label}`, got) }

async function run() {
  console.log('\n── Auth ─────────────────────────────────────────────')

  // Login admin
  const { data: adminAuth } = await req('POST', '/api/auth/login', {
    email: 'admin@agency.com', password: 'password123',
  })
  adminAuth.token ? pass('Admin login') : fail('Admin login', adminAuth)
  const adminToken = adminAuth.token

  // Login writer
  const { data: writerAuth } = await req('POST', '/api/auth/login', {
    email: 'sarah@agency.com', password: 'password123',
  })
  writerAuth.token ? pass('Writer login') : fail('Writer login', writerAuth)
  const writerToken = writerAuth.token

  // Wrong password
  const { status: badStatus } = await req('POST', '/api/auth/login', {
    email: 'admin@agency.com', password: 'wrong',
  })
  badStatus === 401 ? pass('Bad password → 401') : fail('Bad password should be 401', { badStatus })

  console.log('\n── Supporting lists ─────────────────────────────────')

  const { data: types } = await req('GET', '/api/article-types', null, adminToken)
  Array.isArray(types) && types.length === 5
    ? pass(`Article types (${types.map(t => t.name).join(', ')})`)
    : fail('Article types', types)

  const { data: clients } = await req('GET', '/api/clients', null, adminToken)
  Array.isArray(clients) && clients.length === 2
    ? pass(`Clients (${clients.map(c => c.name).join(', ')})`)
    : fail('Clients', clients)

  const { data: writers } = await req('GET', '/api/users/writers', null, adminToken)
  Array.isArray(writers) && writers.length === 2
    ? pass(`Writers (${writers.map(w => w.name).join(', ')})`)
    : fail('Writers', writers)

  // Writer cannot access /api/users/writers
  const { status: writerForbidden } = await req('GET', '/api/users/writers', null, writerToken)
  writerForbidden === 403 ? pass('Writer cannot list writers → 403') : fail('Should be 403', { writerForbidden })

  console.log('\n── Article CRUD (admin) ─────────────────────────────')

  // Sarah (writerToken) is writers[1] alphabetically; assign to her so she can act on it
  const sarahId = writers.find(w => w.email === 'sarah@agency.com').id
  const jamesId = writers.find(w => w.email === 'james@agency.com').id
  const writerId = sarahId

  // Create article
  const { status: createStatus, data: article } = await req('POST', '/api/articles', {
    title: '5 Tips for Better Blog Posts',
    clientId: clients[0].id,
    articleTypeId: types[1].id, // Blog
    assignedWriterId: writerId,
    deadline: '2025-12-31',
  }, adminToken)
  createStatus === 201 && article.id
    ? pass(`Article created (id=${article.id}, status=${article.status})`)
    : fail('Create article', { createStatus, article })
  const articleId = article.id

  // Writer cannot create articles
  const { status: writerCreate } = await req('POST', '/api/articles', {
    title: 'Sneaky article', clientId: 1, articleTypeId: 1, assignedWriterId: writerId,
  }, writerToken)
  writerCreate === 403 ? pass('Writer cannot create articles → 403') : fail('Should be 403', { writerCreate })

  // Edit article
  const { data: edited } = await req('PUT', `/api/articles/${articleId}`, {
    title: '10 Tips for Better Blog Posts',
  }, adminToken)
  edited.title === '10 Tips for Better Blog Posts'
    ? pass('Admin edits article title')
    : fail('Edit article', edited)

  console.log('\n── Status updates (writer) ──────────────────────────')

  // Writer updates status
  const { data: updated } = await req('PATCH', `/api/articles/${articleId}/status`, {
    status: 'WRITING', note: 'Starting the outline now',
  }, writerToken)
  updated.status === 'WRITING'
    ? pass('Writer moves to WRITING')
    : fail('Status update', updated)

  // Writer submits doc link
  const { data: withDoc } = await req('PATCH', `/api/articles/${articleId}/doc`, {
    googleDocLink: 'https://docs.google.com/document/d/abc123',
  }, writerToken)
  withDoc.googleDocLink
    ? pass('Writer submits Google Doc link')
    : fail('Doc link', withDoc)

  // Writer cannot touch another writer's article
  const otherWriterId = jamesId
  const { data: article2 } = (await req('POST', '/api/articles', {
    title: 'Article for James', clientId: 1, articleTypeId: 1,
    assignedWriterId: otherWriterId,
  }, adminToken)).data
  // article2 might be undefined if the above destructuring is off — let's fetch safely
  const { data: a2 } = await req('POST', '/api/articles', {
    title: 'Article for James', clientId: 1, articleTypeId: 1,
    assignedWriterId: otherWriterId,
  }, adminToken)
  const { status: forbiddenStatus } = await req('PATCH', `/api/articles/${a2.id}/status`, {
    status: 'WRITING',
  }, writerToken) // sarah trying to update james's article
  forbiddenStatus === 403
    ? pass("Writer cannot update another writer's article → 403")
    : fail('Should be 403', { forbiddenStatus })

  console.log('\n── Activity log ─────────────────────────────────────')

  const { data: article1Full } = await req('GET', `/api/articles/${articleId}`, null, adminToken)
  Array.isArray(article1Full.activityLogs) && article1Full.activityLogs.length >= 2
    ? pass(`Activity log has ${article1Full.activityLogs.length} entries`)
    : fail('Activity log', article1Full.activityLogs)

  article1Full.activityLogs.forEach(l => {
    console.log(`     ${l.oldStatus ?? 'null'} → ${l.newStatus} | "${l.note ?? ''}" by ${l.changedBy.name}`)
  })

  console.log('\n── Dashboard ────────────────────────────────────────')

  const { data: dash } = await req('GET', '/api/dashboard', null, adminToken)
  typeof dash.totalActive === 'number'
    ? pass(`totalActive=${dash.totalActive}, overdue=${dash.overdue}, completionsThisMonth=${dash.completionsThisMonth}`)
    : fail('Dashboard', dash)
  dash.byWriter.forEach(w => console.log(`     ${w.writerName}: ${w.activeArticles} active`))

  // Writer cannot access dashboard
  const { status: dashForbidden } = await req('GET', '/api/dashboard', null, writerToken)
  dashForbidden === 403 ? pass('Writer cannot access dashboard → 403') : fail('Should be 403', { dashForbidden })

  console.log('\n── Cleanup ──────────────────────────────────────────')
  await req('DELETE', `/api/articles/${articleId}`, null, adminToken)
  await req('DELETE', `/api/articles/${a2.id}`, null, adminToken)
  pass('Test articles deleted')

  console.log('\nDone.\n')
}

run().catch(console.error)
