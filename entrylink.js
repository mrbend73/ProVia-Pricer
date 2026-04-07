const https = require("https");

exports.handler = async function(event) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method not allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch(e) {
    return {
      statusCode: 400,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { u, p, m, o, fmt } = payload;

  if (!u || !p || !m) {
    return {
      statusCode: 400,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing u, p, or m" }),
    };
  }

  const qs = new URLSearchParams({ m, u, p });
  if (o)   qs.set("o",   o);
  if (fmt) qs.set("fmt", fmt);

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
