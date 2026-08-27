/**
 * CORVO — Oslo Design Fair lead capture
 *
 * Setup (once):
 * 1. Create a Google Sheet (e.g. "Oslo Fair Leads").
 * 2. Row 1 headers: Timestamp | Email | Phone | Country code | Source | Rug
 * 3. Extensions → Apps Script. Replace the default code with this file.
 * 4. Deploy → New deployment → Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the web-app URL into assets/js/config.js → leadsUrl
 *
 * Leads appear as new rows. Open the Sheet whenever you need them.
 */

function doPost(e) {
  var sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads") ||
    SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    data = e.parameter || {};
  }

  sheet.appendRow([
    new Date(),
    data.email || "",
    data.phone || "",
    data.countryCode || "",
    data.source || "popup",
    data.rug || "",
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput("ok");
}
