import { kv } from '@vercel/kv'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let cleanId = id.trim().toLowerCase()
    if (cleanId.endsWith('.lua')) {
      cleanId = cleanId.slice(0, -4)
    }
    cleanId = cleanId.trim()

    const validFormat = /^vx_[0-9a-f]+$/
    if (!validFormat.test(cleanId)) {
      return new Response(JSON.stringify({ error: 'invalid id format', received: id, cleanId }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let data
    try {
      data = await kv.get(cleanId)
    } catch (kvErr) {
      console.error('KV ERROR:', kvErr)
      return new Response(JSON.stringify({ error: 'kv error', detail: kvErr?.message || String(kvErr) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (data === null || data === undefined) {
      return new Response(JSON.stringify({ error: `${cleanId} not found in KV` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const luaContent = typeof data === 'string' ? data : String(data)

    return new Response(luaContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (err) {
    console.error('KV ERROR:', err)
    return new Response(JSON.stringify({ error: 'kv error', detail: err?.message || String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
