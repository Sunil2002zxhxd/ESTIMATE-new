const { doPost } = require("../src/doPost");

/** Build a mock SpreadsheetApp that records appendRow calls. */
function createMockSpreadsheetApp() {
  const appendedRows = [];
  return {
    appendedRows,
    openById: jest.fn().mockReturnValue({
      getSheetByName: jest.fn().mockReturnValue({
        appendRow: jest.fn((row) => appendedRows.push(row)),
      }),
    }),
  };
}

/** Build a mock ContentService. */
function createMockContentService() {
  return {
    createTextOutput: jest.fn((text) => ({ text })),
  };
}

/** Build a sample Apps Script event object. */
function createEvent(payload) {
  return { postData: { contents: JSON.stringify(payload) } };
}

const SHEET_ID = "test-sheet-id";

describe("doPost", () => {
  let spreadsheetApp;
  let contentService;

  beforeEach(() => {
    spreadsheetApp = createMockSpreadsheetApp();
    contentService = createMockContentService();
  });

  it("opens the spreadsheet by ID and selects Sheet1", () => {
    const e = createEvent({ estNo: "1", custName: "A" });
    doPost(e, spreadsheetApp, SHEET_ID, contentService);

    expect(spreadsheetApp.openById).toHaveBeenCalledWith(SHEET_ID);
    expect(
      spreadsheetApp.openById.mock.results[0].value.getSheetByName,
    ).toHaveBeenCalledWith("Sheet1");
  });

  it("appends a row with all expected fields", () => {
    const payload = {
      estNo: "EST-100",
      custName: "Test",
      phone: "9198001234",
      delivery: "2",
      total: "500.00",
      advance: "100",
      outstanding: "400.00",
      status: "pending",
      time: "2025-01-01",
      items: [{ part: "Sticker", qty: "10", rate: "50", amt: "500.00" }],
    };

    doPost(createEvent(payload), spreadsheetApp, SHEET_ID, contentService);

    expect(spreadsheetApp.appendedRows).toHaveLength(1);
    const row = spreadsheetApp.appendedRows[0];

    // row[0] is a Date
    expect(row[0]).toBeInstanceOf(Date);
    expect(row[1]).toBe("EST-100");
    expect(row[2]).toBe("Test");
    expect(row[3]).toBe("9198001234");
    expect(row[4]).toBe("2");
    expect(row[5]).toBe("500.00");
    expect(row[6]).toBe("100");
    expect(row[7]).toBe("400.00");
    expect(row[8]).toBe("pending");
    expect(row[9]).toBe("2025-01-01");
    expect(JSON.parse(row[10])).toEqual(payload.items);
  });

  it("returns a success TextOutput", () => {
    const e = createEvent({ estNo: "1" });
    const result = doPost(e, spreadsheetApp, SHEET_ID, contentService);

    expect(contentService.createTextOutput).toHaveBeenCalledWith(
      expect.stringContaining("Data Saved Successfully"),
    );
    expect(result.text).toContain("Data Saved Successfully");
  });

  it("handles payload with missing optional fields", () => {
    const payload = { estNo: "EST-200" };
    doPost(createEvent(payload), spreadsheetApp, SHEET_ID, contentService);

    const row = spreadsheetApp.appendedRows[0];
    expect(row[1]).toBe("EST-200");
    expect(row[2]).toBeUndefined();
    expect(row[8]).toBeUndefined();
  });

  it("serializes items array as JSON string", () => {
    const items = [
      { part: "A", qty: "1", rate: "10", amt: "10.00" },
      { part: "B", qty: "2", rate: "20", amt: "40.00" },
    ];
    doPost(
      createEvent({ estNo: "1", items }),
      spreadsheetApp,
      SHEET_ID,
      contentService,
    );

    const row = spreadsheetApp.appendedRows[0];
    expect(typeof row[10]).toBe("string");
    expect(JSON.parse(row[10])).toEqual(items);
  });

  it("throws on malformed JSON", () => {
    const badEvent = { postData: { contents: "not json" } };
    expect(() =>
      doPost(badEvent, spreadsheetApp, SHEET_ID, contentService),
    ).toThrow();
  });
});
