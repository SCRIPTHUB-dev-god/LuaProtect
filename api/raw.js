export default function handler(req, res) {
    const { data } = req.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    if (!data) {
        return res.status(400).send('print("Error: Invalid or missing data parameter")');
    }

    const scriptCode = `print("LuaProtect Active - Data ID: ${data}")`;

    return res.status(200).send(scriptCode);
}
