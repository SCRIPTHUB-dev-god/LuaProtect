import { kv } from '@vercel/kv'
function normalizeId(id) {
  let s = String(id).trim().toLowerCase()
  while (s.endsWith('.lua')) { s = s.slice(0, -4).trim() }
  return s
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  try {
    let id = req.query.id
    if (!id) {
      res.setHeader('Content-Type','application/json')
      return res.status(400).json({ error: 'id required' })
    }
    const cleanId = normalizeId(id)
    const isValid = /^vx_[0-9a-f]{4,}$/.test(cleanId)
    if (!isValid) {
      res.setHeader('Content-Type','application/json')
      return res.status(400).json({ error: 'invalid id format', received: id, cleanId })
    }
    let data
    try { data = await kv.get(cleanId) } catch (e) {
      console.error('KV ERROR:', e)
      res.setHeader('Content-Type','application/json')
      return res.status(500).json({ error: 'kv error', detail: e?.message || String(e) })
    }
    if (data === null || data === undefined) {
      res.setHeader('Content-Type','application/json')
      return res.status(404).json({ error: `${cleanId} not found in KV` })
    }
    const content = typeof data === 'string' ? data : String(data)
    res.setHeader('Content-Type','text/plain; charset=utf-8')
    res.setHeader('X-Vault-ID', `${cleanId}.lua`)
    return res.status(200).send(content)
  } catch (err) {
    console.error('KV ERROR:', err)
    res.setHeader('Content-Type','application/json')
    return res.status(500).json({ error: 'kv error', detail: err?.message || String(err) })
  }
}
