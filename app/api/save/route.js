import { kv } from '@vercel/kv'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    let { id, content } = body
    if (!id || !content) {
      return new Response(JSON.stringify({ error: 'id and content required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    let cleanId = id.trim().toLowerCase()
    if (cleanId.endsWith('.lua')) cleanId = cleanId.slice(0, -4)
    cleanId = cleanId.trim()
    const validFormat = /^vx_[0-9a-f]+$/
    if (!validFormat.test(cleanId)) {
      return new Response(JSON.stringify({ error: 'invalid id format' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    await kv.set(cleanId, content)
    return new Response(JSON.stringify({ ok: true, cleanId, url: `https://luau-pro.vercel.app/api/raw?id=${cleanId}.lua` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    console.error('KV ERROR:', err)
    return new Response(JSON.stringify({ error: 'kv error', detail: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
