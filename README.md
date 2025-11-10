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

  <!-- Firebase (compat) -->
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>

  <!-- XLSX for Excel download -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
  <div id="page">
    <h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>

    <label>Estimate Number (અંદાજ ક્રમ)</label>
    <input id="estNo" readonly>

    <label>Customer Name (ગ્રાહકનું નામ)</label>
    <input id="custName" placeholder="Customer name / ગ્રાહકનું નામ">

    <label>Phone (ફોન નંબર) — with country code</label>
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
    <div style="margin-top:8px;">
      <button onclick="addRow()" class="small">+ Add item (વસ્તુ ઉમેરો)</button>
    </div>

    <div style="margin-top:12px;">
      <label>Advance Paid (એડવાન્સ)</label>
      <input id="advance" value="0" type="number">
      <div style="margin-top:8px;">
        <strong>Total (કુલ): ₹<span id="total">0.00</span></strong><br>
        <strong>Outstanding (બાકી): ₹<span id="out">0.00</span></strong>
      </div>
    </div>

    <div class="controls">
      <button onclick="saveOnline()">💾 Save (Online)</button>
      <button onclick="downloadAll()" class="secondary">⬇️ Download All (Excel)</button>
      <button onclick="printEstimate()" class="warn">🖨️ Print</button>
      <button onclick="openWhatsApp()">💬 WhatsApp</button>
    </div>

    <p class="note">Particulars have suggestions — type and select (Bill Book, Visiting Card, Flex Banner, etc.)</p>

    <h3>Saved Estimates (સાચવેલા અંદાજ)</h3>
    <table id="savedTable">
      <thead><tr><th>No.</th><th>Customer</th><th>Total</th><th>Outstanding</th><th>Status (સ્થીતિ)</th><th>Action</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>

<script>
  /********** Firebase config (from your project) **********/
  const firebaseConfig = {
    apiKey: "AIzaSyB7mjbXykKBaOoHYrUkZcLfMTX_2n3HVE8",
    authDomain: "mohammadi-press-estimate.firebaseapp.com",
    projectId: "mohammadi-press-estimate",
    storageBucket: "mohammadi-press-estimate.firebasestorage.app",
    messagingSenderId: "1071377650825",
    appId: "1:1071377650825:web:48677a9fedba43b30b6258"
    // If you have databaseURL, you can add: databaseURL: "https://<your-db>.firebaseio.com"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  /********** Items auto-suggestions **********/
  const itemsList = [
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
    "Sticker (Vinyl)"
  ];
  // create datalist element for suggestions
  const dl = document.createElement('datalist');
  dl.id = 'itemSuggestions';
  itemsList.forEach(i => { const opt = document.createElement('option'); opt.value = i; dl.appendChild(opt); });
  document.body.appendChild(dl);

  /********** Add rows, recalc **********/
  function addRow(part = '', qty = 1, rate = 0) {
    const tbody = document.querySelector('#itemsTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="part" list="itemSuggestions" value="${escapeHtml(part)}" placeholder="Type or select item"></td>
      <td><input class="qty" type="number" min="0" value="${qty}"></td>
      <td><input class="rate" type="number" min="0" value="${rate}"></td>
      <td class="amt">0.00</td>
      <td><button onclick="this.closest('tr').remove(); recalc()" class="small">Delete</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', recalc));
    recalc();
  }

  function recalc(){
    let total = 0;
    document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
      const qty = parseFloat(r.querySelector('.qty').value) || 0;
      const rate = parseFloat(r.querySelector('.rate').value) || 0;
      const amt = qty * rate;
      r.querySelector('.amt').innerText = amt.toFixed(2);
      total += amt;
    });
    document.getElementById('total').innerText = total.toFixed(2);
    const adv = parseFloat(document.getElementById('advance').value) || 0;
    document.getElementById('out').innerText = (total - adv).toFixed(2);
  }

  document.getElementById('advance').addEventListener('input', recalc);

  // helper to escape quotes in value
  function escapeHtml(text){
    if(!text) return '';
    return text.replace(/"/g, '&quot;');
  }

  // Start with one blank row
  addRow();

  /********** Generate estimate id (timestamp) and show **********/
  function nextEstimateId(){
    return String(Date.now());
  }
  document.getElementById('estNo').value = nextEstimateId();

  /********** Build current estimate object **********/
  function buildCurrent(){
    const items = [];
    document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
      items.push({
        part: r.querySelector('.part').value || '',
        qty: r.querySelector('.qty').value || '0',
        rate: r.querySelector('.rate').value || '0',
        amt: r.querySelector('.amt').innerText || '0.00'
      });
    });
    return {
      estNo: document.getElementById('estNo').value,
      customer: document.getElementById('custName').value,
      phone: document.getElementById('phone').value,
      delivery: document.getElementById('delivery').value,
      total: document.getElementById('total').innerText,
      advance: document.getElementById('advance').value,
      outstanding: document.getElementById('out').innerText,
      status: 'Pending',
      timestamp: new Date().toLocaleString(),
      items
    };
  }

  /********** Save online (to Firebase Realtime DB) **********/
  function saveOnline(){
    const data = buildCurrent();
    if(!data.customer){
      if(!confirm('Customer name is empty — save anyway?')) return;
    }
    // Write to: estimates/{estNo}
    db.ref('estimates/' + data.estNo).set(data, err => {
      if(err) alert('Error saving: ' + err);
      else {
        alert('✅ Estimate saved online: #' + data.estNo);
        document.getElementById('estNo').value = nextEstimateId();
      }
    });
  }

  /********** Listen for changes & render saved table (shared) **********/
  function renderSavedList(snapshot){
    const data = snapshot.val() || {};
    const tbody = document.querySelector('#savedTable tbody');
    tbody.innerHTML = '';
    // convert to array sorted by timestamp (optional)
    const arr = Object.values(data).sort((a,b) => (a.estNo > b.estNo ? -1 : 1));
    arr.forEach(est => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${est.estNo}</td>
        <td>${escapeForTable(est.customer)}</td>
        <td class="right">₹${est.total}</td>
        <td class="right">₹${est.outstanding}</td>
        <td contenteditable="true" oninput="updateStatus('${est.estNo}', this.innerText)">${escapeForTable(est.status||'Pending')}</td>
        <td><button onclick="loadEstimate('${est.estNo}')" class="small">Load</button> <button onclick="deleteEstimate('${est.estNo}')" class="small">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  db.ref('estimates').on('value', renderSavedList);

  function escapeForTable(s){ return (s||'').toString().replace(/</g,'&lt;'); }

  function updateStatus(id, val){
    db.ref('estimates/' + id + '/status').set(val);
  }

  function deleteEstimate(id){
    if(!confirm('Delete estimate #' + id + ' ?')) return;
    db.ref('estimates/' + id).remove();
  }

  /********** Load an existing estimate into form for edit/print/send **********/
  function loadEstimate(id){
    db.ref('estimates/' + id).once('value').then(snap=>{
      const est = snap.val();
      if(!est) { alert('Not found'); return; }
      document.getElementById('estNo').value = est.estNo;
      document.getElementById('custName').value = est.customer;
      document.getElementById('phone').value = est.phone;
      document.getElementById('delivery').value = est.delivery;
      document.getElementById('advance').value = est.advance || '0';
      // clear rows
      document.querySelector('#itemsTable tbody').innerHTML = '';
      (est.items || []).forEach(it => addRow(it.part, it.qty, it.rate));
      recalc();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /********** Download all estimates as Excel (XLSX) **********/
  function downloadAll(){
    db.ref('estimates').once('value').then(snap=>{
      const data = snap.val();
      if(!data){ alert('No saved estimates'); return; }
      const aoa = [];
      aoa.push(['MOHAMMADI PRINTING PRESS - KHAMBHAT']); aoa.push([]);
      Object.values(data).forEach(est => {
        aoa.push([`Estimate #${est.estNo}`, '', '', '', `Saved: ${est.timestamp}`]);
        aoa.push(['Customer', est.customer, '', '', 'Phone: ' + est.phone]);
        aoa.push(['Delivery', est.delivery]);
        aoa.push(['Total', est.total, '', '', 'Advance: ' + est.advance]);
        aoa.push(['Outstanding', est.outstanding]);
        aoa.push(['Status', est.status]);
        aoa.push(['Particulars', 'Qty', 'Rate', 'Amount']);
        (est.items || []).forEach(it => aoa.push([it.part, it.qty, it.rate, it.amt]));
        aoa.push([]);
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'All Estimates');
      XLSX.writeFile(wb, 'Mohammadi_Press_Estimates.xlsx');
    });
  }

  /********** Print (English + Gujarati) **********/
  function printEstimate(){
    recalc();
    const est = buildCurrent();
    const w = window.open('', '', 'width=900,height=1000');
    let html = `<html><head><title>Estimate #${est.estNo}</title><meta charset="utf-8"></head><body style="font-family:Arial;">`;
    html += `<div style="text-align:center;"><img src="https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png" style="width:140px;"><h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2></div>`;
    html += `<p><b>Estimate No (અંદાજ):</b> ${est.estNo}<br>`;
    html += `<b>Customer (ગ્રાહક):</b> ${escapeForTable(est.customer)}<br>`;
    html += `<b>Phone (ફોન):</b> ${escapeForTable(est.phone)}<br>`;
    html += `<b>Delivery (ડિલિવરી):</b> ${escapeForTable(est.delivery)}</p>`;
    // create items table
    html += `<table style="width:100%;border-collapse:collapse;" border="1"><tr><th>Particulars (વસ્તુ)</th><th>Qty (જથ્થો)</th><th>Rate (દર ₹)</th><th>Amount (રકમ ₹)</th></tr>`;
    (est.items || []).forEach(it => {
      html += `<tr><td>${escapeForTable(it.part)}</td><td class="right">${it.qty}</td><td class="right">₹${it.rate}</td><td class="right">₹${it.amt}</td></tr>`;
    });
    html += `</table>`;
    html += `<p><b>Total (કુલ):</b> ₹${est.total}<br><b>Advance (એડવાન્સ):</b> ₹${est.advance}<br><b>Outstanding (બાકી):</b> ₹${est.outstanding}</p>`;
    html += `<hr><p>મોહંમદી પ્રિન્ટીંગ પ્રેસ<br>ખંભાત - 388620<br>મો.9825547625</p>`;
    html += `</body></html>`;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  /********** WhatsApp send (opens wa web / mobile) **********/
  function openWhatsApp(){
    recalc();
    const est = buildCurrent();
    const phone = (est.phone || '').replace(/\D/g,'');
    if(!phone){ alert('Enter phone number'); return; }
    let msg = `*MOHAMMADI PRINTING PRESS - KHAMBHAT*\n\n*ESTIMATE #${est.estNo}*\n*Customer (ગ્રાહક):* ${est.customer}\n\n*Particulars (વસ્તુઓ):*\n`;
    (est.items || []).forEach(it => {
      msg += `• ${it.part}\n   Qty: ${it.qty}\n   Rate: ₹${it.rate}\n   Amt: ₹${it.amt}\n\n`;
    });
    msg += `*Total (કુલ):* ₹${est.total}\n*Advance (એડવાન્સ):* ₹${est.advance}\n*Outstanding (બાકી):* ₹${est.outstanding}\n*Delivery (ડિલિવરી):* ${est.delivery}\n\nમોહંમદી પ્રિન્ટીંગ પ્રેસ\nમો.9825547625`;
    // Use wa.me short link
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url,'_blank');
  }

  /********** Utility: load saved on start if any **********/
  // Already listening via db.ref('estimates').on('value', ...)
  // But ensure single blank row
  // (initial estNo already set above)

  // Escape helper safe usage
  function escapeForTable(s){ return (s||'').toString().replace(/</g,'&lt;'); }

  // Done
</script>
</body>
</html>
