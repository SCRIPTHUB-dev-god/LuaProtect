export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    const { data } = req.query;
    let luaCode = "";

    if (data) {
        try {
            luaCode = Buffer.from(data, 'base64').toString('utf-8');
        } catch (e) {
            try {
                luaCode = decodeURIComponent(atob(data));
            } catch (err) {
                luaCode = "print('Failed to decode payload')";
            }
        }
    }

    const html = `--[=[\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>404: This page could not be found</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 0; }\n        .error-wrapper { display: flex; align-items: center; justify-content: center; font-size: 14px; }\n        .error-code { font-size: 24px; font-weight: 500; padding-right: 23px; margin-right: 20px; border-right: 1px solid rgba(255, 255, 255, 0.3); line-height: 49px; }\n        .error-message { font-size: 14px; font-weight: 400; line-height: 49px; }\n    </style>\n</head>\n<body>\n    <div class="error-wrapper">\n        <div class="error-code">404</div>\n        <div class="error-message">This page could not be found.</div>\n    </div>\n</body>\n</html>\n]=]\n${luaCode}`;

    return res.status(200).send(html);
}
