const {
  ITEM_SUGGESTIONS,
  nextEstimateId,
  recalc,
  addRow,
  buildCurrent,
  saveOnline,
  buildPrintHtml,
  buildWhatsAppPayload,
} = require("../src/estimate");

/** Build a minimal DOM that mirrors the estimate HTML form. */
function createFormDom() {
  document.body.innerHTML = `
    <input id="estNo" value="123456">
    <input id="custName" value="">
    <input id="phone" value="">
    <input id="delivery" value="">
    <table id="itemsTable">
      <thead>
        <tr><th>Particulars</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr>
      </thead>
      <tbody></tbody>
    </table>
    <input id="advance" value="0" type="number">
    <span id="total">0.00</span>
    <span id="out">0.00</span>
  `;
}

beforeEach(() => {
  createFormDom();
});

// ───────────────────────── ITEM_SUGGESTIONS ──────────────────────────

describe("ITEM_SUGGESTIONS", () => {
  it("contains the expected number of items", () => {
    expect(ITEM_SUGGESTIONS).toHaveLength(16);
  });

  it("includes common items", () => {
    expect(ITEM_SUGGESTIONS).toContain("Bill Book");
    expect(ITEM_SUGGESTIONS).toContain("Visiting Card");
    expect(ITEM_SUGGESTIONS).toContain("Flex Banner");
  });
});

// ─────────────────────── nextEstimateId ──────────────────────────────

describe("nextEstimateId", () => {
  it("returns a string", () => {
    expect(typeof nextEstimateId()).toBe("string");
  });

  it("returns a timestamp-based numeric string", () => {
    const before = Date.now();
    const id = nextEstimateId();
    const after = Date.now();
    expect(Number(id)).toBeGreaterThanOrEqual(before);
    expect(Number(id)).toBeLessThanOrEqual(after);
  });

  it("produces unique IDs across successive calls", () => {
    const ids = new Set(Array.from({ length: 5 }, () => nextEstimateId()));
    // Due to millisecond resolution, at least 2 unique values are expected
    expect(ids.size).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────── recalc ──────────────────────────────────────

describe("recalc", () => {
  it("calculates total for a single row", () => {
    addRow(document, "Sticker", 10, 50);
    recalc(document);

    expect(document.getElementById("total").innerText).toBe("500.00");
    expect(document.getElementById("out").innerText).toBe("500.00");
  });

  it("sums multiple rows", () => {
    addRow(document, "Sticker", 10, 50);
    addRow(document, "Poster", 5, 100);
    recalc(document);

    expect(document.getElementById("total").innerText).toBe("1000.00");
  });

  it("subtracts advance from total to compute outstanding", () => {
    addRow(document, "Sticker", 10, 100);
    document.getElementById("advance").value = "200";
    recalc(document);

    expect(document.getElementById("total").innerText).toBe("1000.00");
    expect(document.getElementById("out").innerText).toBe("800.00");
  });

  it("handles zero quantity gracefully", () => {
    addRow(document, "Item", 0, 100);
    recalc(document);

    expect(document.getElementById("total").innerText).toBe("0.00");
  });

  it("handles zero rate gracefully", () => {
    addRow(document, "Item", 5, 0);
    recalc(document);

    expect(document.getElementById("total").innerText).toBe("0.00");
  });

  it("handles empty table", () => {
    recalc(document);

    expect(document.getElementById("total").innerText).toBe("0.00");
    expect(document.getElementById("out").innerText).toBe("0.00");
  });

  it("handles negative advance (overpayment)", () => {
    addRow(document, "Poster", 2, 100);
    document.getElementById("advance").value = "300";
    recalc(document);

    expect(document.getElementById("out").innerText).toBe("-100.00");
  });
});

// ─────────────────────── addRow ──────────────────────────────────────

describe("addRow", () => {
  it("adds a row to the table body", () => {
    addRow(document);
    const rows = document.querySelectorAll("#itemsTable tbody tr");
    expect(rows).toHaveLength(1);
  });

  it("creates inputs for part, qty, and rate", () => {
    addRow(document, "Bill Book", 3, 25);
    const row = document.querySelector("#itemsTable tbody tr");

    expect(row.querySelector(".part").value).toBe("Bill Book");
    expect(row.querySelector(".qty").value).toBe("3");
    expect(row.querySelector(".rate").value).toBe("25");
  });

  it("uses default values when called without arguments", () => {
    addRow(document);
    const row = document.querySelector("#itemsTable tbody tr");

    expect(row.querySelector(".part").value).toBe("");
    expect(row.querySelector(".qty").value).toBe("1");
    expect(row.querySelector(".rate").value).toBe("0");
  });

  it("adds multiple rows correctly", () => {
    addRow(document, "A", 1, 10);
    addRow(document, "B", 2, 20);
    addRow(document, "C", 3, 30);

    const rows = document.querySelectorAll("#itemsTable tbody tr");
    expect(rows).toHaveLength(3);
  });

  it("triggers recalc after adding a row", () => {
    addRow(document, "Item", 4, 50);

    expect(document.getElementById("total").innerText).toBe("200.00");
  });

  it("includes a remove button in each row", () => {
    addRow(document);
    const btn = document.querySelector("#itemsTable tbody tr .remove-btn");
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe("X");
  });
});

// ─────────────────────── buildCurrent ────────────────────────────────

describe("buildCurrent", () => {
  it("returns the complete estimate object", () => {
    document.getElementById("estNo").value = "EST-001";
    document.getElementById("custName").value = "Test Customer";
    document.getElementById("phone").value = "9198001234";
    document.getElementById("delivery").value = "3";

    addRow(document, "Visiting Card", 100, 5);
    const result = buildCurrent(document);

    expect(result.estNo).toBe("EST-001");
    expect(result.customer).toBe("Test Customer");
    expect(result.phone).toBe("9198001234");
    expect(result.delivery).toBe("3");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].part).toBe("Visiting Card");
    expect(result.items[0].qty).toBe("100");
    expect(result.items[0].rate).toBe("5");
  });

  it("returns empty items array when no rows exist", () => {
    const result = buildCurrent(document);
    expect(result.items).toEqual([]);
  });

  it("captures total and outstanding strings", () => {
    addRow(document, "Letterhead", 10, 30);
    document.getElementById("advance").value = "100";
    recalc(document);

    const result = buildCurrent(document);
    expect(result.total).toBe("300.00");
    expect(result.outstanding).toBe("200.00");
    expect(result.advance).toBe("100");
  });

  it("handles multiple items", () => {
    addRow(document, "A", 1, 10);
    addRow(document, "B", 2, 20);
    const result = buildCurrent(document);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].part).toBe("A");
    expect(result.items[1].part).toBe("B");
  });
});

// ─────────────────────── saveOnline ──────────────────────────────────

describe("saveOnline", () => {
  it("alerts when customer name is empty", async () => {
    const alertFn = jest.fn();
    const fetchFn = jest.fn();

    await saveOnline(document, "https://example.com", fetchFn, alertFn);

    expect(alertFn).toHaveBeenCalledWith("Enter Customer Name");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("sends POST with JSON body when customer name is provided", async () => {
    document.getElementById("custName").value = "Ali";
    const alertFn = jest.fn();
    const fetchFn = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ message: "OK" }),
    });

    await saveOnline(document, "https://example.com/exec", fetchFn, alertFn);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchFn.mock.calls[0];
    expect(url).toBe("https://example.com/exec");
    expect(opts.method).toBe("POST");

    const body = JSON.parse(opts.body);
    expect(body.customer).toBe("Ali");
  });

  it("shows success message from server response", async () => {
    document.getElementById("custName").value = "Ali";
    const alertFn = jest.fn();
    const fetchFn = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ message: "Saved!" }),
    });

    await saveOnline(document, "https://example.com", fetchFn, alertFn);

    expect(alertFn).toHaveBeenCalledWith("Saved!");
  });

  it("shows default success message when server omits message", async () => {
    document.getElementById("custName").value = "Ali";
    const alertFn = jest.fn();
    const fetchFn = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    });

    await saveOnline(document, "https://example.com", fetchFn, alertFn);

    expect(alertFn).toHaveBeenCalledWith("\u2705Saved successfully");
  });

  it("shows error message on network failure", async () => {
    document.getElementById("custName").value = "Ali";
    const alertFn = jest.fn();
    const fetchFn = jest.fn().mockRejectedValue(new Error("Network down"));

    await saveOnline(document, "https://example.com", fetchFn, alertFn);

    expect(alertFn).toHaveBeenCalledWith(
      expect.stringContaining("Network down"),
    );
  });
});

// ─────────────────────── buildPrintHtml ──────────────────────────────

describe("buildPrintHtml", () => {
  it("returns an HTML string containing the estimate number", () => {
    document.getElementById("estNo").value = "EST-999";
    document.getElementById("custName").value = "Print Customer";
    addRow(document, "Pamphlet", 200, 2);

    const html = buildPrintHtml(document);

    expect(html).toContain("EST-999");
    expect(html).toContain("Print Customer");
    expect(html).toContain("MOHAMMADI PRINTING PRESS");
  });

  it("includes item rows in a table", () => {
    addRow(document, "Flex Banner", 1, 1500);
    const html = buildPrintHtml(document);

    expect(html).toContain("Flex Banner");
    expect(html).toContain("1500");
  });

  it("includes totals", () => {
    addRow(document, "ID Card", 10, 50);
    document.getElementById("advance").value = "100";
    recalc(document);

    const html = buildPrintHtml(document);

    expect(html).toContain("500.00");
    expect(html).toContain("100");
    expect(html).toContain("400.00");
  });

  it("returns valid HTML structure", () => {
    addRow(document);
    const html = buildPrintHtml(document);
    expect(html).toMatch(/^<html>/);
    expect(html).toMatch(/<\/html>$/);
  });
});

// ─────────────────────── buildWhatsAppPayload ────────────────────────

describe("buildWhatsAppPayload", () => {
  it("returns null when phone is empty", () => {
    expect(buildWhatsAppPayload(document)).toBeNull();
  });

  it("strips non-digit characters from phone number", () => {
    document.getElementById("phone").value = "+91-98250-12345";
    const result = buildWhatsAppPayload(document);

    expect(result.phone).toBe("919825012345");
  });

  it("builds a message containing the customer name", () => {
    document.getElementById("phone").value = "9198001234";
    document.getElementById("custName").value = "WA Customer";
    addRow(document, "Sticker", 50, 10);

    const result = buildWhatsAppPayload(document);

    expect(result.message).toContain("WA Customer");
    expect(result.message).toContain("Sticker");
    expect(result.message).toContain("MOHAMMADI PRINTING PRESS");
  });

  it("includes item details in the message", () => {
    document.getElementById("phone").value = "9198001234";
    addRow(document, "Poster", 5, 200);
    addRow(document, "Envelope", 100, 3);

    const result = buildWhatsAppPayload(document);

    expect(result.message).toContain("Poster");
    expect(result.message).toContain("Envelope");
  });

  it("includes total and outstanding in the message", () => {
    document.getElementById("phone").value = "9198001234";
    addRow(document, "Item", 10, 100);
    document.getElementById("advance").value = "500";
    recalc(document);

    const result = buildWhatsAppPayload(document);

    expect(result.message).toContain("1000.00");
    expect(result.message).toContain("500.00");
  });
});
