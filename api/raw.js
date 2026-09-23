export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let hexData = req.query.data;

    if (!hexData) {
        const rawUrlPath = req.url.split('?')[0];
        const pathSegments = rawUrlPath.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
            hexData = pathSegments[pathSegments.length - 1];
        }
    }

    let luaCode = "";

    if (hexData && typeof hexData === 'string') {
        const cleanHex = hexData.trim().replace(/[^0-9a-fA-F]/g, '');
        if (cleanHex.length >= 10) {
            try {
                const evenHex = cleanHex.length % 2 !== 0 ? cleanHex + '0' : cleanHex;
                luaCode = Buffer.from(evenHex, 'hex').toString('utf-8');
            } catch (e) {
                luaCode = "warn('LuaProtect Gateway: Failed to decode hex payload')";
            }
        } else {
            luaCode = "warn('LuaProtect Gateway: Script is UNPUBLIC / DISABLED')";
        }
    } else {
        luaCode = "warn('LuaProtect Gateway: Missing payload')";
    }

    const redirectUrl = "https://google.com";

    const html = `--[=[\n<!DOCTYPE html>\n<html>\n<head>\n    <meta http-equiv="refresh" content="0;url=${redirectUrl}">\n    <script>window.location.replace("${redirectUrl}");</script>\n</head>\n<body></body>\n</html>\n]=]\n\n${luaCode}`;

    return res.status(200).send(html);
}
