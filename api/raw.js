import { kv } from '@vercel/kv'

function stripComments(code) {
  if (!code) return ''
  return code
    .split('\n')
    .filter(l => !l.trim().startsWith('--'))
    .filter(l => l.trim() !== '')
    .join('\n')
    .trim()
}

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'missing id' })

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || null
  if (!clientIp) return res.status(403).json({ error: 'PROXY: No IP blocked' })

  const securedIp = process.env.SECURE_SALT || 'secured-by-env'
  const ua = (req.headers['user-agent'] || '').toLowerCase()

  let cleanId = id
  if (cleanId.endsWith('.lua')) cleanId = cleanId.slice(0, -4)
  if (!cleanId.startsWith('vx_')) cleanId = `vx_${cleanId}`
  const finalId = `${cleanId}.lua`
  const finalUrl = `https://luau-pro.vercel.app/api/raw?id=${cleanId}.lua`

  let userLua = null
  try {
    userLua = await kv.get(cleanId)
  } catch (e) {
    userLua = null
  }

  const accept = req.headers['accept'] || ''
  const isBrowser = accept.includes('text/html') && !ua.includes('roblox')

  if (isBrowser) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('X-Vault-ID', finalId)
    res.setHeader('Cache-Control', 'no-store')

    const displayLua = userLua ? stripComments(userLua) : ''
    const statusText = userLua ? 'FOUND • NO COMMENTS' : 'NOT FOUND • KV EMPTY'

    return res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${finalId}</title>
<link rel="stylesheet" href="/vault-style.css"></head>
<body>
<div class="stars"></div>
<header><div class="logo">LUAU-PRO VAULT</div><div class="badge">PROTECTED</div></header>
<main>
<div class="vault-view-card">
<div class="view-header"><div class="view-id">${finalId}</div><div class="view-status">${statusText}</div></div>
<div class="view-info">
<div class="info-row"><span>ID</span><span>${finalId}</span></div>
<div class="info-row"><span>URL</span><span>${finalUrl}</span></div>
<div class="info-row"><span>IP</span><span>${securedIp}</span></div>
<div class="info-row"><span>STATUS</span><span>${statusText}</span></div>
</div>
<div class="code-section">
<div class="code-header"><div class="code-title">LUA CONTENT</div><button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('c').textContent)">COPY</button></div>
<pre class="code-content" id="c">${displayLua ? displayLua.replace(/</g,'&lt;') : '-- empty --\n-- save from main site first'}</pre>
</div>
<div class="loadstring-section">
<div class="ls-title">LOADSTRING</div>
<pre class="ls-code">loadstring(game:HttpGet("${finalUrl}"))()</pre>
</div>
</div>
</main>
</body>
</html>`)
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('X-Vault-ID', finalId)
  res.setHeader('Cache-Control', 'no-store')

  if (!userLua) {
    return res.status(404).send('print("vault not found - save first")')
  }

  return res.send(stripComments(userLua))
}
