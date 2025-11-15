<!-- Save this as public/index.html -->
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>MOHAMMADI PRESS - Estimate System</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    :root{--accent:#0078D7;--warn:#f39c12}
    @page { size: A5; margin: 10mm; }
    body { margin:0; font-family:Arial; color:#111; background:#f6f6f6; }
    #page{max-width:980px;margin:18px auto;padding:18px;background:rgba(255,255,255,0.98);border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.08)}
    .top-row{display:flex;gap:12px;align-items:center}
    #logoWrap{width:120px;height:80px;display:flex;align-items:center;justify-content:center;border-radius:8px;overflow:hidden;background:#fff;padding:6px}
    #logo{max-width:100%;max-height:100%;display:block}
    h2{margin:0;font-size:20px}
    label{display:block;margin-top:8px;font-weight:600}
    input,textarea,select{width:100%;padding:8px;margin-top:6px;box-sizing:border-box;border:1px solid #ddd;border-radius:6px}
    table{width:100%;border-collapse:collapse;margin-top:10px;background:white}
    th,td{border:1px solid #e6e6e6;padding:8px;text-align:left;vertical-align:top}
    th{background:#fafafa}
    button{padding:10px 14px;border:none;border-radius:6px;background:var(--accent);color:white;font-weight:700;cursor:pointer}
    button.warn{background:var(--warn)}
    .small{padding:6px 10px;font-size:13px}
    .right{text-align:right}
    #statusMsg{margin-top:10px;font-weight:bold;text-align:center}
    .success{color:green}.error{color:red}
    textarea{min-height:48px;resize:vertical}
    .controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .muted{color:#666;font-size:13px}
    .saved-actions{display:flex;gap:6px}
    .big-input{font-size:18px;padding:8px}
    @media(max-width:700px){.top-row{flex-direction:column;align-items:flex-start}#logoWrap{width:100%;height:80px}}
  </style>
</head>
<body>
  <div id="page">
    <div class="top-row">
      <div id="logoWrap"><img id="logo" src="logo.png" alt="logo"></div>
      <div style="flex:1">
        <h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>
        <div class="muted">Operators: Murtuzabhai, Sunilbhai, Kiranbhai, Mihirbhai</div>
      </div>
      <div style="width:160px">
        <label style="font-weight:600">Upload Logo (optional)</label>
        <input id="logoInput" type="file" accept="image/*">
      </div>
    </div>

    <div style="display:grid;grid-template-columns:120px 1fr 220px;gap:12px;align-items:center;margin-top:12px">
      <div>
        <label>Estimate No.</label>
        <input id="estNo" readonly>
      </div>
      <div>
        <label>Customer Name</label>
        <input id="custName" placeholder="Customer name">
      </div>
      <div>
        <label>Date & Time</label>
        <input id="dateTime" readonly>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 220px;gap:12px">
      <div>
        <label>Phone</label>
        <input id="phone" placeholder="91XXXXXXXXXX">
      </div>
      <div>
        <label>Operator (Order Taken By)</label>
        <select id="operator">
          <option value="">Select Operator</option>
          <option>Murtuzabhai</option>
          <option>Sunilbhai</option>
          <option>Kiranbhai</option>
          <option>Mihirbhai</option>
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 220px;gap:12px;margin-top:6px">
      <div>
        <label>Delivery Days / Notes</label>
        <input id="delivery" placeholder="e.g. 2/3 or notes">
      </div>
      <div>
        <label>Advance Paid</label>
        <input id="advance" value="0" type="number">
      </div>
    </div>

    <h3 style="margin-top:14px">Items</h3>
    <table id="itemsTable">
      <thead>
        <tr>
          <th style="width:40%">Particulars & Description</th>
          <th style="width:60px">Qty</th>
          <th style="width:100px">Rate</th>
          <th style="width:120px">Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>

    <div style="margin-top:8px;display:flex;gap:8px">
      <button id="addBtn" class="small">+ Add item</button>
      <button id="whatsappEstimateBtn" class="small" style="background:#25D366">📤 Send Estimate (WhatsApp)</button>
      <div style="flex:1"></div>
      <div style="width:220px">
        <strong>Total: ₹<span id="total">0.00</span></strong><br>
        <strong>Outstanding: ₹<span id="out">0.00</span></strong>
      </div>
    </div>

    <div class="controls">
      <button id="saveBtn">💾 Save</button>
      <button id="printBtn" class="warn">🖨️ Print</button>
      <button id="orderBtn">💬 Order Success</button>
      <button id="readyBtn">💬 Job Ready</button>
      <div style="flex:1"></div>
      <div class="muted">Saved estimates show below (local fallback if online script not set)</div>
    </div>

    <div id="statusMsg"></div>

    <h3 style="margin-top:18px">Saved Estimates</h3>
    <table id="savedTable">
      <thead>
        <tr><th>Date</th><th>Est No</th><th>Customer</th><th>Phone</th><th>Total</th><th>Status</th><th>Operator</th><th>Actions</th></tr>
      </thead>
      <tbody></tbody>
    </table>

  </div>

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
/* CONFIG */
const scriptURL = "YOUR_SCRIPT_URL_HERE"; // replace with Apps Script endpoint if you have one
const LOCAL_KEY = 'mohammadi_estimates_v1';
const LOGO_KEY = 'mohammadi_logo_v1';

/* Utilities */
function escapeHtml(text){ if(text === undefined || text === null) return ''; return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function pad(num, size){ return String(num).padStart(size, '0'); }

/* Add row */
window.addRow = function(){
  const tbody = document.querySelector('#itemsTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <input list="printItems" class="part-name" placeholder="Item name" />
      <br>
      <textarea class="part-desc" placeholder="Description (job details)"></textarea>
    </td>
    <td><input class="big-input qty" type="number" value="1" min="1" /></td>
    <td><input class="big-input rate" type="number" value="0" step="0.01" /></td>
    <td class="right amount">0.00</td>
    <td><button type="button" class="del-row">❌</button></td>
  `;
  tbody.appendChild(tr);

  tr.querySelectorAll('input, textarea').forEach(i=>i.addEventListener('input', recalc));
  tr.querySelector('.del-row').addEventListener('click', ()=>{ tr.remove(); recalc(); });
  recalc();
};

window.recalc = function(){
  let total = 0;
  document.querySelectorAll('#itemsTable tbody tr').forEach(tr=>{
    const qty = parseFloat(tr.querySelector('.qty')?.value||0);
    const rate = parseFloat(tr.querySelector('.rate')?.value||0);
    const amt = qty*rate;
    tr.querySelector('.amount').textContent = amt.toFixed(2);
    total += amt;
  });
  document.getElementById('total').textContent = total.toFixed(2);
  const adv = parseFloat(document.getElementById('advance').value||0);
  document.getElementById('out').textContent = (total-adv).toFixed(2);
};

window.collectItems = function(){
  const items = [];
  document.querySelectorAll('#itemsTable tbody tr').forEach(tr=>{
    const name = tr.querySelector('.part-name')?.value || '';
    const desc = tr.querySelector('.part-desc')?.value || '';
    const qty = tr.querySelector('.qty')?.value || 0;
    const rate = tr.querySelector('.rate')?.value || 0;
    const amt = tr.querySelector('.amount')?.textContent || '0.00';
    items.push({item:name, desc, qty, rate, amt});
  });
  return items;
};

window.persistLocal = function(data){
  try{ const arr = JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]'); arr.push(data); localStorage.setItem(LOCAL_KEY, JSON.stringify(arr)); }catch(e){console.error(e);}
};

window.loadSaved = function(){
  const tbody = document.querySelector('#savedTable tbody'); tbody.innerHTML='';
  const local = JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]').slice().reverse();
  local.forEach((r, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML=`
      <td>${escapeHtml(r.date||'')}</td>
      <td>${escapeHtml(String(r.estNo||''))}</td>
      <td>${escapeHtml(r.custName||'')}</td>
      <td>${escapeHtml(r.phone||'')}</td>
      <td>₹${Number(r.total||0).toFixed(2)}</td>
      <td>${escapeHtml(r.status||'')}</td>
      <td>${escapeHtml(r.operator||'')}</td>
      <td class="saved-actions">
        <button data-idx="${idx}" class="editBtn">Edit</button>
        <button data-idx="${idx}" class="delBtn">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.editBtn').forEach(b=>b.addEventListener('click', e=>{ window.loadIntoForm(Number(e.target.dataset.idx)); }));
  tbody.querySelectorAll('.delBtn').forEach(b=>b.addEventListener('click', e=>{ window.removeLocal(Number(e.target.dataset.idx)); }));
};

window.loadIntoForm = function(localIndex){
  const arr = JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]').slice().reverse();
  const data = arr[localIndex]; if(!data) return;
  document.getElementById('estNo').value = data.estNo||'';
  document.getElementById('custName').value = data.custName||'';
  document.getElementById('phone').value = data.phone||'';
  document.getElementById('operator').value = data.operator||'';
  document.getElementById('delivery').value = data.delivery||'';
  document.getElementById('advance').value = data.advance||0;

  const tbody = document.querySelector('#itemsTable tbody'); tbody.innerHTML='';
  (data.items||[]).forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <input list="printItems" class="part-name" value="${escapeHtml(it.item)}" />
        <br>
        <textarea class="part-desc">${escapeHtml(it.desc)}</textarea>
      </td>
      <td><input class="big-input qty" type="number" value="${it.qty||0}" /></td>
      <td><input class="big-input rate" type="number" value="${it.rate||0}" step="0.01" /></td>
      <td class="right amount">${(Number(it.amt)||0).toFixed(2)}</td>
      <td><button type="button" class="del-row">❌</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input, textarea').forEach(i=>i.addEventListener('input', recalc));
    tr.querySelector('.del-row').addEventListener('click', ()=>{ tr.remove(); recalc(); });
  });
  recalc();
};

window.removeLocal = function(localIndex){
  let arr = JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]').slice().reverse();
  arr.splice(localIndex,1);
  arr = arr.reverse();
  localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
  loadSaved();
};

window.openWhatsAppSuccess = function(){
  recalc();
  const name=document.getElementById('custName').value||'';
  const phone=document.getElementById('phone').value||'';
  const total=document.getElementById('total').textContent||'0.00';
  const advance=document.getElementById('advance').value||'0';
  const outstanding=document.getElementById('out').textContent||'0.00';
  let itemMsg='';
  document.querySelectorAll('#itemsTable tbody tr').forEach(tr=>{
    const n=tr.querySelector('.part-name')?.value||'';
    const d=tr.querySelector('.part-desc')?.value||'';
    const q=tr.querySelector('.qty')?.value||'';
    const r=tr.querySelector('.rate')?.value||'';
    const a=tr.querySelector('.amount')?.textContent||'0.00';
    if(n) itemMsg+='• '+n+'\n'+(d?'   '+d+'\n':'')+'   Qty: '+q+'\n   Rate: ₹'+r+'\n   Amt: ₹'+a+'\n\n';
  });
  const msg=`MOHAMMADI PRINTING PRESS - KHAMBHAT

Your order is booked successfully!
ESTIMATE #${document.getElementById('estNo').value}
Customer: ${name}

Particulars:
${itemMsg}Total: ₹${total}
Advance: ₹${advance}
Outstanding: ₹${outstanding}

મોહંમદી પ્રિન્ટીંગ પ્રેસ
મો.9825547625`;
  if(phone) window.open('https://wa.me/'+encodeURIComponent(phone)+'?text='+encodeURIComponent(msg));
};

window.openWhatsAppReady = function(){
  recalc();
  const phone=document.getElementById('phone').value||'';
  const total=document.getElementById('total').textContent||'0.00';
  const advance=document.getElementById('advance').value||'0';
  const outstanding=document.getElementById('out').textContent||'0.00';
  const msg=`📢 Dear customer, your job is ready!

Total: ₹${total}
Advance: ₹${advance}
Outstanding: ₹${outstanding}

MOHAMMADI PRINTING PRESS - KHAMBHAT`;
  if(phone) window.open('https://wa.me/'+encodeURIComponent(phone)+'?text='+encodeURIComponent(msg));
};

window.sendEstimateWhatsApp = function(){
  recalc();
  const name=document.getElementById('custName').value||'';
  const phone=document.getElementById('phone').value||'';
  const total=document.getElementById('total').textContent||'0.00';
  const advance=document.getElementById('advance').value||'0';
  const outstanding=document.getElementById('out').textContent||'0.00';
  let itemMsg='';
  document.querySelectorAll('#itemsTable tbody tr').forEach(tr=>{
    const n=tr.querySelector('.part-name')?.value||'';
    const q=tr.querySelector('.qty')?.value||'';
    const r=tr.querySelector('.rate')?.value||'';
    const a=tr.querySelector('.amount')?.textContent||'0.00';
    if(n) itemMsg+='• '+n+'  Qty:'+q+'  Rate:₹'+r+'  Amt:₹'+a+'\n';
  });
  const msg=`*MOHAMMADI PRINTING PRESS - KHAMBHAT*
*ESTIMATE #${document.getElementById('estNo').value}*
Customer: ${name}

${itemMsg}
Total: ₹${total}
Advance: ₹${advance}
Outstanding: ₹${outstanding}`;
  if(phone) window.open('https://wa.me/'+encodeURIComponent(phone)+'?text='+encodeURIComponent(msg));
};

window.saveOnline = function(){
  recalc();
  let last = Number(localStorage.getItem('last_est_no')||0)+1;
  localStorage.setItem('last_est_no', last);
  const estNo = pad(last,3);
  document.getElementById('estNo').value = estNo;

  const data = {
    date: new Date().toLocaleString(),
    estNo: estNo,
    custName: document.getElementById('custName').value||'',
    phone: document.getElementById('phone').value||'',
    operator: document.getElementById('operator').value||'',
    delivery: document.getElementById('delivery').value||'',
    advance: parseFloat(document.getElementById('advance').value)||0,
    total: parseFloat(document.getElementById('total').textContent)||0,
    outstanding: parseFloat(document.getElementById('out').textContent)||0,
    status:'Order Received',
    items: collectItems()
  };

  document.getElementById('statusMsg').textContent='⏳ Saving...';

  if(scriptURL && scriptURL!=='YOUR_SCRIPT_URL_HERE'){
    fetch(scriptURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
    .then(r=>r.text()).then(txt=>{
      document.getElementById('statusMsg').textContent='✅ Saved to server';
      document.getElementById('statusMsg').className='success';
      persistLocal(data); loadSaved();
    }).catch(err=>{
      document.getElementById('statusMsg').textContent='⚠️ Server save failed — saved locally';
      document.getElementById('statusMsg').className='error';
      persistLocal(data); loadSaved();
    });
  } else {
    persistLocal(data);
    document.getElementById('statusMsg').textContent='✅ Saved locally';
    document.getElementById('statusMsg').className='success';
    loadSaved();
  }
};

window.printEstimate = function(){ window.print(); };

window.handleLogoUpload = function(e){
  const f = e.target.files?.[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload=function(evt){ document.getElementById('logo').src=evt.target.result; try{ localStorage.setItem(LOGO_KEY, evt.target.result) }catch(e){} };
  reader.readAsDataURL(f);
};

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('estNo').value = pad(Number(localStorage.getItem('last_est_no')||0)+1,3);
  document.getElementById('dateTime').value = new Date().toLocaleString();
  const logoData=localStorage.getItem(LOGO_KEY); if(logoData) document.getElementById('logo').src=logoData;
  document.getElementById('addBtn').addEventListener('click',()=>window.addRow());
  document.getElementById('saveBtn').addEventListener('click',()=>window.saveOnline());
  document.getElementById('printBtn').addEventListener('click',()=>window.printEstimate());
  document.getElementById('orderBtn').addEventListener('click',()=>window.openWhatsAppSuccess());
  document.getElementById('readyBtn').addEventListener('click',()=>window.openWhatsAppReady());
  document.getElementById('whatsappEstimateBtn').addEventListener('click',()=>window.sendEstimateWhatsApp());
  document.getElementById('logoInput').addEventListener('change', window.handleLogoUpload);
  document.getElementById('advance').addEventListener('input', ()=>window.recalc());
  if(document.querySelectorAll('#itemsTable tbody tr').length===0) window.addRow();
  window.loadSaved();
});
</script>
</body>
</html>
