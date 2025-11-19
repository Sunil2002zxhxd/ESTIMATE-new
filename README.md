<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>MOHAMMADI PRESS - Shared Estimate</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;font-family:Arial;background:url('https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png') no-repeat center center fixed;background-size:cover;backdrop-filter:blur(2px);}
#page{max-width:980px;margin:18px auto;padding:18px;background:rgba(255,255,255,0.94);border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);}
h2{text-align:center;margin:6px 0 12px 0;}
label{display:block;margin-top:8px;font-weight:600;}
input,textarea,select{width:100%;padding:8px;margin-top:6px;box-sizing:border-box;}
table{width:100%;border-collapse:collapse;margin-top:10px;background:white;}
th,td{border:1px solid #ddd;padding:6px;text-align:left;}
th{background:#f5f5f5;}
.controls{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px;}
button{padding:10px 14px;border:none;border-radius:6px;background:#0078D7;color:white;font-weight:700;cursor:pointer;}
button.secondary{background:#28a745;}
button.warn{background:#f39c12;}
.small{padding:6px 10px;font-size:13px;}
.right{text-align:right;}
@media(max-width:600px){#page{margin:8px;padding:12px}.controls{flex-direction:column}}
</style>
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
<thead><tr><th>Particulars (વસ્તુ)</th><th>Qty (જથ્થો)</th><th>Rate (દર ₹)</th><th>Amount (રકમ ₹)</th><th></th></tr></thead>
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
<button onclick="printEstimate()" class="warn">🖨️ Print</button>
<button onclick="openWhatsApp()">💬 WhatsApp</button>
</div>
</div>

<script>
const SCRIPT_URL="https://script.google.com/macros/s/AKfycbwDcUzHKb6Nboc1Fs2lxufGq1wpROoH149X-ZwmW3178HOCLLFGPkOw32BrJv5rFWt6jQ/exec

/* Items suggestions */
const itemsList=["Bill Book","Visiting Card","Flex Banner","Sticker","Invitation Card","Letterhead","Receipt Book","ID Card","Vinyl Printing","Pamphlet","Poster","Envelope","Glow Sign Board","Business Card (English)","Business Card (Gujarati)","Sticker (Vinyl)"];
const dl=document.createElement('datalist'); dl.id='itemSuggestions';
itemsList.forEach(i=>{let o=document.createElement('option');o.value=i;dl.appendChild(o);});
document.body.appendChild(dl);

/* Table rows */
function addRow(part='',qty=1,rate=0){
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><input class="part" list="itemSuggestions" value="${part}"></td>
  <td><input class="qty" type="number" value="${qty}" min="1"></td>
  <td><input class="rate" type="number" value="${rate}" min="0"></td>
  <td class="amt">0.00</td>
  <td><button onclick="this.closest('tr').remove();recalc()" class="small">X</button></td>`;
  document.querySelector('#itemsTable tbody').appendChild(tr);
  tr.querySelectorAll('input').forEach(i=>i.addEventListener('input',recalc));
  recalc();
}

function recalc(){
  let total=0;
  document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    const qty=+r.querySelector('.qty').value||0;
    const rate=+r.querySelector('.rate').value||0;
    const amt=qty*rate;
    r.querySelector('.amt').innerText=amt.toFixed(2);
    total+=amt;
  });
  document.getElementById('total').innerText=total.toFixed(2);
  const adv=+document.getElementById('advance').value||0;
  document.getElementById('out').innerText=(total-adv).toFixed(2);
}
document.getElementById('advance').addEventListener('input',recalc);
addRow();

/* Helpers */
function nextEstimateId(){return String(Date.now());}
document.getElementById('estNo').value=nextEstimateId();

function buildCurrent(){
  const items=[];
  document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    items.push({
      part:r.querySelector('.part').value,
      qty:r.querySelector('.qty').value,
      rate:r.querySelector('.rate').value,
      amt:r.querySelector('.amt').innerText
    });
  });
  return {
    estNo:document.getElementById('estNo').value,
    customer:document.getElementById('custName').value,
    phone:document.getElementById('phone').value,
    delivery:document.getElementById('delivery').value,
    total:document.getElementById('total').innerText,
    advance:document.getElementById('advance').value,
    outstanding:document.getElementById('out').innerText,
    items
  };
}

/* Save to Google Sheet */
function saveOnline(){
  const data=buildCurrent();
  if(!data.customer){alert('Enter Customer Name');return;}
  fetch(SCRIPT_URL,{
    method:'POST',
    body:JSON.stringify(data)
  }).then(r=>r.json())
  .then(res=>alert(res.message||'✅ Saved successfully'))
  .catch(e=>alert('❌ Error: '+e));
}

/* Print */
function printEstimate(){
  recalc();
  const e=buildCurrent();
  const w=window.open('','','width=900,height=1000');
  let h=`<html><head><meta charset="utf-8"><title>Estimate #${e.estNo}</title></head>
  <body style="font-family:Arial;padding:20px;">`;
  h+=`<h2 style="text-align:center;">MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>`;
  h+=`<p><b>Estimate No:</b> ${e.estNo}<br><b>Customer:</b> ${e.customer}<br><b>Phone:</b> ${e.phone}<br><b>Delivery:</b> ${e.delivery}</p>`;
  h+=`<table style="width:100%;border-collapse:collapse;" border="1"><tr><th>Particulars</th><th>Qty</th><th>Rate ₹</th><th>Amount ₹</th></tr>`;
  (e.items||[]).forEach(it=>h+=`<tr><td>${it.part}</td><td>${it.qty}</td><td>${it.rate}</td><td>${it.amt}</td></tr>`);
  h+=`</table><p><b>Total:</b> ₹${e.total}<br><b>Advance:</b> ₹${e.advance}<br><b>Outstanding:</b> ₹${e.outstanding}</p>`;
  h+=`<hr><p style="text-align:center;">મોહંમદી પ્રિન્ટીંગ પ્રેસ<br>ખંભાત - 388620<br>મો.9825547625</p></body></html>`;
  w.document.write(h); w.document.close(); w.print();
}

/* WhatsApp */
function openWhatsApp(){
  recalc();
  const e=buildCurrent();
  const p=(e.phone||'').replace(/\D/g,'');
  if(!p){alert('Enter valid phone number'); return;}
  let m=`*MOHAMMADI PRINTING PRESS - KHAMBHAT*\n*Estimate #${e.estNo}*\n*Customer:* ${e.customer}\n`;
  (e.items||[]).forEach(it=>m+=`• ${it.part} | Qty:${it.qty} | Rate:₹${it.rate} | Amt:₹${it.amt}\n`);
  m+=`\n*Total:* ₹${e.total}\n*Advance:* ₹${e.advance}\n*Outstanding:* ₹${e.outstanding}\n*Delivery:* ${e.delivery}\n\nમોહંમદી પ્રિન્ટીંગ પ્રેસ\nમો.9825547625`;
  window.open(`https://wa.me/${p}?text=${encodeURIComponent(m)}`,'_blank');
}
</script>
</body>
</html>
