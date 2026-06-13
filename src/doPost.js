/**
 * Google Apps Script doPost handler (extracted for testability).
 *
 * In production this runs inside the Apps Script runtime.  For unit-testing
 * we inject stubs for SpreadsheetApp and ContentService.
 */

/**
 * @param {object}   e               – the Apps Script event object
 * @param {string}   e.postData.contents – JSON string of the estimate payload
 * @param {object}   spreadsheetApp  – SpreadsheetApp stub / global
 * @param {string}   sheetId         – the spreadsheet ID
 * @param {object}   contentService  – ContentService stub / global
 * @returns {object} TextOutput created by ContentService
 */
function doPost(e, spreadsheetApp, sheetId, contentService) {
  const sheet = spreadsheetApp.openById(sheetId).getSheetByName("Sheet1");
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.estNo,
    data.custName,
    data.phone,
    data.delivery,
    data.total,
    data.advance,
    data.outstanding,
    data.status,
    data.time,
    JSON.stringify(data.items),
  ]);
  return contentService.createTextOutput("\u2705 Data Saved Successfully!");
}

module.exports = { doPost };
