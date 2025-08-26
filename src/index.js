const Transaction = require("../models/Transaction");

document.getElementById("transactionForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(e.target));
  formData.date = new Date(formData.date);

  try {
    const tx = new Transaction(formData);
    await tx.save();
    alert("✅ Transaction saved");
    loadTransactions();
  } catch (err) {
    alert("❌ Error saving transaction: " + err.message);
  }
});

async function loadTransactions() {
  try {
    const transactions = await Transaction.find();
    const tbody = document.querySelector("#transactionsTable tbody");
    tbody.innerHTML = "";
    transactions.forEach(tx => {
      const row = `<tr>
        <td>${tx.srNo}</td>
        <td>${new Date(tx.date).toLocaleDateString()}</td>
        <td>${tx.farmerName}</td>
        <td>${tx.purchaserName}</td>
        <td>${tx.totalAmount}</td>
        <td>${tx.netAmount}</td>
      </tr>`;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error(err);
  }
}

loadTransactions();
