// ECO Mobility – Vendor Experience Survey: Google Sheet receiver.
// Paste this into the sheet's Extensions → Apps Script, set SECRET, then
// Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).

const SECRET = "CHANGE-ME-to-a-long-random-string"; // must match SHEET_SECRET on Vercel
const SHEET_NAME = "Responses";

const HEADERS = [
  "Submitted at", "Name", "Chauffeur ID", "Mobile", "Language",
  "Q1 Credibility (1-5)", "Q2 Respect (1-5)", "Q3 Fairness (1-5)", "Q4 Pride (1-5)", "Q5 Camaraderie (1-5)",
  "Q6 Training (1-5)", "Q7 NPS (0-10)", "Suggestion",
];

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: "bad json" });
  }
  if (body.secret !== SECRET) return json({ ok: false, error: "forbidden" });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    const row = sheet.getLastRow() + 1;
    // Keep Chauffeur ID and Mobile as text so leading zeros survive.
    sheet.getRange(row, 3, 1, 2).setNumberFormat("@");
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([[
      new Date(), body.name, body.chauffeurId, body.mobile, body.language,
      body.q1, body.q2, body.q3, body.q4, body.q5, body.q6, body.q7, body.suggestion || "",
    ]]);
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
