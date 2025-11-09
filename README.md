<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Estimate → WhatsApp — Mohammadi Printing (Single Excel Workbook)</title>
  <style>
    body { font-family: Arial, sans-serif; max-width:900px; margin:18px auto; padding:12px; }
    input, textarea, select { width:100%; padding:8px; margin:6px 0; box-sizing:border-box; }
    .row { display:flex; gap:8px; }
    .row > input { flex:1 }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th,td { border:1px solid #ddd; padding:6px; text-align:left; }
    button { padding:10px 14px; margin-top:10px; cursor:pointer; }
    .controls { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
    .thumbs { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
    .thumbs img { width:120px; height:80px; object-fit:cover; border:1px solid #ccc; padding:4px; }
    small { color:#555; }
  </style>

  <!-- Libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
  <h2>MOHAMMADIPRINTING PRESS - KHAMBHAT</h2>

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

  <h3>Attach images (optional)</h3>
  <input id="images" type="file" accept="image/*" multiple>
  <div class="thumbs" id="thumbs"></div>

  <div class="controls">
    <button onclick="generatePdf()">Generate & Download PDF (with images)</button>
    <button onclick="downloadImagesZip()">Download Images (ZIP)</button>
    <button onclick="saveAndExportExcel()">💾 Save & Export Excel</button>
    <button onclick="downloadAllEstimates()">⬇️ Download All Estimates (Excel)</button>
    <button onclick="printEstimate()">🖨️ Print Estimate</button>
    <button onclick="openWhatsApp()">Open WhatsApp (prefilled message)</button>
  </div>

  <p><small>નોટ: Export Excel કરવાથી તે Excel ફાઇલમાં તમારું હાલનું estimate જોડાઇ જાય છે (local storage માં saved). તમે પછી પણ Download All Estimates દબાવીને cumulative ફાઇલ પામого.</small></p>

<script>
/* --------- Basic items & calc ---------- */
function addRow(part='', qty=1, rate=0){
  const tbody = document.querySelector('#itemsTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="part" value="${escapeHtml(part)}"></td>
    <td><input class="qty" type="number" value="${qty}" min="0"></td>
    <td><input class="rate" type="number" value="${rate}" min="0"></td>
    <td class="amt">0</td>
    <td><button onclick="this.closest('tr').remove(); recalc()">Delete</button></td>
  `;
  tbody.appendChild(tr);
  tbody.querySelectorAll('input.qty, input.rate').forEach(inp => inp.addEventListener('input', recalc));
  recalc();
}
function recalc(){
  const rows = document.querySelectorAll('#itemsTable tbody tr');
  let total=0;
  rows.forEach(r=>{
    const q = parseFloat(r.querySelector('.qty').value)||0;
    const rate = parseFloat(r.querySelector('.rate').value)||0;
    const amt = q*rate;
    r.querySelector('.amt').innerText = amt.toFixed(2);
    total += amt;
  });
  document.getElementById('total').innerText = total.toFixed(2);
  const adv = parseFloat(document.getElementById('advance').value)||0;
  document.getElementById('out').innerText = (total-adv).toFixed(2);
}
document.getElementById('advance').addEventListener('input', recalc);
addRow('1 BOOK', 150, 5);
addRow('Extra cover', 50, 2);

/* Image preview */
let imageFiles = [];
document.getElementById('images').addEventListener('change', (e) => {
  imageFiles = Array.from(e.target.files);
  const thumbs = document.getElementById('thumbs'); thumbs.innerHTML = '';
  imageFiles.forEach(f => {
    const url = URL.createObjectURL(f);
    const img = document.createElement('img'); img.src = url; img.title = f.name;
    thumbs.appendChild(img);
  });
});

/* --------- PDF functions (unchanged) --------- */
async function generatePdf(){
  const custName = document.getElementById('custName').value || '';
  const delivery = document.getElementById('delivery').value || '';
  const total = document.getElementById('total').innerText || '0';
  const advance = document.getElementById('advance').value || '0';
  const out = document.getElementById('out').innerText || '0';

  const wrapper = document.createElement('div');
  wrapper.style.width = '800px'; wrapper.style.padding = '20px'; wrapper.style.background = '#fff'; wrapper.style.color = '#000';
  wrapper.innerHTML = `
    <h1>MOHAMMADIPRINTING PRESS - KHAMBHAT</h1>
    <p><strong>ESTIMATE</strong></p>
    <p>Customer: ${escapeHtml(custName)}</p>
    <table style="width:100%; border-collapse:collapse; margin-top:8px;">
      <thead><tr><th>Particulars</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${[...document.querySelectorAll('#itemsTable tbody tr')].map(r=>{
          const part = escapeHtml(r.querySelector('.part').value||'');
          const q = r.querySelector('.qty').value||'0';
          const rate = r.querySelector('.rate').value||'0';
          const amt = (parseFloat(q||0)*parseFloat(rate||0)).toFixed(2);
          return `<tr><td style="border:1px solid #ccc; padding:6px">${part}</td>
          <td style="border:1px solid #ccc; padding:6px">${q}</td>
          <td style="border:1px solid #ccc; padding:6px">₹${rate}</td>
          <td style="border:1px solid #ccc; padding:6px">₹${amt}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
    <p><strong>Total: ₹${total}</strong></p>
    <p>Advance: ₹${advance}</p>
    <p>Outstanding: ₹${out}</p>
    <p>Delivery: ${escapeHtml(delivery)}</p>
    <hr>
    <p>મોહંમદી પ્રિન્ટીંગ પ્રેસ<br>ડાઃ સકીનાબેનના દવાખાના પાસે, વ્હોરવાડ, ખંભાત-388620<br>મો.9825547625</p>
  `;
  document.body.appendChild(wrapper);
  const canvas = await html2canvas(wrapper, {scale: 2});
  document.body.removeChild(wrapper);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'px', format: 'a4' });
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const ratio = Math.min(pdf.internal.pageSize.getWidth() / canvas.width, pdf.internal.pageSize.getHeight() / canvas.height);
  const imgW = canvas.width * ratio; const imgH = canvas.height * ratio;
  pdf.addImage(imgData, 'JPEG', (pdf.internal.pageSize.getWidth() - imgW)/2, 20, imgW, imgH);

  for (let i=0; i<imageFiles.length; i++){
    const dataUrl = await fileToDataURL(imageFiles[i]);
    pdf.addPage();
    const img = await loadImage(dataUrl);
    const ar = img.width / img.height;
    let iw = pdf.internal.pageSize.getWidth() - 40;
    let ih = pdf.internal.pageSize.getHeight() - 80;
    let drawW = iw, drawH = iw / ar;
    if (drawH > ih) { drawH = ih; drawW = ih * ar; }
    pdf.addImage(dataUrl, 'JPEG', (pdf.internal.pageSize.getWidth()-drawW)/2, 40, drawW, drawH);
  }
  pdf.save('estimate.pdf');
}
function fileToDataURL(file){ return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
function loadImage(src){ return new Promise((res, rej) => { const i = new Image(); i.onload = ()=>res(i); i.onerror = rej; i.src = src; }); }

/* --------- Images ZIP --------- */
async function downloadImagesZip(){
  if(imageFiles.length === 0){ alert('No images selected'); return; }
  const zip = new JSZip();
  for (let f of imageFiles){ const data = await f.arrayBuffer(); zip.file(f.name, data); }
  const blob = await zip.generateAsync({type:'blob'});
  saveAs(blob, 'images.zip');
}

/* --------- Single cumulative Excel workbook behavior --------- */
/* localStorage key */
const STORAGE_KEY = 'mp_estimates_storage_v1';

/* read stored estimates (array) */
function getStoredEstimates(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return [];
    return JSON.parse(raw);
  } catch(e) { console.error(e); return []; }
}

/* save array back */
function setStoredEstimates(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/* build current estimate object */
function buildCurrentEstimate(){
  const custName = document.getElementById('custName').value || '';
  const phone = document.getElementById('phone').value || '';
  const delivery = document.getElementById('delivery').value || '';
  const total = document.getElementById('total').innerText || '0';
  const advance = document.getElementById('advance').value || '0';
  const out = document.getElementById('out').innerText || '0';
  const items = [];
  document.querySelectorAll('#itemsTable tbody tr').forEach(r=>{
    items.push({
      part: r.querySelector('.part').value || '',
      qty: r.querySelector('.qty').value || '0',
      rate: r.querySelector('.rate').value || '0',
      amt: r.querySelector('.amt').innerText || '0'
    });
  });
  const ts = new Date().toISOString();
  return { id: ts, timestamp: ts, customer: custName, phone, delivery, total, advance, outstanding: out, items };
}

/* Append current estimate to storage and return new array */
function appendCurrentEstimateToStorage(){
  const arr = getStoredEstimates();
  const cur = buildCurrentEstimate();
  arr.push(cur);
  setStoredEstimates(arr);
  return arr;
}

/* Convert stored estimates into a single worksheet (rows) */
function buildAOAFromStored(arr){
  const aoa = [];
  aoa.push(['MOHAMMADIPRINTING PRESS - KHAMBHAT']);
  aoa.push([]);
  // For each estimate, create a block
  arr.forEach((est, idx) => {
    aoa.push([`Estimate #${idx+1}`, '', '', '', '', `Saved: ${est.timestamp}`]);
    aoa.push(['Customer', est.customer, '', '', '', `Phone: ${est.phone}`]);
    aoa.push(['Delivery', est.delivery, '', '', '', '']);
    aoa.push(['Total', '', '', '', est.total, 'Advance: ' + est.advance]);
    aoa.push(['Outstanding', '', '', '', est.outstanding, '']);
    aoa.push([]);
    aoa.push(['Particulars', 'Qty', 'Rate', 'Amount']);
    est.items.forEach(it => {
      aoa.push([it.part, it.qty, it.rate, it.amt]);
    });
    aoa.push([]); aoa.push([]); // spacing between estimates
  });
  return aoa;
}

/* Save current estimate to storage and export cumulative workbook */
function saveAndExportExcel(){
  const arr = appendCurrentEstimateToStorage();
  const aoa = buildAOAFromStored(arr);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, 'All Estimates');
  XLSX.writeFile(wb, 'estimates_all.xlsx');
  alert('Current estimate saved and cumulative Excel downloaded (estimates_all.xlsx).');
}

/* Download cumulative workbook without adding new */
function downloadAllEstimates(){
  const arr = getStoredEstimates();
  if(arr.length === 0){ alert('No estimates saved yet. Use "Save & Export Excel" to save current estimate.'); return; }
  const aoa = buildAOAFromStored(arr);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, 'All Estimates');
  XLSX.writeFile(wb, 'estimates_all.xlsx');
}

/* --------- Print & WhatsApp (unchanged) --------- */
function printEstimate(){
  const custName = document.getElementById('custName').value;
  const total = document.getElementById('total').innerText;
  const adv = document.getElementById('advance').value;
  const out = document.getElementById('out').innerText;
  const delivery = document.getElementById('delivery').value;

  let printWindow = window.open('', '', 'width=800,height=900');
  printWindow.document.write(`<html><head><title>Estimate - ${custName}</title></head><body>`);
  printWindow.document.write(`<h2>MOHAMMADIPRINTING PRESS - KHAMBHAT</h2>`);
  printWindow.document.write(`<p><b>Customer:</b> ${custName}</p>`);
  printWindow.document.write(document.getElementById('itemsTable').outerHTML);
  printWindow.document.write(`<p><b>Total:</b> ₹${total}</p><p><b>Advance:</b> ₹${adv}</p><p><b>Outstanding:</b> ₹${out}</p><p><b>Delivery:</b> ${delivery}</p>`);
  printWindow.document.write(`<hr><p>મોહંમદી પ્રિન્ટીંગ પ્રેસ<br>ખંભાત - 388620<br>મો.9825547625</p>`);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}

function openWhatsApp(){
  const custName = document.getElementById('custName').value || '';
  const phone = document.getElementById('phone').value.trim();
  if(!phone){ alert('Enter phone with country code'); return; }

  let msg = "MOHAMMADIPRINTING PRESS - KHAMBHAT\n\nESTIMATE\n";
  msg += "Customer: " + custName + "\n\nParticulars:\n";
  const rows = document.querySelectorAll('#itemsTable tbody tr');
  rows.forEach(r=>{
    const part = r.querySelector('.part').value;
    const q = r.querySelector('.qty').value;
    const rate = r.querySelector('.rate').value;
    const amt = (parseFloat(q||0)*parseFloat(rate||0)).toFixed(2);
    msg += `${part}  Qty:${q}  Rate:₹${rate}  Amt:₹${amt}\n`;
  });
  const total = document.getElementById('total').innerText;
  const advance = document.getElementById('advance').value;
  const out = document.getElementById('out').innerText;
  const delivery = document.getElementById('delivery').value;
  msg += `\nTotal: ₹${total}\nAdvance: ₹${advance}\nOutstanding: ₹${out}\nDelivery: ${delivery}\n\nમોહંમદી પ્રિન્ટીંગ પ્રેસ\nમો.9825547625`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/* small helper */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
</script>
</body>
</html>
