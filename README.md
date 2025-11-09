<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Estimate Generator - Mohammad Printing Press</title>
<style>
  body { font-family: Arial; margin: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
  input { width: 100%; padding: 5px; }
  button { padding: 8px 12px; margin: 5px; cursor: pointer; border-radius: 6px; border: none; background: #007bff; color: white; }
  button:hover { background: #0056b3; }
</style>
</head>
<body>

<h2>🧾 MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>

<label>Customer Name:</label>
<input type="text" id="custName" placeholder="Enter customer name"><br><br>

<label>WhatsApp Number (with country code):</label>
<input type="text" id="phone" placeholder="91xxxxxxxxxx"><br><br>

<table id="itemsTable">
  <thead>
    <tr>
      <th>Particulars</th>
      <th>Qty</th>
      <th>Rate</th>
      <th>Amount</th>
      <th>Remove</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><input type="text" class="part" placeholder="Item name"></td>
      <td><input type="number" class="qty" value="1" onchange="calcTotal()"></td>
      <td><input type="number" class="rate" value="0" onchange="calcTotal()"></td>
      <td class="amt">0</td>
      <td><button style="background:red" onclick="removeRow(this)">❌</button></td>
    </tr>
  </tbody>
</table>

<button onclick="addRow()">➕ Add Item</button>

<h3>Total: ₹<span id="total">0</span></h3>

<label>Advance:</label>
<input type="number" id="advance" value="0" onchange="calcTotal()"><br><br>

<label>Delivery Days:</label>
<input type="text" id="delivery" value="1"><br><br>

<h3>Outstanding: ₹<span id="out">0</span></h3>

<hr>

<button onclick="openWhatsApp()">📩 Send to WhatsApp</button>
<button onclick="printEstimate()">🖨️ Print</button>
<button onclick="savePDF()">📄 Save PDF</button>
<button onclick="saveExcel()">💾 Save to Excel</button>

<hr>
<footer>🏭 મોહંમદી પ્રિન્ટીંગ પ્રેસ | 📍 ખંભાત - 388620 | 📞 98255 47625</footer>

<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<script>
function addRow(){
  const tbody = document.querySelector('#itemsTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="part" placeholder="Item name"></td>
    <td><input type="number" class="qty" value="1" onchange="calcTotal()"></td>
    <td><input type="number" class="rate" value="0" onchange="calcTotal()"></td>
    <td class="amt">0</td>
    <td><button style='background:red' onclick='removeRow(this)'>❌</button></td>
  `;
  tbody.appendChild(tr);
}

function removeRow(btn){
  btn.closest('tr').remove();
  calcTotal();
}

function calcTotal(){
  let total = 0;
  document.querySelectorAll('#itemsTable tbody tr').forEach(row=>{
    const qty = parseFloat(row.querySelector('.qty').value) || 0;
    const rate = parseFloat(row.querySelector('.rate').value) || 0;
    const amt = qty * rate;
    row.querySelector('.amt').textContent = amt.toFixed(2);
    total += amt;
  });
  document.getElementById('total').textContent = total.toFixed(2);

  const adv = parseFloat(document.getElementById('advance').value) || 0;
  document.getElementById('out').textContent = (total - adv).toFixed(2);
}

function openWhatsApp(){
  const custName = document.getElementById('custName').value || '';
  const phone = document.getElementById('phone').value.trim();
  if(!phone){ alert('Enter phone number with country code'); return; }

  let msg = "🧾 *MOHAMMADI PRINTING PRESS - KHAMBHAT*\n\n";
  msg += "*ESTIMATE*\n";
  msg += "👤 Customer: *" + custName + "*\n\n";
  msg += "📦 *Particulars:*\n";

  const rows = document.querySelectorAll('#itemsTable tbody tr');
  rows.forEach((r, i) => {
    const part = r.querySelector('.part').value || '';
    const q = r.querySelector('.qty').value || '0';
    const rate = r.querySelector('.rate').value || '0';
    const amt = r.querySelector('.amt').textContent;
    msg += `${i+1}. ${part}\n   Qty: ${q}\n   Rate: ₹${rate}\n   Amt: ₹${amt}\n\n`;
  });

  const total = document.getElementById('total').innerText;
  const advance = document.getElementById('advance').value;
  const out = document.getElementById('out').innerText;
  const delivery = document.getElementById('delivery').value;

  msg += `💰 *Total:* ₹${total}\n`;
  msg += `💵 *Advance:* ₹${advance}\n`;
  msg += `📉 *Outstanding:* ₹${out}\n`;
  msg += `🚚 *Delivery:* ${delivery} Days\n\n`;
  msg += "🏭 મોહંમદી પ્રિન્ટીંગ પ્રેસ\n📍 ખંભાત - 388620\n📞 98255 47625";

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function printEstimate(){
  window.print();
}

function savePDF(){
  const element = document.body;
  html2pdf().from(element).save("Estimate.pdf");
}

function saveExcel(){
  const rows = [["Particulars", "Qty", "Rate", "Amount"]];
  document.querySelectorAll('#itemsTable tbody tr').forEach(row=>{
    const part = row.querySelector('.part').value;
    const qty = row.querySelector('.qty').value;
    const rate = row.querySelector('.rate').value;
    const amt = row.querySelector('.amt').textContent;
    rows.push([part, qty, rate, amt]);
  });
  rows.push(["Total", "", "", document.getElementById('total').innerText]);
  rows.push(["Advance", "", "", document.getElementById('advance').value]);
  rows.push(["Outstanding", "", "", document.getElementById('out').innerText]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estimate");
  XLSX.writeFile(wb, "Estimate.xlsx");
}
</script>
</body>
</html>
