<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>MOHAMMADI PRESS - Shared Estimate</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: url('https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png') no-repeat center center fixed;
      background-size: cover;
      backdrop-filter: blur(2px);
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

  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>

  <!-- XLSX for Excel -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
  <div id="page">
    <h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>

    <label>Estimate Number (અંદાજ ક્રમ)</label>
    <input id="estNo" readonly>

    <label>Customer Name (ગ્રાહકનું નામ)</label>
    <input id="custName" placeholder="Customer name / ગ્રાહકનું નામ">

    <label>Phone (ફોન નંબર)</label>
    <input id="phone" placeholder="9198xxxx...">

    <label>Delivery / Process Days (ડિલિવરી / દિવસ)</label>
    <input id="delivery" placeholder="e.g. 2/3">

    <h3>Items (વસ્તુઓ)</h3>
    <table id="itemsTable">
      <thead>
        <tr><th>Particulars (વસ્તુ)</th><th>Qty (જથ્થો)</th><th>Rate (દર ₹)</th><th>Amount (રકમ ₹)</th><th></th></tr>
      </thead>
      <tbody></tbody>
    </table>
    <div><button onclick="addRow()" class="small">+ Add item (વસ્તુ ઉમેરો)</button></div>

    <label>Advance Paid (એડવાન્સ)</label>
    <input id="advance" value="0" type="number">

    <div>
      <strong>Total (કુલ): ₹<span id="total">0.00</span></strong><br>
      <strong>Outstanding (બાકી): ₹<span id="out">0.00</span></strong>
    </div>

    <div class="controls">
      <button onclick="saveOnline()">💾 Save (Online)</button>
      <button onclick="downloadAll()" class="secondary">⬇️ Excel</button>
      <button onclick="printEstimate()" class="warn">🖨️ Print</button>
      <button onclick="openWhatsApp()">💬 WhatsApp</button>
    </div>

    <p class="note">Type item name or select suggestion (Bill Book, Visiting Card, etc.)</p>

    <h3>Saved Estimates (સાચવેલા અંદાજ)</h3>
    <table id="savedTable">
      <thead><tr><th>No.</th><th>Customer</th><th>Total</th><th>Outstanding</th><th>Status (સ્થીતિ)</th><th>Action</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>

<script>
/* ---------------- Firebase Config ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyB7mjbXykKBaOoHYrUkZcLfMTX_2n3HVE8",
  authDomain: "mohammadi-press-estimate.firebaseapp.com",
  databaseURL: "https://mohammadi-press-estimate-default-rtdb.firebaseio.com",
  projectId: "mohammadi-press-estimate",
  storageBucket: "mohammadi-press-estimate.appspot.com",
  messagingSenderId: "1071377650825",
  appId: "1:1071377650825:web:48677a9fedba43b30b6258"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
console.log("Firebase loaded:", firebase.apps.length);

/* ---------------- Rest of your code (same as before) ---------------- */
// (All the same JavaScript functions: addRow, recalc, saveOnline, downloadAll, etc.)
</script>
</body>
</html>
