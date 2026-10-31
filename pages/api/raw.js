import { kv } from '@vercel/kv'

export const config = {
  api: {
    bodyParser: false
  }
}

function stripLuaExtension(id) {
  let s = id.trim().toLowerCase()
  if (s.endsWith('.lua')) s = s.slice(0, -4)
  return s.trim()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  try {
    const id = req.query.id

    if (!id) {
      return res.status(400).json({ error: 'id required' })
    }

    let cleanId = stripLuaExtension(String(id))

    const validFormat = /^vx_[0-9a-f]+$/
    if (!validFormat.test(cleanId)) {
      return res.status(400).json({ error: 'invalid id format', received: id, cleanId })
    }

    let data
    try {
      data = await kv.get(cleanId)
    } catch (kvErr) {
      console.error('KV ERROR:', kvErr)
      return res.status(500).json({ error: 'kv error', detail: kvErr?.message || String(kvErr) })
    }

    if (data === null || data === undefined) {
      return res.status(404).json({ error: `${cleanId} not found in KV` })
    }

    const luaContent = typeof data === 'string' ? data : String(data)

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    return res.status(200).send(luaContent)

  } catch (err) {
    console.error('KV ERROR:', err)
    return res.status(500).json({ error: 'kv error', detail: err?.message || String(err) })
  }
}
