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
      body: JSON.stringify({ error: "Missing u, p, or m", got: { u: !!u, p: !!p, m: !!m } }),
    };
  }

  const qs = `m=${encodeURIComponent(m)}&u=${encodeURIComponent(u)}&p=${encodeURIComponent(p)}`
    + (o   ? `&o=${encodeURIComponent(o)}`     : "")
    + (fmt ? `&fmt=${encodeURIComponent(fmt)}` : "");

  const url = `https://entrylink.provia.com/integrate.aspx?${qs}`;

  console.log("Calling entryLINK:", `m=${m} u=${u} o=${o} fmt=${fmt} p_length=${p.length}`);

  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        console.log("entryLINK status:", res.statusCode);

        // Log top-level keys and Order keys to find where lines live
        try {
          const parsed = JSON.parse(body);
          console.log("Top-level keys:", JSON.stringify(Object.keys(parsed)));
          if (parsed.Order) {
            console.log("Order keys:", JSON.stringify(Object.keys(parsed.Order)));
            // Find any array fields — that's where line items will be
            for (const [k, v] of Object.entries(parsed.Order)) {
              if (Array.isArray(v)) {
                console.log(`Array field found: Order.${k} length=${v.length}`);
                if (v.length > 0) {
                  console.log(`First item keys: ${JSON.stringify(Object.keys(v[0]))}`);
                  console.log(`First item sample: ${JSON.stringify(v[0]).slice(0, 400)}`);
                }
              }
            }
          }
        } catch(e) {
          console.log("Could not parse JSON for key inspection:", e.message);
          console.log("Raw body start:", body.slice(0, 500));
        }

        resolve({
          statusCode: res.statusCode,
          headers: { ...cors, "Content-Type": "text/plain" },
          body,
        });
      });
    });

    req.on("error", (err) => {
      console.log("Request error:", err.message);
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
