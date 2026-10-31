// File: api/raw.js  - deploy di Vercel
// Domain: lua-protect.vercel.app/api/raw?id=vx_xxxx
// System: 1 ID serve 3 format via content negotiation

// Simpan di Vercel KV / Upstash / atau simple object dulu buat demo
const VAULT_DB = {
  // contoh data, nanti ganti dengan DB beneran
  "vx_rii2cmg1": {
    lua: `--voidedx-loader-p30-b10
print("hello from vault vx_rii2cmg1")`,
    html: `<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px"><h1>VAULT vx_rii2cmg1</h1><pre>print("hello from vault")</pre></body></html>`,
    raw: `print("hello from vault")`
  }
};

export default async function handler(req, res) {
  const { id, format } = req.query;
  
  if (!id) {
    return res.status(400).send("missing ?id=vx_xxxx");
  }

  // Ambil data dari DB (contoh pake object di atas)
  // Ganti dengan: await kv.get(id)
  const data = VAULT_DB[id] || {
    lua: `-- vault ${id}
print("vault ${id} loaded")`,
    html: `<html><body style="background:#000;color:#fff;font-family:monospace;padding:24px"><h1 style="letter-spacing:0.3em">VAULT ${id}</h1><p>lua-protect.vercel.app</p></body></html>`,
    raw: `-- vault ${id}`
  };

  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const accept = (req.headers['accept'] || '').toLowerCase();

  // 1. Force via ?format=lua|html|txt
  if (format === 'lua') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(data.lua);
  }
  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(data.html);
  }

  // 2. Roblox HttpGet biasanya UA = "Roblox/WinInet" atau "Roblox"
  if (ua.includes('roblox') || ua.includes('winhttp') || ua.includes('robloxstudio')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    // Penting buat Roblox: jangan ada HTML, cuma raw lua
    return res.send(data.lua);
  }

  // 3. Browser minta HTML
  if (accept.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(data.html);
  }

  // 4. Default = txt/raw (curl, etc)
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.send(data.raw);
}
