// Receives one survey response, validates it, and appends it to the Google Sheet
// through the Apps Script web app (see google-apps-script/Code.gs).
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   SHEET_WEBHOOK_URL  the Apps Script web app URL ending in /exec
//   SHEET_SECRET       the same secret string set in Code.gs

const LANGUAGES = ["English", "Hindi", "Marathi", "Punjabi", "Bengali", "Assamese", "Odia", "Tamil", "Telugu", "Kannada", "Malayalam"];

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function validate(b) {
  const row = {
    name: text(b.name, 100),
    chauffeurId: text(b.chauffeurId, 40),
    mobile: text(b.mobile, 10),
    language: text(b.language, 20),
    suggestion: text(b.suggestion, 1000),
  };
  if (!row.name) return ["name is required"];
  if (!row.chauffeurId) return ["chauffeurId is required"];
  if (!/^[6-9]\d{9}$/.test(row.mobile)) return ["mobile must be a 10-digit Indian mobile number"];
  if (!LANGUAGES.includes(row.language)) return ["unknown language"];
  for (let i = 1; i <= 5; i++) {
    if (!isInt(b["q" + i], 1, 5)) return [`q${i} must be 1-5`];
    row["q" + i] = b["q" + i];
  }
  if (!(isInt(b.q6, 1, 5) || b.q6 === "NA" || b.q6 === "NS")) return ["q6 must be 1-5, NA or NS"];
  row.q6 = b.q6 === "NA" ? "Have not attended training" : b.q6 === "NS" ? "Not sure" : b.q6;
  if (!isInt(b.q7, 0, 10)) return ["q7 must be 0-10"];
  row.q7 = b.q7;
  return [null, row];
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Use POST" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== "object") return res.status(400).json({ ok: false, error: "Invalid JSON" });

  const [error, row] = validate(body);
  if (error) return res.status(400).json({ ok: false, error });

  const url = process.env.SHEET_WEBHOOK_URL;
  const secret = process.env.SHEET_SECRET;
  if (!url || !secret) return res.status(500).json({ ok: false, error: "Server is missing SHEET_WEBHOOK_URL or SHEET_SECRET" });

  try {
    // Apps Script answers with a redirect to the result; fetch follows it.
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, ...row }),
    });
    const result = await r.json().catch(() => null);
    if (!result || !result.ok) {
      console.error("Sheet rejected the response", r.status, result);
      return res.status(502).json({ ok: false, error: "Could not save to the sheet" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Sheet request failed", e);
    return res.status(502).json({ ok: false, error: "Could not reach the sheet" });
  }
};
