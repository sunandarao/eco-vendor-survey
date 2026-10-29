// ECO Mobility – Business Partner Survey: Google Sheet receiver.
// Paste this into the sheet's Extensions → Apps Script, set SECRET, then
// Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).

const SECRET = "CHANGE-ME-to-a-long-random-string"; // must match SHEET_SECRET on Vercel
const SHEET_NAME = "Responses";

const HEADERS = [
  "Submitted at", "Name", "Chauffeur ID", "Mobile", "Branch", "Vehicle Number", "Language",
  "Q1. Credibility - Trust & Transparency: ECO Mobility ensures timely payments and maintains transparency in billing and payment processes. (1 = Strongly Disagree, 5 = Strongly Agree)",
  "Q2. Respect - Valuing Partners: My concerns and suggestions are heard, addressed and valued by ECO Mobility. (1-5)",
  "Q3. Fairness - Equal Opportunities: ECO Mobility allocates vehicle business opportunities fairly and transparently. (1-5)",
  "Q4. Pride - Association with ECO: I feel proud to be associated with ECO Mobility as a vehicle partner. (1-5)",
  "Q5. Camaraderie - Working Relationships: I receive cooperation and support from my ECO Mobility Branch Team. (1-5)",
  "Q6. Chauffeur Training & Development: How useful are the chauffeur training programmes conducted by ECO Mobility in improving chauffeur skills and service quality? (1 = Not Useful, 5 = Very Useful)",
  "Q7. Overall Recommendation: How likely are you to recommend ECO Mobility to other vehicle owners as a company to attach their vehicles with? (0 = Not at All Likely, 10 = Extremely Likely)",
  "Suggestion: What is one thing ECO Mobility should improve?",
  "Consent given at",
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
    const sheet = getSheet();
    writeHeaders(sheet);
    const row = Math.max(sheet.getLastRow() + 1, 2);
    // Keep Chauffeur ID, Mobile, Branch and Vehicle Number as text so leading zeros survive.
    sheet.getRange(row, 3, 1, 4).setNumberFormat("@");
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([[
      new Date(), body.name, body.chauffeurId, body.mobile, body.branch || "", body.vehicleNumber || "", body.language,
      body.q1, body.q2, body.q3, body.q4, body.q5, body.q6, body.q7, body.suggestion || "",
      body.consentAt ? new Date(body.consentAt) : "",
    ]]);
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

// Run this once from the editor to rewrite the heading row immediately.
function fixHeaders() {
  writeHeaders(getSheet());
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function writeHeaders(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight("bold").setWrap(true).setVerticalAlignment("top");
  sheet.setFrozenRows(1);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
