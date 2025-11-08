# ESTIMATE-new
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Estimate → WhatsApp — Mohammadi Printing (PDF + Images)</title>
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
    <button onclick="openWhatsApp()">Open WhatsApp (prefilled message)</button>
  </div>

  <p><small>નોટ: બધા ફાઇલો આપોઆપ WhatsApp પર attach થતી નથી — તમે PDF અથવા images ડાઉનલોડ કરીને WhatsApp Web માં Attach કરશો. વધુ advance auto-send માટે WhatsApp Business API જોઈએ.</small></p>

<script>
/* Helper: add / recalc rows */
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

/* initial rows */
addRow('1 BOOK', 150, 5);
addRow('Extra cover', 50, 2);

/* Image preview & store */
let imageFiles = [];
document.getElementById('images').addEventListener('change', (e) => {
  imageFiles = Array.from(e.target.files);
  const thumbs = document.getElementById('thumbs');
  thumbs.innerHTML = '';
  imageFiles.forEach((f, idx) => {
    const url = URL.createObjectURL(f);
    const img = document.createElement('img');
    img.src = url;
    img.title = f.name;
    thumbs.appendChild(img);
  });
});

/* Generate PDF using jsPDF and html2canvas for nicer layout */
async function generatePdf(){
  // Build content text
  const custName = document.getElementById('custName').value || '';
  const delivery = document.getElementById('delivery').value || '';
  const total = document.getElementById('total').innerText || '0';
  const advance = document.getElementById('advance').value || '0';
  const out = document.getElementById('out').innerText || '0';

  // create a simple HTML layout to render to canvas (better typography)
  const wrapper = document.createElement('div');
  wrapper.style.width = '800px';
  wrapper.style.padding = '20px';
  wrapper.style.background = '#fff';
  wrapper.style.color = '#000';
  wrapper.innerHTML = `
    <h1 style="margin:0 0 8px 0">MOHAMMADIPRINTING PRESS - KHAMBHAT</h1>
    <p style="margin:0 0 8px 0"><strong>ESTIMATE</strong></p>
    <p style="margin:0 0 8px 0">Customer: ${escapeHtml(custName)}</p>
    <table style="width:100%; border-collapse:collapse; margin-top:8px;">
      <thead>
        <tr>
          <th style="border:1px solid #ccc; padding:6px">Particulars</th>
          <th style="border:1px solid #ccc; padding:6px">Qty</th>
          <th style="border:1px solid #ccc; padding:6px">Rate</th>
          <th style="border:1px solid #ccc; padding:6px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${[...document.querySelectorAll('#itemsTable tbody tr')].map(r=>{
          const part = escapeHtml(r.querySelector('.part').value||'');
          const q = r.querySelector('.qty').value||'0';
          const rate = r.querySelector('.rate').value||'0';
          const amt = (parseFloat(q||0)*parseFloat(rate||0)).toFixed(2);
          return `<tr>
            <td style="border:1px solid #ccc; padding:6px">${part}</td>
            <td style="border:1px solid #ccc; padding:6px">${q}</td>
            <td style="border:1px solid #ccc; padding:6px">₹${rate}</td>
            <td style="border:1px solid #ccc; padding:6px">₹${amt}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <p style="margin-top:8px;"><strong>Total: ₹${total}</strong></p>
    <p>Advance Paid: ₹${advance}</p>
    <p>Outstanding: ₹${out}</p>
    <p>Delivery Time: ${escapeHtml(delivery)}</p>
    <hr>
    <p>મોહંમદી પ્રિન્ટીંગ પ્રેસ<br>ડાઃ સકીનાબેનના દવાખાના પાસે, વ્હોરવાડ, ખંભાત-388620<br>મો.9825547625</p>
  `;

  document.body.appendChild(wrapper); // temporarily add to DOM for accurate rendering
  // Render to canvas
  const canvas = await html2canvas(wrapper, {scale: 2});
  document.body.removeChild(wrapper);

  // create pdf (A4 portrait)
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'px', format: 'a4' });
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // compute dimensions to fit A4 width
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgProps = { width: canvas.width, height: canvas.height };
  const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
  const imgW = imgProps.width * ratio;
  const imgH = imgProps.height * ratio;

  pdf.addImage(imgData, 'JPEG', (pdfWidth - imgW)/2, 20, imgW, imgH);

  // If there are images uploaded, append each on its own page
  for (let i=0; i<imageFiles.length; i++){
    const file = imageFiles[i];
    const dataUrl = await fileToDataURL(file);
    // scale to page
    pdf.addPage();
    // compute image fit
    let iw = pdf.internal.pageSize.getWidth() - 40;
    let ih = pdf.internal.pageSize.getHeight() - 80;
    // we need actual image size to keep ratio
    const img = await loadImage(dataUrl);
    const ar = img.width / img.height;
    let drawW = iw, drawH = iw / ar;
    if (drawH > ih) { drawH = ih; drawW = ih * ar; }
    pdf.addImage(dataUrl, 'JPEG', (pdf.internal.pageSize.getWidth()-drawW)/2, 40, drawW, drawH);
    pdf.setFontSize(10);
    pdf.text(file.name, 20, pdf.internal.pageSize.getHeight()-20);
  }

  pdf.save('estimate.pdf');
}

/* Convert File -> dataURL */
function fileToDataURL(file){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}
function loadImage(src){
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/* Download images as ZIP for easy attach in WhatsApp Web */
async function downloadImagesZip(){
  if(imageFiles.length === 0){ alert('No images selected'); return; }
  const zip = new JSZip();
  for (let f of imageFiles){
    const data = await f.arrayBuffer();
    zip.file(f.name, data);
  }
  const blob = await zip.generateAsync({type:'blob'});
  saveAs(blob, 'images.zip');
}

/* Build message and open WhatsApp */
function openWhatsApp(){
  const custName = document.getElementById('custName').value || '';
  const phone = document.getElementById('phone').value.trim();
  if(!phone){ alert('Enter phone with country code (e.g. 91xxxxxxxxxx)'); return; }

  let msg = "MOHAMMADIPRINTING PRESS - KHAMBHAT\n\nESTIMATE\n";
  msg += "Customer: " + custName + "\n\nParticulars:\n";
  const rows = document.querySelectorAll('#itemsTable tbody tr');
  rows.forEach(r=>{
    const part = r.querySelector('.part').value;
    const q = r.querySelector('.qty').value;
    const rate = r.querySelector('.rate').value;
    const amt = (parseFloat(q||0)*parseFloat(rate||0)).toFixed(2);
    msg += `${part}  Qty: ${q}  Rate: ₹${rate}  Amt: ₹${amt}\n`;
  });
  const total = document.getElementById('total').innerText;
  const advance = document.getElementById('advance').value || '0';
  const out = document.getElementById('out').innerText;
  const delivery = document.getElementById('delivery').value || '';
  msg += `\nTotal: ₹${total}\nAdvance Paid: ₹${advance}\nOutstanding: ₹${out}\n\nDelivery Time: ${delivery}\n\nમોહંમદી પ્રિન્ટીંગ પ્રેસ\nડાઃ સકીનાબેનના દવાખાના પાસે, વ્હોરવાડ, ખંભાત-388620\nમો.9825547625`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');

  // Helpful hint for user:
  setTimeout(()=> {
    alert('Prefilled message opened in WhatsApp. To send files (PDF/images), first click "Generate & Download PDF" or "Download Images (ZIP)". Then in WhatsApp Web, use Attach (paperclip) → Document or Photos to attach and send.');
  }, 300);
}

/* small helper */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }
</script>
</body>
</html>
