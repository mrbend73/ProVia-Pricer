const https = require("https");

exports.handler = async function(event) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-el-u, x-el-p",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  const q = event.queryStringParameters || {};
  const h = event.headers || {};

  const u  = h["x-el-u"] || q.u;
  const pw = h["x-el-p"] || q.p;
  const m  = q.m;

  if (!u || !pw || !m) {
    return {
      statusCode: 400,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing credentials or mode parameter" }),
    };
  }

  const qs = new URLSearchParams({ m, u, p: pw });
  if (q.o)   qs.set("o",   q.o);
  if (q.fmt) qs.set("fmt", q.fmt);

  const url = `https://entrylink.provia.com/integrate.aspx?${qs}`;

  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: { ...cors, "Content-Type": "text/plain" },
          body,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        statusCode: 502,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Proxy error: " + err.message }),
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({
        statusCode: 504,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Request timed out" }),
      });
    });
  });
};
