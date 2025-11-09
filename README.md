<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>MOHAMMADI PRESS ESTIMATE</title>
<style>
  body {
    font-family: Arial, sans-serif;
    max-width: 900px;
    margin: 18px auto;
    padding: 12px;
    background: url('logo.jpg') no-repeat center center fixed;
    background-size: 400px;
    background-color: white;
    opacity: 0.97;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  header img {
    width: 120px;
  }
  input, select { width: 100%; padding: 8px; margin: 6px 0; box-sizing: border-box; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
  button { padding: 10px 14px; margin-top: 10px; cursor: pointer; }
  .controls { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  #savedTable input.status {
    border: none; background: #f8f8f8; width: 100%;
  }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
  <header>
    <h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>
    <img src="logo.jpg" alt="Logo">
  </header>

  <label>Estimate Number</label>
  <input id="estNo" readonly>

  <label>Customer Name</label>
  <input id="custName">

  <label>Phone (with country code, e.g. 919825547625)</label>
  <input id="phone">

  <label>Delivery / Process Days</label>
  <input id="delivery">

  <h3>Items</h3>
  <table id="itemsTable">
    <thead><tr><th>Particulars</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
    <tbody></tbody>
  </table>
  <button onclick="addRow()">Add Item</button>

  <label>Advance Paid (₹)</label>
  <input id="advance" value="0">
  <div><strong>Total: ₹<span id="total">0</span></strong><br><strong>Outstanding: ₹<span id="out">0</span></strong></div>

  <div class="controls">
    <button onclick="saveOnly()">💾 Save Only</button>
    <button onclick="downloadAll()">⬇️ All Download (Excel)</button>
    <button onclick="printEstimate()">🖨️ Print Estimate</button>
    <button onclick="openWhatsApp()">💬 Send to WhatsApp</button>
  </div>

  <h3>Saved Estimates</h3>
  <table id="savedTable">
    <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th><th>Delete</th></tr></thead>
    <tbody></tbody>
  </table>

<script>
const STORAGE_KEY = 'mohammadi_estimates_v3';
let whatsappTab = null;

function getStored(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch(e){return[]}}
function setStored(a){localStorage.setItem(STORAGE_KEY,JSON.stringify(a))}
function nextNo(){return getStored().length+1;}
document.getElementById('estNo').value=nextNo();

function addRow(p='',q=1,r=0){
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><input class="part" value="${p}"></td>
  <td><input class="qty" type="number" value="${q}"></td>
  <td><input class="rate" type="number" value="${r}"></td>
  <td class="amt">0</td>
  <td><button onclick="this.closest('tr').remove();recalc()">Delete</button></td>`;
  document.querySelector('#itemsTable tbody').appendChild(tr);
  tr.querySelectorAll('input').forEach(i=>i.addEventListener('input',recalc));
  recalc();
}
function recalc(){
  let t=0;
  document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    const q=parseFloat(r.querySelector('.qty').value)||0;
    const rate=parseFloat(r.querySelector('.rate').value)||0;
    const amt=q*rate;
    r.querySelector('.amt').innerText=amt.toFixed(2);
    t+=amt;
  });
  document.getElementById('total').innerText=t.toFixed(2);
  const adv=parseFloat(document.getElementById('advance').value)||0;
  document.getElementById('out').innerText=(t-adv).toFixed(2);
}
document.getElementById('advance').addEventListener('input',recalc);
addRow();

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

function refreshTable(){
  const tb=document.querySelector('#savedTable tbody');
  tb.innerHTML='';
  getStored().forEach((e,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${e.estNo}</td>
      <td>${e.customer}</td>
      <td>₹${e.total}</td>
      <td><input class="status" value="${e.status||''}" oninput="updateStatus(${i},this.value)"></td>
      <td><button onclick="delEstimate(${i})">🗑️</button></td>`;
    tb.appendChild(tr);
  });
}
function updateStatus(i,v){
  const arr=getStored();
  if(arr[i])arr[i].status=v;
  setStored(arr);
}
function delEstimate(i){
  const arr=getStored();
  arr.splice(i,1);
  setStored(arr);
  refreshTable();
}

function saveOnly(){
  const arr=getStored();
  const cur=buildCurrent();
  arr.push(cur);
  setStored(arr);
  alert(`✅ Estimate #${cur.estNo} saved!`);
  document.getElementById('estNo').value=nextNo();
  refreshTable();
}

function downloadAll(){
  const arr=getStored();
  if(!arr.length){alert('No estimates saved');return;}
  const aoa=[['MOHAMMADI PRINTING PRESS - KHAMBHAT'],[]];
  arr.forEach(e=>{
    aoa.push([`Estimate #${e.estNo}`,'','',`Saved: ${e.timestamp}`]);
    aoa.push(['Customer',e.customer,'','Phone:'+e.phone]);
    aoa.push(['Delivery',e.delivery]);
    aoa.push(['Total',e.total,'','Advance:'+e.advance]);
    aoa.push(['Outstanding',e.outstanding]);
    aoa.push(['Status',e.status]);
    aoa.push(['Particulars','Qty','Rate','Amount']);
    e.items.forEach(it=>aoa.push([it.part,it.qty,it.rate,it.amt]));
    aoa.push([]);
  });
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb,ws,'All Estimates');
  XLSX.writeFile(wb,'mohammadi_press_estimates.xlsx');
}

function printEstimate(){
  const c=document.getElementById('custName').value;
  const n=document.getElementById('estNo').value;
  const t=document.getElementById('total').innerText;
  const a=document.getElementById('advance').value;
  const o=document.getElementById('out').innerText;
  const d=document.getElementById('delivery').value;
  const w=window.open('','','width=800,height=900');
  w.document.write(`<html><head><title>Estimate #${n}</title></head><body>`);
  w.document.write(`<div style="display:flex;justify-content:space-between;align-items:center;">
  <h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>
  <img src='logo.jpg' style='width:100px;'>
  </div>`);
  w.document.write(`<p><b>Estimate No:</b> ${n}</p><p><b>Customer:</b> ${c}</p>`);
  w.document.write(document.getElementById('itemsTable').outerHTML);
  w.document.write(`<p><b>Total:</b> ₹${t}</p><p><b>Advance:</b> ₹${a}</p><p><b>Outstanding:</b> ₹${o}</p><p><b>Delivery:</b> ${d}</p>`);
  w.document.write(`<hr><p>મોહંમદી પ્રિન્ટીંગ પ્રેસ<br>ખંભાત - 388620<br>મો.9825547625</p>`);
  w.document.close(); w.print();
}

function openWhatsApp(){
  const cust=document.getElementById('custName').value;
  const phone=document.getElementById('phone').value.trim();
  const estNo=document.getElementById('estNo').value;
  if(!phone){alert('Enter phone');return;}
  let msg=`*MOHAMMADI PRINTING PRESS - KHAMBHAT*\n\n*ESTIMATE #${estNo}*\n*Customer:* ${cust}\n\n*Particulars:*\n`;
  document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    const p=r.querySelector('.part').value;
    const q=r.querySelector('.qty').value;
    const rate=r.querySelector('.rate').value;
    const a=r.querySelector('.amt').innerText;
    msg+=`• ${p}\n   Qty: ${q}\n   Rate: ₹${rate}\n   Amt: ₹${a}\n\n`;
  });
  msg+=`*Total:* ₹${document.getElementById('total').innerText}\n*Advance:* ₹${document.getElementById('advance').value}\n*Outstanding:* ₹${document.getElementById('out').innerText}\n*Delivery:* ${document.getElementById('delivery').value}\n\n*મોહંમદી પ્રિન્ટીંગ પ્રેસ*\nમો.9825547625`;
  const url=`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
  if(whatsappTab && !whatsappTab.closed) whatsappTab.location.href=url;
  else whatsappTab=window.open(url,'_blank');
}
refreshTable();
</script>
</body>
</html>
