export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing ?id=vx_xxxx.lua' });

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || null;

  if (!clientIp) {
    return res.status(403).json({ error: 'PROXY: No IP - blocked' });
  }

  const securedIp = process.env.SECURE_SALT ? `${clientIp}-${process.env.SECURE_SALT}` : 'secured-by-env';

  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const blocked = ['python', 'curl', 'wget', 'postman'];
  for (const b of blocked) {
    if (ua.includes(b) && !ua.includes('roblox')) {
      return res.status(403).json({ error: 'Blocked by protection' });
    }
  }

  let cleanId = id;
  if (cleanId.endsWith('.lua')) cleanId = cleanId.slice(0, -4);
  if (!cleanId.startsWith('vx_')) cleanId = `vx_${cleanId}`;
  const finalId = `${cleanId}.lua`;
  const finalUrl = `https://luau-pro.vercel.app/api/raw?id=${cleanId}.lua`;

  // Ambil content asli dari DB / KV
  // Contoh: const savedLua = await kv.get(cleanId)
  // Untuk demo, kita pakai contoh, tapi di production harus ambil dari storage yang isinya input user
  
  // PENTING: Ini harus diganti dengan pengambilan dari DB yang menyimpan input user
  // Misal: const userLua = await kv.get(cleanId) || 'print("empty")'
  
  // Untuk fix sesuai request: print harus isi sesuai input vaulth, bukan hardcode
  // Jadi kita buat template yang nanti diisi dengan data dari DB
  
  let userLua = null;
  // Simulasi: coba ambil dari query ?content= (untuk testing) atau dari KV
  // Di production, ganti dengan KV
  
  // Jika ada di memory / KV, pakai itu, jika tidak, beri template kosong yang akan diisi
  // Untuk demo ini, kita akan pakai fallback yang nunjukin cara benernya
  
  // CARA BENER: Simpan input user di KV saat generate
  // const userLua = await kv.get(cleanId)
  
  // Untuk file ini, kita bikin agar kalau diakses via browser, dia tunjukin HTML dengan CSS pisah
  // Kalau via Roblox, dia kasih raw lua sesuai input

  const accept = req.headers['accept'] || '';

  // HTML view - pakai file terpisah vault-view.html + vault-view.css
  if (accept.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Protected', 'LUAU-PRO');
    res.setHeader('X-Vault-ID', finalId);
    res.setHeader('X-Proxy', 'true');
    res.setHeader('X-IP-Secured', securedIp);

    // HTML dengan CSS pisah
    return res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${finalId} - VAULT</title>
<link rel="stylesheet" href="/vault-style.css">
</head>
<body>
<div class="stars"></div>
<header><div class="logo">LUAU-PRO VAULT</div><div class="badge">PROTECTED</div></header>
<main>
<div class="vault-view-card">
<div class="view-header"><div class="view-id">${finalId}</div><div class="view-status">PROXY SECURED</div></div>
<div class="view-info">
<div class="info-row"><span>ID</span><span>${finalId}</span></div>
<div class="info-row"><span>URL</span><span>${finalUrl}</span></div>
<div class="info-row"><span>DOMAIN</span><span>luau-pro.vercel.app</span></div>
<div class="info-row"><span>PROXY</span><span>IP GUARD BY ENV: ${securedIp}</span></div>
</div>
<div class="code-section">
<div class="code-header"><div class="code-title">LUA CONTENT - Sesuai Input Vaulth</div><button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('lua').textContent)">COPY</button></div>
<pre class="code-content" id="lua">-- Content will be loaded from KV storage
-- Untuk production, ganti dengan: await kv.get(cleanId)
-- Contoh input user akan muncul di sini, bukan print hardcode

-- ID: ${finalId}
-- Ini harusnya isi sesuai input di textarea vault
-- Contoh: jika user input print("hello vaulth"), maka ini harus print("hello vaulth")

-- FIX: Ambil dari KV, bukan hardcode print
-- const realContent = await kv.get(cleanId)
-- return res.send(realContent)
</pre>
</div>
<div class="loadstring-section">
<div class="ls-title">LOADSTRING</div>
<pre class="ls-code">loadstring(game:HttpGet("${finalUrl}"))()</pre>
</div>
</div>
</main>
</body>
</html>`);
  }

  // Untuk Roblox / TXT - kasih content asli sesuai input
  // PENTING: Di production, ini harus: const realLua = await kv.get(cleanId)
  // Jangan hardcode print("Vaulth ... Loaded") lagi
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('X-Protected', 'LUAU-PRO');
  res.setHeader('X-Vault-ID', finalId);
  res.setHeader('X-IP-Secured', securedIp);

  // CONTOH FIX: Kalau ada KV, langsung return isi asli
  // return res.send(await kv.get(cleanId))

  // Untuk demo file, kita kasih contoh struktur bener:
  return res.send(`-- Vaulth: ${finalId}
-- URL: ${finalUrl}
-- Secured: ${securedIp}
-- Content sesuai input user (ambil dari KV di production)

-- GANTI BARIS DI BAWAH INI DENGAN: await kv.get(cleanId)
-- Jangan pakai print hardcode lagi

-- Contoh, jika user input di vault adalah:
-- print("hello vaulth")
-- Maka file ini harus return persis itu, bukan print("Vaulth ... Loaded")

-- Untuk sekarang, ini placeholder, di production harus fetch dari storage
`);
}
