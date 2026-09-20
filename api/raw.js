export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    const { data } = req.query;
    let luaCode = "";

    if (data && data.length === 32) {
        try {
            const kvRes = await fetch(`https://kvdb.io/LuaProtectBucket2026/${data}`);
            if (kvRes.ok) {
                const kvData = await kvRes.json();
                if (kvData.status === 'public') {
                    luaCode = kvData.code;
                } else {
                    luaCode = "warn('LuaProtect: Script is UNPUBLIC / DISABLED')";
                }
            } else {
                luaCode = "warn('LuaProtect: Invalid or expired 32-digit Hex Key')";
            }
        } catch (e) {
            luaCode = "warn('LuaProtect: Database connection error')";
        }
    } else {
        luaCode = "warn('LuaProtect: Invalid request parameter (32-digit Hex required)')";
    }

    const html = `--[=[\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>404: This page could not be found</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 0; }\n        .error-wrapper { display: flex; align-items: center; justify-content: center; font-size: 14px; }\n        .error-code { font-size: 24px; font-weight: 500; padding-right: 23px; margin-right: 20px; border-right: 1px solid rgba(255, 255, 255, 0.3); line-height: 49px; }\n        .error-message { font-size: 14px; font-weight: 400; line-height: 49px; }\n    </style>\n</head>\n<body>\n    <div class="error-wrapper">\n        <div class="error-code">404</div>\n        <div class="error-message">This page could not be found.</div>\n    </div>\n</body>\n</html>\n]=]\n${luaCode}`;

    return res.status(200).send(html);
}
