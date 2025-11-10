<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate Generator</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: white;
    }
    h1 {
      color: #0078D7;
      text-align: center;
    }
    label {
      display: block;
      margin-top: 10px;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 8px;
      margin-top: 5px;
      box-sizing: border-box;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
    }
    button {
      margin-top: 15px;
      padding: 10px 20px;
      background-color: #0078D7;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background-color: #005fa3;
    }
  </style>
</head>
<body>

  <!-- 🌈 LOGO SECTION -->
  <div style="text-align:center; margin-bottom:15px;">
    <img src="https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png" 
         alt="Logo" 
         style="width:180px; height:auto;">
  </div>

  <h1>ESTIMATE-new</h1>
  <hr>

  <h2 style="text-align:center;">MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>

  <label>Estimate Number</label>
  <input type="number" id="estimateNumber" value="1">

  <label>Customer Name</label>
  <input type="text" id="customerName" placeholder="Customer name">

  <label>Phone (with country code, e.g. 919825547625)</label>
  <input type="number" id="customerPhone" placeholder="91xxxxxxxxxx">

  <label>Delivery / Process Days</label>
  <input type="text" id="processDays" placeholder="2/3">

  <h3>Items</h3>
  <table id="itemsTable">
    <tr>
      <th>Particulars</th>
      <th>Quantity</th>
      <th>Rate (₹)</th>
      <th>Total (₹)</th>
    </tr>
    <tr>
      <td><input type="text" placeholder="Item name"></td>
      <td><input type="number" value="1"></td>
      <td><input type="number" value="0"></td>
      <td><input type="number" value="0" readonly></td>
    </tr>
  </table>

  <button onclick="addItem()">Add item</button>

  <label>Advance Paid (₹)</label>
  <input type="number" id="advancePaid" value="0">

  <h3 id="totalAmount">Total: ₹ 0</h3>

  <button onclick="calculateTotal()">Calculate Total</button>
  <button onclick="printEstimate()">Print Estimate</button>

  <script>
    function addItem() {
      const table = document.getElementById("itemsTable");
      const row = table.insertRow();
      row.innerHTML = `
        <td><input type="text" placeholder="Item name"></td>
        <td><input type="number" value="1"></td>
        <td><input type="number" value="0"></td>
        <td><input type="number" value="0" readonly></td>
      `;
    }

    function calculateTotal() {
      const rows = document.querySelectorAll("#itemsTable tr:not(:first-child)");
      let total = 0;
      rows.forEach(row => {
        const qty = row.cells[1].querySelector("input").valueAsNumber || 0;
        const rate = row.cells[2].querySelector("input").valueAsNumber || 0;
        const sum = qty * rate;
        row.cells[3].querySelector("input").value = sum;
        total += sum;
      });
      document.getElementById("totalAmount").innerText = "Total: ₹ " + total;
    }

    function printEstimate() {
      calculateTotal();
      const logoUrl = "https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png";
      const estNo = document.getElementById("estimateNumber").value;
      const name = document.getElementById("customerName").value;
      const phone = document.getElementById("customerPhone").value;
      const days = document.getElementById("processDays").value;
      const advance = document.getElementById("advancePaid").value;
      const total = document.getElementById("totalAmount").innerText;

      let itemsHTML = "<table border='1' cellspacing='0' cellpadding='5'><tr><th>Particulars</th><th>Qty</th><th>Rate</th><th>Total</th></tr>";
      const rows = document.querySelectorAll("#itemsTable tr:not(:first-child)");
      rows.forEach(row => {
        const part = row.cells[0].querySelector("input").value;
        const qty = row.cells[1].querySelector("input").value;
        const rate = row.cells[2].querySelector("input").value;
        const total = row.cells[3].querySelector("input").value;
        itemsHTML += `<tr><td>${part}</td><td>${qty}</td><td>${rate}</td><td>${total}</td></tr>`;
      });
      itemsHTML += "</table>";

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
        <head>
          <title>Estimate Print</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            h1 { text-align:center; color:#0078D7; }
            h2 { text-align:center; }
            table { width:100%; border-collapse: collapse; margin-top:10px; }
            th, td { border:1px solid #ccc; padding:8px; text-align:left; }
            th { background:#f2f2f2; }
          </style>
        </head>
        <body>
          <div style="text-align:center;">
            <img src="${logoUrl}" style="width:140px; margin-bottom:10px;">
          </div>
          <h1>MOHAMMADI PRINTING PRESS - KHAMBHAT</h1>
          <p><b>Estimate No:</b> ${estNo}<br>
             <b>Name:</b> ${name}<br>
             <b>Phone:</b> ${phone}<br>
             <b>Delivery/Process Days:</b> ${days}</p>
          ${itemsHTML}
          <h3>${total}</h3>
          <p><b>Advance Paid:</b> ₹${advance}</p>
          <h3>Thank you for your business!</h3>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  </script>

</body>
</html>
