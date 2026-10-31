// File: api/raw.ts - Vercel Edge Runtime version
export const config = { runtime: 'edge' };

export default async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const format = searchParams.get('format');

  if (!id) return new Response('missing ?id', { status: 400 });

  // TODO: ganti dengan Vercel KV
  // const data = await kv.get(id)
  const data = {
    lua: `-- vault ${id}\nprint("loaded ${id}")`,
    html: `<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px"><h1>VAULT ${id}</h1></body></html>`,
    raw: `-- vault ${id}`
  };

  const ua = req.headers.get('user-agent')?.toLowerCase() || '';
  const accept = req.headers.get('accept')?.toLowerCase() || '';

  if (format === 'lua' || ua.includes('roblox')) {
    return new Response(data.lua, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  if (format === 'html' || accept.includes('html')) {
    return new Response(data.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  return new Response(data.raw, { headers: { 'Content-Type': 'text/plain' } });
}
