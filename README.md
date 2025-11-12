<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>MOHAMMADI PRESS - Estimate System</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: url('https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png') no-repeat center center fixed;
      background-size: cover;
    }
    #page {
      max-width: 980px;
      margin: 18px auto;
      padding: 18px;
      background-color: rgba(255,255,255,0.94);
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    h2 { text-align:center; margin:6px 0 12px 0; }
    label { display:block; margin-top:8px; font-weight:600; }
    input, textarea, select { width:100%; padding:8px; margin-top:6px; box-sizing:border-box; }
    table { width:100%; border-collapse:collapse; margin-top:10px; background:white; }
    th, td { border:1px solid #ddd; padding:6px; text-align:left; }
    th { background:#f5f5f5; }
    .controls { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:12px; }
    button { padding:10px 14px; border:none; border-radius:6px; background:#0078D7; color:white; font-weight:700; cursor:pointer; }
    button.secondary { background:#28a745; }
    button.warn { background:#f39c12; }
    .small { padding:6px 10px; font-size:13px; }
    #savedTable { margin-top:14px; width:100%; background:white; border-collapse:collapse; }
    #savedTable th, #savedTable td { border:1px solid #ccc; padding:8px; }
    .right { text-align:right; }
    .note { font-size:13px; color:#555; margin-top:8px; }
    @media (max-width:600px){
      #page{margin:8px;padding:12px}
      .controls{flex-direction:column}
    }
  </style>

  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
  <div id="page">
    <h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>

    <label>Estimate Number</label>
    <input id="estNo" readonly>

    <label>Customer Name</label>
    <input id="custName" placeholder="Customer name">

    <label>Phone</label>
    <input id="phone" placeholder="91XXXXXXXXXX">

    <label>Delivery Days</label>
    <input id="delivery" placeholder="e.g. 2/3">

    <h3>Items</h3>
    <table id="itemsTable">
      <thead>
        <tr><th>Particulars</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr>
      </thead>
      <tbody></tbody>
    </table>
    <div><button onclick="addRow()" class="small">+ Add item</button></div>

    <label>Advance Paid</label>
    <input id="advance" value="0" type="number">

    <div>
      <strong>Total: ₹<span id="total">0.00</span></strong><br>
      <strong>Outstanding: ₹<span id="out">0.00</span></strong>
    </div>

    <div class="controls">
      <button onclick="saveOnline()">💾 Save</button>
      <button onclick="downloadAll()" class="secondary">⬇️ Excel</button>
      <button onclick="printEstimate()" class="warn">🖨️ Print</button>
      <button onclick="openWhatsApp()">💬 WhatsApp</button>
    </div>

    <h3>Saved Estimates</h3>
    <table id="savedTable">
      <thead><tr><th>No.</th><th>Customer</th><th>Total</th><th>Outstanding</th><th>Status</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>

  <!-- Suggestion List for Printing Items -->
  <datalist id="printItems">
    <option>Visiting Card</option>
    <option>Bill Book</option>
    <option>Letterhead</option>
    <option>Receipt Book</option>
    <option>Envelope</option>
    <option>Poster</option>
    <option>Sticker</option>
    <option>Flex Banner</option>
    <option>Vinyl</option>
    <option>ID Card</option>
    <option>Tag</option>
    <option>Book Binding</option>
    <option>Invitation Card</option>
    <option>Marriage Card</option>
    <option>Brochure</option>
    <option>Catalogue</option>
    <option>Certificate</option>
    <option>Diary Print</option>
    <option>Notebook</option>
    <option>Carry Bag</option>
  </datalist>

<script>
/* ---------------- Firebase Config ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyB7mjbXykKBaOoHYrUkZcLfMTX_2n3HVE8",
  authDomain: "mohammadi-press-estimate.firebaseapp.com",
  databaseURL: "[https://mohammadi-press-estimate-default-rtdb.firebaseio.com",](https://docs.google.com/spreadsheets/d/1-F6bgHHz3OY5TPf-hxxzHfOxIKuCGcIKn7yEpBToGbQ/edit?gid=0#gid=0)
  projectId: "mohammadi-press-estimate",
  storageBucket: "mohammadi-press-estimate.appspot.com",
  messagingSenderId: "1071377650825",
  appId: "1:1071377650825:web:48677a9fedba43b30b6258"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let estNo = Date.now();
document.getElementById("estNo").value = estNo;

function addRow() {
  const tbody = document.querySelector("#itemsTable tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input list="printItems" placeholder="Select or type item"></td>
    <td><input type="number" value="1" min="1"></td>
    <td><input type="number" value="0" step="0.01"></td>
    <td class="right amount">0.00</td>
    <td><button onclick="this.parentElement.parentElement.remove(); recalc();">❌</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelectorAll("input").forEach(i => i.addEventListener("input", recalc));
  recalc();
}

function recalc() {
  let total = 0;
  document.querySelectorAll("#itemsTable tbody tr").forEach(tr => {
    const qty = parseFloat(tr.children[1].querySelector("input").value) || 0;
    const rate = parseFloat(tr.children[2].querySelector("input").value) || 0;
    const amt = qty * rate;
    tr.querySelector(".amount").textContent = amt.toFixed(2);
    total += amt;
  });
  document.getElementById("total").textContent = total.toFixed(2);
  const adv = parseFloat(document.getElementById("advance").value) || 0;
  document.getElementById("out").textContent = (total - adv).toFixed(2);
}
document.getElementById("advance").addEventListener("input", recalc);

function saveOnline() {
  recalc();
  const data = {
    estNo,
    custName: document.getElementById("custName").value,
    phone: document.getElementById("phone").value,
    delivery: document.getElementById("delivery").value,
    advance: parseFloat(document.getElementById("advance").value),
    total: parseFloat(document.getElementById("total").textContent),
    outstanding: parseFloat(document.getElementById("out").textContent),
    items: [],
    status: "Pending",
    time: new Date().toLocaleString()
  };
  document.querySelectorAll("#itemsTable tbody tr").forEach(tr => {
    const tds = tr.querySelectorAll("input");
    data.items.push({
      item: tds[0].value,
      qty: tds[1].value,
      rate: tds[2].value
    });
  });

  db.ref("estimates/" + estNo).set(data, err => {
    if (err) alert("❌ Error saving: " + err);
    else {
      alert("✅ Estimate Saved Successfully!");
      loadSaved();
    }
  });
}

function loadSaved() {
  const tbody = document.querySelector("#savedTable tbody");
  tbody.innerHTML = "";
  db.ref("estimates").once("value", snap => {
    let i = 1;
    snap.forEach(ch => {
      const d = ch.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i++}</td>
        <td>${d.custName}</td>
        <td>₹${d.total}</td>
        <td>₹${d.outstanding}</td>
        <td>${d.status}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}
loadSaved();

function openWhatsApp() {
  const name = document.getElementById("custName").value;
  const phone = document.getElementById("phone").value;
  const total = document.getElementById("total").textContent;
  const outstanding = document.getElementById("out").textContent;
  const msg = `📢 *Dear ${name},*\n🧾 Your printing order is *READY!* ✅\n\n💰 Total: ₹${total}\n💵 Pending: ₹${outstanding}\n\nThank you for choosing *MOHAMMADI PRESS - KHAMBHAT* 🙏`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
}

function printEstimate() { window.print(); }

function downloadAll() {
  db.ref("estimates").once("value", snap => {
    const data = [];
    snap.forEach(ch => data.push(ch.val()));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estimates");
    XLSX.writeFile(wb, "Estimates.xlsx");
  });
}
</script>
</body>
</html>
