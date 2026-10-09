/**
 * Business logic extracted from the MOHAMMADI PRINTING PRESS estimate app.
 *
 * Every public function that touches the DOM receives its dependencies
 * (document / window) as parameters so the module can be tested with jsdom
 * without relying on globals.
 */

const ITEM_SUGGESTIONS = [
  "Bill Book",
  "Visiting Card",
  "Flex Banner",
  "Sticker",
  "Invitation Card",
  "Letterhead",
  "Receipt Book",
  "ID Card",
  "Vinyl Printing",
  "Pamphlet",
  "Poster",
  "Envelope",
  "Glow Sign Board",
  "Business Card (English)",
  "Business Card (Gujarati)",
  "Sticker (Vinyl)",
];

/**
 * Generate a unique estimate ID based on the current timestamp.
 */
function nextEstimateId() {
  return String(Date.now());
}

/**
 * Recalculate totals for every row in the items table.
 *
 * @param {Document} doc – the document containing `#itemsTable`, `#total`,
 *   `#advance`, and `#out`.
 */
function recalc(doc) {
  let total = 0;
  doc.querySelectorAll("#itemsTable tbody tr").forEach((r) => {
    const qty = +r.querySelector(".qty").value || 0;
    const rate = +r.querySelector(".rate").value || 0;
    const amt = qty * rate;
    r.querySelector(".amt").innerText = amt.toFixed(2);
    total += amt;
  });
  doc.getElementById("total").innerText = total.toFixed(2);
  const adv = +doc.getElementById("advance").value || 0;
  doc.getElementById("out").innerText = (total - adv).toFixed(2);
}

/**
 * Append a new item row to the items table.
 *
 * @param {Document} doc
 * @param {string}   [part='']
 * @param {number}   [qty=1]
 * @param {number}   [rate=0]
 */
function addRow(doc, part = "", qty = 1, rate = 0) {
  const tr = doc.createElement("tr");
  tr.innerHTML =
    `<td><input class="part" list="itemSuggestions" value="${part}"></td>` +
    `<td><input class="qty" type="number" value="${qty}" min="1"></td>` +
    `<td><input class="rate" type="number" value="${rate}" min="0"></td>` +
    `<td class="amt">0.00</td>` +
    `<td><button class="small remove-btn">X</button></td>`;

  doc.querySelector("#itemsTable tbody").appendChild(tr);
  tr.querySelectorAll("input").forEach((i) =>
    i.addEventListener("input", () => recalc(doc)),
  );
  recalc(doc);
}

/**
 * Build an estimate object from the current form state.
 *
 * @param {Document} doc
 * @returns {{ estNo: string, customer: string, phone: string, delivery: string,
 *             total: string, advance: string, outstanding: string,
 *             items: Array<{part:string, qty:string, rate:string, amt:string}> }}
 */
function buildCurrent(doc) {
  const items = [];
  doc.querySelectorAll("#itemsTable tbody tr").forEach((r) => {
    items.push({
      part: r.querySelector(".part").value,
      qty: r.querySelector(".qty").value,
      rate: r.querySelector(".rate").value,
      amt: r.querySelector(".amt").innerText,
    });
  });
  return {
    estNo: doc.getElementById("estNo").value,
    customer: doc.getElementById("custName").value,
    phone: doc.getElementById("phone").value,
    delivery: doc.getElementById("delivery").value,
    total: doc.getElementById("total").innerText,
    advance: doc.getElementById("advance").value,
    outstanding: doc.getElementById("out").innerText,
    items,
  };
}

/**
 * Validate and save the current estimate to Google Sheets via fetch.
 *
 * @param {Document} doc
 * @param {string}   scriptUrl – Google Apps Script web-app URL
 * @param {typeof globalThis.fetch} fetchFn
 * @param {typeof globalThis.alert} alertFn
 * @returns {Promise<void>}
 */
async function saveOnline(doc, scriptUrl, fetchFn, alertFn) {
  const data = buildCurrent(doc);
  if (!data.customer) {
    alertFn("Enter Customer Name");
    return;
  }
  try {
    const res = await fetchFn(scriptUrl, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    alertFn(json.message || "\u2705Saved successfully");
  } catch (e) {
    alertFn("\u274cError: " + e);
  }
}

/**
 * Build a printable HTML string for the current estimate.
 *
 * @param {Document} doc
 * @returns {string} Full HTML document ready for `document.write`.
 */
function buildPrintHtml(doc) {
  recalc(doc);
  const e = buildCurrent(doc);
  let h =
    `<html><head><meta charset="utf-8"><title>Estimate #${e.estNo}</title></head>` +
    `<body style="font-family:Arial;padding:20px;">`;
  h += `<h2 style="text-align:center;">MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>`;
  h += `<p><b>Estimate No:</b> ${e.estNo}<br><b>Customer:</b> ${e.customer}<br>`;
  h += `<b>Phone:</b> ${e.phone}<br><b>Delivery:</b> ${e.delivery}</p>`;
  h += `<table style="width:100%;border-collapse:collapse;" border="1">`;
  h += `<tr><th>Particulars</th><th>Qty</th><th>Rate \u20b9</th><th>Amount \u20b9</th></tr>`;
  (e.items || []).forEach(
    (it) =>
      (h += `<tr><td>${it.part}</td><td>${it.qty}</td><td>${it.rate}</td><td>${it.amt}</td></tr>`),
  );
  h += `</table><p><b>Total:</b> \u20b9${e.total}<br><b>Advance:</b> \u20b9${e.advance}<br>`;
  h += `<b>Outstanding:</b> \u20b9${e.outstanding}</p>`;
  h += `<hr><p style="text-align:center;">\u0aae\u0ab9\u0aae\u0aa6\u0ac0 \u0aaa\u0acd\u0ab0\u0abf\u0aa8\u0acd\u0a9f\u0abf\u0a82\u0a97 \u0aaa\u0acd\u0ab0\u0ac7\u0ab8<br>\u0a96\u0a82\u0aad\u0abe\u0aa4 - 388620<br>\u0aae\u0acb.9825547625</p></body></html>`;
  return h;
}

/**
 * Build a WhatsApp message string for the current estimate.
 *
 * @param {Document} doc
 * @returns {{ phone: string, message: string } | null}
 *   `null` when the phone number is empty.
 */
function buildWhatsAppPayload(doc) {
  recalc(doc);
  const e = buildCurrent(doc);
  const p = (e.phone || "").replace(/\D/g, "");
  if (!p) return null;

  let m = `*MOHAMMADI PRINTING PRESS - KHAMBHAT*\n*Estimate #${e.estNo}*\n*Customer:* ${e.customer}\n`;
  (e.items || []).forEach(
    (it) =>
      (m += `\u2022 ${it.part} | Qty:${it.qty} | Rate:\u20b9${it.rate} | Amt:\u20b9${it.amt}\n`),
  );
  m += `\n*Total:* \u20b9${e.total}\n*Advance:* \u20b9${e.advance}\n*Outstanding:* \u20b9${e.outstanding}\n`;
  m += `*Delivery:* ${e.delivery}\n\n\u0aae\u0ab9\u0aae\u0aa6\u0ac0 \u0aaa\u0acd\u0ab0\u0abf\u0aa8\u0acd\u0a9f\u0abf\u0a82\u0a97 \u0aaa\u0acd\u0ab0\u0ac7\u0ab8\n\u0aae\u0acb.9825547625`;
  return { phone: p, message: m };
}

module.exports = {
  ITEM_SUGGESTIONS,
  nextEstimateId,
  recalc,
  addRow,
  buildCurrent,
  saveOnline,
  buildPrintHtml,
  buildWhatsAppPayload,
};
