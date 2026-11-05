import { kv } from '@vercel/kv'
function normalizeId(id) {
  let s = String(id).trim().toLowerCase()
  while (s.endsWith('.lua')) { s = s.slice(0, -4).trim() }
  return s
}
function stripComments(code) {
  return String(code).split('\n').filter(l => !l.trim().startsWith('--')).filter(l => l.trim() !== '').join('\n').trim()
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control','no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed, use POST' })
  try {
    const { id, content } = req.body || {}
    if (!id || typeof content !== 'string') return res.status(400).json({ error: 'id and content required' })
    const cleanId = normalizeId(id)
    if (!/^vx_[0-9a-f]{4,}$/.test(cleanId)) return res.status(400).json({ error: 'invalid id format', cleanId })
    const stripped = stripComments(content)
    if (!stripped) return res.status(400).json({ error: 'content empty after stripping comments' })
    if (stripped.length > 50000) return res.status(400).json({ error: 'content too large' })
    await kv.set(cleanId, stripped)
    return res.status(200).json({ ok: true, cleanId, url: `https://luau-pro.vercel.app/api/raw?id=${cleanId}.lua`, savedLength: stripped.length })
  } catch (err) {
    console.error('KV ERROR:', err)
    return res.status(500).json({ error: 'kv error', detail: err?.message || String(err) })
  }
}
