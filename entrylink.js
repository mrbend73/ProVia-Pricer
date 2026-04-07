const https = require("https");
const http  = require("http");

exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const params = event.queryStringParameters || {};
  const { u, p, m, o, fmt: fmtParam } = params;

  if (!u || !p || !m) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing required parameters: u, p, m" }),
    };
  }

  const qs = new URLSearchParams({ m, u, p });
  if (o)        qs.set("o", o);
  if (fmtParam) qs.set("fmt", fmtParam);

  const targetUrl = `https://entrylink.provia.com/integrate.aspx?${qs.toString()}`;

  try {
    const body = await new Promise((resolve, reject) => {
      const lib = targetUrl.startsWith("https") ? https : http;
      const req = lib.get(targetUrl, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      });
      req.on("error", reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error("Request timed out")); });
    });

    return {
      statusCode: body.status,
      headers: { ...headers, "Content-Type": "text/plain" },
      body: body.body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: "Proxy error: " + err.message }),
    };
  }
};
