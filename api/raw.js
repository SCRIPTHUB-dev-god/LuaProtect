export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'missing id' });

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || null;

  if (!clientIp) {
    return res.status(403).json({ error: 'PROXY: No IP - blocked' });
  }

  const securedIp = process.env.SECURE_SALT ? `${clientIp}-${process.env.SECURE_SALT}` : 'secured-by-env';

  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const blockedAgents = ['python', 'curl', 'wget', 'postman', 'insomnia'];
  for (const b of blockedAgents) {
    if (ua.includes(b) && !ua.includes('roblox')) {
      return res.status(403).json({ error: 'Blocked' });
    }
  }

  let cleanId = id;
  if (cleanId.endsWith('.lua')) cleanId = cleanId.slice(0, -4);
  if (!cleanId.startsWith('vx_')) cleanId = `vx_${cleanId}`;
  const finalId = `${cleanId}.lua`;

  const luaContent = `-- ID: ${finalId}
-- DOMAIN: luau-pro.vercel.app
-- SECURED: ${securedIp}
if not game then return end
print("Vaulth ${finalId} Loaded")
`;

  res.setHeader('X-Protected', 'LUAU-PRO');
  res.setHeader('X-Vault-ID', finalId);
  res.setHeader('X-Proxy', 'true');
  res.setHeader('X-IP-Secured', securedIp);
  res.setHeader('Cache-Control', 'no-store');

  if (ua.includes('roblox')) {
    res.setHeader('Content-Type', 'text/plain');
    return res.send(luaContent);
  }

  const accept = req.headers['accept'] || '';
  if (accept.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(`<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px"><h1>${finalId}</h1></body></html>`);
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.send(luaContent);
}
