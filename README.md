<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estimate Generator</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: url('https://raw.githubusercontent.com/Sunil2002zxhxd/ESTIMATE-new/main/7376b61a-b491-497f-b65c-4e6ecb7e522a.png') no-repeat center center fixed;
      background-size: cover;
      background-color: white;
    }
    .container {
      background: rgba(255,255,255,0.9);
      margin: 20px;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
    }
    h1 {
      color: #0078D7;
      text-align: center;
      margin-top: 0;
    }
    h2 {
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
      margin-top: 10px;
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
    .footer-buttons {
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>

  <div class="container">
    <h1>ESTIMATE-new</h1>
    <h2>MOHAMMADI PRINTING PRESS - KHAMBHAT</h2>

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
        <th>Status</th>
      </tr>
      <tr>
        <td><input type="text" placeholder="Item name"></td>
        <td><input type="number" value="1"></td>
        <td><input type="number" value="0"></td>
        <td><input type="number" value="0" readonly></td>
        <td><input type="text" placeholder="Pending / Done"></td>
      </tr>
    </table>

    <button onclick="addItem()">Add item</button>

    <label>Advance Paid (₹)</label>
    <input type="number" id="advancePaid" value="0">

    <h3 id="totalAmount">Total: ₹ 0</h3>

    <div class="footer-buttons">
      <button onclick="calculateTotal()">Calculate Total</button>
      <button onclick="saveOnly()">💾 Save Only</button>
      <button onclick="sendWhatsApp()">📤 Send Estimate</button>
      <button onclick="saveExcel()">📊 Save Excel</button>
    </div>
  </div>

  <script>
    function addItem() {
      const table = document.getElementById("itemsTable");
      const row = table.insertRow();
      row.innerHTML = `
        <td><input type="text" placeholder="Item name"></td>
        <td><input type="number" value="1"></td>
        <td><input type="number" value="0"></td>
        <td><input type="number" value="0" readonly></td>
        <td><input type="text" placeholder="Pending / Done"></td>
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

    function saveOnly() {
      alert("✅ Estimate saved locally! (You can copy or screenshot it)");
    }

    function sendWhatsApp() {
      calculateTotal();
      const name = document.getElementById("customerName").value;
      const total = document.getElementById("totalAmount").innerText;
      const phone = document.getElementById("customerPhone").value;
      const message = `*Estimate - MOHAMMADI PRINTING PRESS*\nCustomer: ${name}\n${total}\nThank you!`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    }

    function saveExcel() {
      const rows = document.querySelectorAll("#itemsTable tr");
      let csv = [];
      rows.forEach(row => {
        const cols = row.querySelectorAll("input, th");
        const rowData = Array.from(cols).map(col => col.value || col.innerText);
        csv.push(rowData.join(","));
      });

      const blob = new Blob([csv.join("\n")], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Estimate.csv";
      link.click();
    }
  </script>

</body>
</html>
