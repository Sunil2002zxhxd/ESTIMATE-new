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
  projectId: "mohammadi-press-estimate",
  storageBucket: "mohammadi-press-estimate.firebasestorage.app",
  messagingSenderId: "1071377650825",
  appId: "1:1071377650825:web:48677a9fedba43b30b6258",
  databaseURL: "https://mohammadi-press-estimate-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ---------------- Suggestions ---------------- */
const itemsList = ["Bill Book","Visiting Card","Flex Banner","Sticker","Invitation Card","Letterhead","Receipt Book","ID Card","Vinyl Printing","Pamphlet","Poster","Envelope","Glow Sign Board","Business Card (English)","Business Card (Gujarati)","Sticker (Vinyl)"];
const dl=document.createElement('datalist');dl.id='itemSuggestions';itemsList.forEach(i=>{const o=document.createElement('option');o.value=i;dl.appendChild(o)});document.body.appendChild(dl);

/* ---------------- Table functions ---------------- */
function addRow(part='',qty=1,rate=0){
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><input class="part" list="itemSuggestions" value="${part}"></td>
  <td><input class="qty" type="number" value="${qty}"></td>
  <td><input class="rate" type="number" value="${rate}"></td>
  <td class="amt">0.00</td>
  <td><button onclick="this.closest('tr').remove();recalc()" class="small">X</button></td>`;
  document.querySelector('#itemsTable tbody').appendChild(tr);
  tr.querySelectorAll('input').forEach(i=>i.addEventListener('input',recalc));
  recalc();
}
function recalc(){
  let t=0;
  document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    const q=+r.querySelector('.qty').value||0;
    const rt=+r.querySelector('.rate').value||0;
    const a=q*rt; r.querySelector('.amt').innerText=a.toFixed(2); t+=a;
  });
  document.getElementById('total').innerText=t.toFixed(2);
  const adv=+document.getElementById('advance').value||0;
  document.getElementById('out').innerText=(t-adv).toFixed(2);
}
document.getElementById('advance').addEventListener('input',recalc);
addRow();

/* ---------------- Helpers ---------------- */
function nextEstimateId(){return String(Date.now());}
document.getElementById('estNo').value=nextEstimateId();

function buildCurrent(){
  const items=[];document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    items.push({part:r.querySelector('.part').value,qty:r.querySelector('.qty').value,rate:r.querySelector('.rate').value,amt:r.querySelector('.amt').innerText});
  });
  return {
    estNo:document.getElementById('estNo').value,
    customer:document.getElementById('custName').value,
    phone:document.getElementById('phone').value,
    delivery:document.getElementById('delivery').value,
    total:document.getElementById('total').innerText,
    advance:document.getElementById('advance').value,
    outstanding:document.getElementById('out').innerText,
    status:'Pending',
    timestamp:new Date().toLocaleString(),
    items
  };
}

/* ---------------- Save Online ---------------- */
function saveOnline(){
  const data=buildCurrent();
  db.ref('estimates/'+data.estNo).set(data,err=>{
    if(err)alert('Error: '+err);
    else{alert('✅ Saved: '+data.estNo);document.getElementById('estNo').value=nextEstimateId();}
  });
}

/* ---------------- Shared list ---------------- */
function renderSavedList(s){
  const data=s.val()||{};const tb=document.querySelector('#savedTable tbody');tb.innerHTML='';
  Object.values(data).sort((a,b)=>b.estNo.localeCompare(a.estNo)).forEach(e=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${e.estNo}</td><td>${e.customer||''}</td>
    <td class="right">₹${e.total}</td><td class="right">₹${e.outstanding}</td>
    <td contenteditable oninput="db.ref('estimates/${e.estNo}/status').set(this.innerText)">${e.status||'Pending'}</td>
    <td><button onclick="loadEstimate('${e.estNo}')" class="small">Load</button> <button onclick="db.ref('estimates/${e.estNo}').remove()" class="small">Del</button></td>`;
    tb.appendChild(tr);
  });
}
db.ref('estimates').on('value',renderSavedList);

/* ---------------- Load Existing ---------------- */
function loadEstimate(id){
  db.ref('estimates/'+id).once('value').then(s=>{
    const e=s.val();if(!e)return alert('Not found');
    document.getElementById('estNo').value=e.estNo;
    document.getElementById('custName').value=e.customer;
    document.getElementById('phone').value=e.phone;
    document.getElementById('delivery').value=e.delivery;
    document.getElementById('advance').value=e.advance;
    document.querySelector('#itemsTable tbody').innerHTML='';
    (e.items||[]).forEach(it=>addRow(it.part,it.qty,it.rate));
    recalc();window.scrollTo({top:0,behavior:'smooth'});
  });
}

/* ---------------- Excel Download ---------------- */
function downloadAll(){
  db.ref('estimates').once('value').then(s=>{
    const d=s.val();if(!d)return alert('No records');
    const aoa=[['MOHAMMADI PRINTING PRESS - KHAMBHAT'],[]];
    Object.values(d).forEach(e=>{
      aoa.push(['Estimate #'+e.estNo,'', '', '', e.timestamp]);
      aoa.push(['Customer',e.customer,'','','Phone: '+e.phone]);
      aoa.push(['Delivery',e.delivery]);
      aoa.push(['Total',e.total,'','','Advance: '+e.advance]);
      aoa.push(['Outstanding',e.outstanding]);
      aoa.push(['Status',e.status]);
      aoa.push(['Particulars','Qty','Rate','Amount']);
      (e.items||[]).forEach(it=>aoa.push([it.part,it.qty,it.rate,it.amt]));
      aoa.push([]);
    });
    const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb,ws,'Estimates');XLSX.writeFile(wb,'Estimates.xlsx');
  });
}

/* ---------------- Print ---------------- */
function printEstimate(){
  recalc();const e=buildCurrent();const w=window.open('','','width=900,height=1000');
  let h=`<html><head><meta charset="utf-8"><title>Estimate #${e.estNo}</title></head><body style="font-family:Arial;">`;
  h+=`<div style="text-align:center;"><img src="https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png" style="width:140px;"><h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2></div>`;
  h+=`<p><b>Estimate No:</b> ${e.estNo}<br><b>Customer:</b> ${e.customer}<br><b>Phone:</b> ${e.phone}<br><b>Delivery:</b> ${e.delivery}</p>`;
  h+=`<table style="width:100%;border-collapse:collapse;" border="1"><tr><th>Particulars (વસ્તુ)</th><th>Qty</th><th>Rate ₹</th><th>Amount ₹</th></tr>`;
  (e.items||[]).forEach(it=>h+=`<tr><td>${it.part}</td><td>${it.qty}</td><td>${it.rate}</td><td>${it.amt}</td></tr>`);
  h+=`</table><p><b>Total:</b> ₹${e.total}<br><b>Advance:</b> ₹${e.advance}<br><b>Outstanding:</b> ₹${e.outstanding}</p><hr><p>મોહંમદી પ્રિન્ટીંગ પ્રેસ<br>ખંભાત - 388620<br>મો.9825547625</p></body></html>`;
  w.document.write(h);w.document.close();w.print();
}

/* ---------------- WhatsApp ---------------- */
function openWhatsApp(){
  recalc();const e=buildCurrent();const p=(e.phone||'').replace(/\D/g,'');
  if(!p)return alert('Enter phone');let m=`*MOHAMMADI PRINTING PRESS - KHAMBHAT*\n\n*Estimate #${e.estNo}*\n*Customer:* ${e.customer}\n\n`;
  (e.items||[]).forEach(it=>m+=`• ${it.part} | Qty:${it.qty} | Rate:₹${it.rate} | Amt:₹${it.amt}\n`);
  m+=`\n*Total:* ₹${e.total}\n*Advance:* ₹${e.advance}\n*Outstanding:* ₹${e.outstanding}\n*Delivery:* ${e.delivery}\n\nમોહંમદી પ્રિન્ટીંગ પ્રેસ\nમો.9825547625`;
  window.open(`https://wa.me/${p}?text=${encodeURIComponent(m)}`,'_blank');
}
</script>
</body>
</html>
