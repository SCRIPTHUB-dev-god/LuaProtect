export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("missing id");

  const cleanId = id.replace('.lua','');
  
  const data = {
    lua: `-- Anti-Spyware Protected
-- ID: ${cleanId}.lua
-- lua-protect.vercel.app
if not game then return end
print("Protected Vault ${cleanId}.lua Loaded")
`,
    html: `<html><body style="background:#000;color:#fff">Protected ${cleanId}.lua</body></html>`,
    raw: `-- Protected ${cleanId}.lua`
  };

  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const accept = (req.headers['accept'] || '').toLowerCase();

  res.setHeader('X-Protected-By', 'LUA-PROTECT Anti-Spyware');
  res.setHeader('X-Vault-ID', cleanId + '.lua');

  if (ua.includes('roblox')) {
    res.setHeader('Content-Type', 'text/plain');
    return res.send(data.lua);
  }
  if (accept.includes('html')) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(data.html);
  }
  res.setHeader('Content-Type', 'text/plain');
  return res.send(data.raw);
}
