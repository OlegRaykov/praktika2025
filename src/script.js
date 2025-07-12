import './style.css';
import Chart from 'chart.js/auto';

let balance = 0;
let transactions = [];
let expenseChart;

function updateBalance() {
  document.getElementById('balance').textContent = `Баланс: ${balance.toFixed(2)} ₽`;
}

function renderTransactionList() {
  const list = document.getElementById('transactions');
  list.innerHTML = '';
  transactions.forEach(tx => {
    const div = document.createElement('div');
    div.className = 'transaction ' + (tx.isIncome ? 'income' : 'expense');
    let text = `${tx.amount.toFixed(2)} ₽`;
if (tx.isIncome) {
  text = `+${text}`;
} else {
  text = `-${text} - ${tx.category}`;
}
div.textContent = text;

    list.prepend(div);
  });
}

function renderExpenseChart() {
  const data = {};
  transactions.forEach(tx => {
    if (!tx.isIncome) {
      data[tx.category] = (data[tx.category] || 0) + tx.amount;
    }
  });

  const ctx = document.getElementById('expenseChart').getContext('2d');

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [
          '#ff6384', '#36a2eb', '#ffcd56',
          '#4bc0c0', '#9966ff', '#ff9f40',
          '#c9cbcf', '#6f42c1'
        ]
      }]
    }
  });
}

function addIncome() {
  const amountInput = document.getElementById('amount');
  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0) {
    alert('Введите корректную сумму.');
    return;
  }

  transactions.push({ isIncome: true, amount });
  balance += amount;
  amountInput.value = '';
  updateBalance();
  renderTransactionList();
}

function addExpense() {
  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');

  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (isNaN(amount) || amount <= 0 || !category) {
    alert('Введите сумму и выберите категорию.');
    return;
  }

  transactions.push({ isIncome: false, amount, category });
  balance -= amount;
  amountInput.value = '';
  categorySelect.value = '';
  updateBalance();
  renderTransactionList();
  renderExpenseChart();
}

document.getElementById('add-income').addEventListener('click', addIncome);
document.getElementById('add-expense').addEventListener('click', addExpense);

updateBalance();

function saveToJSON() {
  const dataStr = JSON.stringify({ balance, transactions }, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "finance-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function loadFromJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      balance = data.balance || 0;
      transactions = data.transactions || [];
      updateBalance();
      renderTransactionList();
      renderExpenseChart();
    } catch (e) {
      alert("Ошибка чтения файла!");
    }
  };
  reader.readAsText(file);
}

document.getElementById('export-json').addEventListener('click', saveToJSON);
document.getElementById('import-json').addEventListener('click', () => {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadFromJSON(file);
});
