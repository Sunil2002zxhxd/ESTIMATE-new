<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>MOHAMMADI PRESS ESTIMATE</title>
  <style>
    /* --- Background full logo --- */
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      ![Uploading 17626877640
      782210314128421581538.png…]()

      background: url('<img width="999" height="425" alt="17626877640782210314128421581538" src="https://github.com/user-attachments/assets/0a0d5bb3-28a6-47fa-bef9-676464fa7f7a" />
') no-repeat center center fixed;
      background-size: cover;
      backdrop-filter: blur(2px);
    }

    /* --- Transparent main form --- */
    #page {
      max-width: 900px;
      margin: 20px auto;
      padding: 18px;
      background-color: rgba(255,255,255,0.9);
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    input, textarea, select {
      width: 100%;
      padding: 8px;
      margin: 6px 0;
      box-sizing: border-box;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      background-color: white;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 6px;
      text-align: left;
    }

    button {
      padding: 10px 14px;
      margin-top: 10px;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      background-color: #0a84ff;
      color: white;
      font-weight: bold;
    }

    .controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    #savedTable {
      margin-top: 20px;
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    #savedTable th, #savedTable td {
      border: 1px solid #ccc;
      padding: 8px;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
  <div id="page">
    <h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>

    <label>Estimate Number</label>
    <input id="estNo" placeholder="Auto generated" readonly>

    <label>Customer Name</label>
    <input id="custName" placeholder="Customer name">

    <label>Phone (with country code, e.g. 919825547625)</label>
    <input id="phone" placeholder="91xxxxxxxxxx">

    <label>Delivery / Process Days</label>
    <input id="delivery" placeholder="2/3">

    <h3>Items</h3>
    <table id="itemsTable">
      <thead><tr><th>Particulars</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
      <tbody></tbody>
    </table>
    <button onclick="addRow()">Add item</button>

    <div style="margin-top:12px;">
      <label>Advance Paid (₹)</label>
      <input id="advance" value="0">
      <div style="margin-top:8px;">
        <strong>Total: ₹<span id="total">0</span></strong><br>
        <strong>Outstanding: ₹<span id="out">0</span></strong>
      </div>
    </div>

    <div class="controls">
      <button onclick="saveOnly()">💾 Save Only</button>
      <button onclick="downloadAll()">⬇️ All Download (Excel)</button>
      <button onclick="printEstimate()">🖨️ Print Estimate</button>
      <button onclick="openWhatsApp()">💬 Send to WhatsApp</button>
    </div>

    <h3>Saved Estimates</h3>
    <table id="savedTable">
      <thead>
        <tr><th>No.</th><th>Customer</th><th>Total</th><th>Outstanding</th><th>Status</th><th>Action</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>

<script>
function addRow(part='', qty=1, rate=0){
  const tbody=document.querySelector('#itemsTable tbody');
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td><input class="part" value="${part}"></td>
    <td><input class="qty" type="number" value="${qty}" min="0"></td>
    <td><input class="rate" type="number" value="${rate}" min="0"></td>
    <td class="amt">0</td>
    <td><button onclick="this.closest('tr').remove(); recalc()">Delete</button></td>`;
  tbody.appendChild(tr);
  tr.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',recalc));
  recalc();
}

function recalc(){
  let total=0;
  document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    const q=parseFloat(r.querySelector('.qty').value)||0;
    const rate=parseFloat(r.querySelector('.rate').value)||0;
    const amt=q*rate;
    r.querySelector('.amt').innerText=amt.toFixed(2);
    total+=amt;
  });
  document.getElementById('total').innerText=total.toFixed(2);
  const adv=parseFloat(document.getElementById('advance').value)||0;
  document.getElementById('out').innerText=(total-adv).toFixed(2);
}
document.getElementById('advance').addEventListener('input', recalc);
addRow();

const STORAGE_KEY='mohammadi_estimate_v3';
function getStored(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch(e){return[]}}
function setStored(arr){localStorage.setItem(STORAGE_KEY,JSON.stringify(arr));}
function nextEstimateNo(){const arr=getStored();return arr.length+1;}
document.getElementById('estNo').value=nextEstimateNo();

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
  return{
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

function saveOnly(){
  const arr=getStored();
  const current=buildCurrent();
  arr.push(current);
  setStored(arr);
  alert(`✅ Estimate #${current.estNo} saved successfully!`);
  document.getElementById('estNo').value=nextEstimateNo();
  renderSaved();
}

function renderSaved(){
  const arr=getStored();
  const tbody=document.querySelector('#savedTable tbody');
  tbody.innerHTML='';
  arr.forEach((est,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${est.estNo}</td>
      <td>${est.customer}</td>
      <td>₹${est.total}</td>
      <td>₹${est.outstanding}</td>
      <td contenteditable="true" oninput="updateStatus(${i}, this.innerText)">${est.status||'Pending'}</td>
      <td><button onclick="deleteEstimate(${i})">🗑 Delete</button></td>`;
    tbody.appendChild(tr);
  });
}
function updateStatus(i, val){
  const arr=getStored();
  arr[i].status=val;
  setStored(arr);
}
function deleteEstimate(i){
  const arr=getStored();
  arr.splice(i,1);
  setStored(arr);
  renderSaved();
}
renderSaved();

function downloadAll(){
  const arr=getStored();
  if(arr.length===0){alert('No saved estimates yet!');return;}
  const aoa=[];
  aoa.push(['MOHAMMADI PRINTING PRESS - KHAMBHAT']); aoa.push([]);
  arr.forEach(est=>{
    aoa.push([`Estimate #${est.estNo}`, '', '', '', `Saved: ${est.timestamp}`]);
    aoa.push(['Customer', est.customer, '', '', 'Phone: '+est.phone]);
    aoa.push(['Delivery', est.delivery]);
    aoa.push(['Total', est.total, '', '', 'Advance: '+est.advance]);
    aoa.push(['Outstanding', est.outstanding]);
    aoa.push(['Status', est.status]);
    aoa.push(['Particulars','Qty','Rate','Amount']);
    est.items.forEach(it=>aoa.push([it.part,it.qty,it.rate,it.amt]));
    aoa.push([]);
  });
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb,ws,'All Estimates');
  XLSX.writeFile(wb,'Mohammadi_Press_Estimates.xlsx');
}

function printEstimate(){
  const cust=document.getElementById('custName').value;
  const estNo=document.getElementById('estNo').value;
  const total=document.getElementById('total').innerText;
  const adv=document.getElementById('advance').value;
  const out=document.getElementById('out').innerText;
  const delivery=document.getElementById('delivery').value;
  let w=window.open('', '', 'width=800,height=900');
  w.document.write(`<html><head><title>Estimate #${estNo}</title></head><body>`);
  w.document.write(`<img src='logo.png' style='position:absolute;right:20px;top:20px;width:120px;'>`);
  w.document.write(`<h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>`);
  w.document.write(`<p><b>Estimate No:</b> ${estNo}</p>`);
  w.document.write(`<p><b>Customer:</b> ${cust}</p>`);
  w.document.write(document.getElementById('itemsTable').outerHTML);
  w.document.write(`<p><b>Total:</b> ₹${total}</p>`);
  w.document.write(`<p><b>Advance:</b> ₹${adv}</p>`);
  w.document.write(`<p><b>Outstanding:</b> ₹${out}</p>`);
  w.document.write(`<p><b>Delivery:</b> ${delivery}</p>`);
  w.document.write(`<hr><p>મોહંમદી પ્રિન્ટીંગ પ્રેસ<br>ખંભાત - 388620<br>મો.9825547625</p>`);
  w.document.write('</body></html>');
  w.document.close();
  w.print();
}

/* --- WhatsApp reuse window --- */
let waWindow=null;
function openWhatsApp(){
  const cust=document.getElementById('custName').value;
  const phone=document.getElementById('phone').value.trim();
  const estNo=document.getElementById('estNo').value;
  if(!phone){alert('Enter phone number!');return;}
  let msg=`*MOHAMMADI PRINTING PRESS - KHAMBHAT*\n\n*ESTIMATE #${estNo}*\n`;
  msg+=`*Customer:* ${cust}\n\n*Particulars:*\n`;
  document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    const part=r.querySelector('.part').value;
    const q=r.querySelector('.qty').value;
    const rate=r.querySelector('.rate').value;
    const amt=r.querySelector('.amt').innerText;
    msg+=`• ${part}\n   Qty: ${q}\n   Rate: ₹${rate}\n   Amt: ₹${amt}\n\n`;
  });
  const total=document.getElementById('total').innerText;
  const adv=document.getElementById('advance').value;
  const out=document.getElementById('out').innerText;
  const delivery=document.getElementById('delivery').value;
  msg+=`*Total:* ₹${total}\n*Advance:* ₹${adv}\n*Outstanding:* ₹${out}\n*Delivery:* ${delivery}\n\n*મોહંમદી પ્રિન્ટીંગ પ્રેસ*\nમો.9825547625`;

  const url=`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
  if(waWindow==null || waWindow.closed){
    waWindow=window.open(url,'whatsapp');
  } else {
    waWindow.location.href=url;
    waWindow.focus();
  }
}
</script>
</body>
</html>
