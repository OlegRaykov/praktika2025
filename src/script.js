import './style.css';
import Chart from 'chart.js/auto';

let balance = 0;
let transactions = [];
let savings = {};
let limits = {};
let notes = {};
let reminders = [];

const balanceEl = document.getElementById('balance');
const transactionsEl = document.getElementById('transactions');
const chartCtx = document.getElementById('expenseChart').getContext('2d');
const monthFilterEl = document.getElementById('month-filter');
let currentChart;

function updateBalance() {
  balanceEl.textContent = `Баланс: ${balance.toFixed(2)} ₽`;
}

function renderTransactionList() {
  transactionsEl.innerHTML = '';
  const selectedMonth = monthFilterEl.value;

  transactions
    .filter(tx => !selectedMonth || tx.date === selectedMonth)
    .forEach(tx => {
      const div = document.createElement('div');
      div.className = `transaction ${tx.isIncome ? 'income' : 'expense'}`;
      let text = `${tx.amount.toFixed(2)} ₽`;
      if (tx.isIncome) {
        text = `+${text}`;
      } else {
        text = `-${text} ₽ — ${tx.category}`;
      }
      text += ` (${tx.date})`;
      div.textContent = text;
      transactionsEl.appendChild(div);
    });
}

function updateMonthFilter() {
  const months = [...new Set(transactions.map(tx => tx.date))];
  monthFilterEl.innerHTML = '<option value="">Все месяцы</option>';
  months.forEach(m => {
    const option = document.createElement('option');
    const [year, month] = m.split('-');
    const monthName = new Date(`${m}-01`).toLocaleString('ru-RU', { month: 'long' });
    option.value = m;
    option.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    monthFilterEl.appendChild(option);
  });
}

function renderExpenseChart() {
  if (currentChart) currentChart.destroy();
  const selectedMonth = monthFilterEl.value;
  const monthlyExpenses = transactions.filter(tx => !tx.isIncome && (!selectedMonth || tx.date === selectedMonth));

  const categorySums = {};
  monthlyExpenses.forEach(tx => {
    if (!categorySums[tx.category]) categorySums[tx.category] = 0;
    categorySums[tx.category] += tx.amount;
  });

  const data = {
    labels: Object.keys(categorySums),
    datasets: [{
      label: 'Расходы',
      data: Object.values(categorySums),
      backgroundColor: ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#795548', '#607d8b', '#e91e63']
    }]
  };

  currentChart = new Chart(chartCtx, {
    type: 'pie',
    data
  });
}

function checkLimit(date) {
  const monthLimit = limits[date];
  if (!monthLimit) return;
  const total = transactions.filter(tx => !tx.isIncome && tx.date === date).reduce((sum, tx) => sum + tx.amount, 0);
  if (total > monthLimit) {
    alert(`Превышен лимит расходов на ${date}! Потрачено: ${total}, лимит: ${monthLimit}`);
  }
}

function checkSavings(date) {
  const target = savings[date];
  if (!target) return;
  const incomeSum = transactions.filter(tx => tx.isIncome && tx.date === date).reduce((sum, tx) => sum + tx.amount, 0);
  const expenseSum = transactions.filter(tx => !tx.isIncome && tx.date === date).reduce((sum, tx) => sum + tx.amount, 0);
  const leftover = incomeSum - expenseSum;
  if (leftover >= target) {
    alert(`Вы можете отложить ${target} ₽, как планировали на ${date}`);
  }
}

document.getElementById('add-expense').onclick = () => {
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  if (!amount || !category || !date) return alert('Заполните все поля!');
  transactions.push({ amount, category, date, isIncome: false });
  balance -= amount;
  updateBalance();
  updateMonthFilter();
  renderTransactionList();
  renderExpenseChart();
  checkLimit(date);
};

document.getElementById('add-income').onclick = () => {
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;
  if (!amount || !date) return alert('Укажите сумму и дату!');
  transactions.push({ amount, date, isIncome: true });
  balance += amount;
  updateBalance();
  updateMonthFilter();
  renderTransactionList();
  renderExpenseChart();
  checkSavings(date);
};

document.getElementById('set-saving').onclick = () => {
  const amount = parseFloat(document.getElementById('saving-amount').value);
  const date = document.getElementById('date').value;
  if (!amount || !date) return alert('Введите сумму и дату!');
  savings[date] = amount;
  alert(`Запланировано отложить ${amount} ₽ в ${date}`);
};

document.getElementById('set-limit').onclick = () => {
  const amount = parseFloat(document.getElementById('monthly-limit').value);
  const date = document.getElementById('date').value;
  if (!amount || !date) return alert('Введите лимит и дату!');
  limits[date] = amount;
  alert(`Установлен лимит ${amount} ₽ на ${date}`);
};

document.getElementById('save-note').onclick = () => {
  const text = document.getElementById('note').value;
  const date = document.getElementById('date').value;
  if (!text || !date) return alert('Введите дату и текст!');
  notes[date] = text;
  alert('Заметка сохранена!');
};

document.getElementById('add-reminder').onclick = () => {
  const text = document.getElementById('reminder-text').value;
  if (!text) return;
  reminders.push({ text, done: false });
  renderReminders();
};

function renderReminders() {
  const ul = document.getElementById('reminders');
  ul.innerHTML = '';
  reminders.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = r.done ? 'reminder-done' : '';
    li.textContent = r.text + (r.done ? ' (оплачено)' : '');
    const doneBtn = document.createElement('button');
    doneBtn.textContent = 'Готово';
    doneBtn.onclick = () => {
      reminders[i].done = true;
      renderReminders();
    };
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Удалить';
    delBtn.onclick = () => {
      reminders.splice(i, 1);
      renderReminders();
    };
    li.appendChild(doneBtn);
    li.appendChild(delBtn);
    ul.appendChild(li);
  });
}

document.getElementById('export-json').onclick = () => {
  const data = {
    balance,
    transactions,
    savings,
    limits,
    notes,
    reminders
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finance-data.json';
  a.click();
  URL.revokeObjectURL(url);
};

document.getElementById('import-json').onclick = () => {
  document.getElementById('import-file').click();
};

document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      balance = data.balance || 0;
      transactions = data.transactions || [];
      savings = data.savings || {};
      limits = data.limits || {};
      notes = data.notes || {};
      reminders = data.reminders || [];
      updateBalance();
      updateMonthFilter();
      renderTransactionList();
      renderExpenseChart();
      renderReminders();
    } catch (e) {
      alert('Ошибка чтения файла');
    }
  };
  reader.readAsText(file);
});

monthFilterEl.addEventListener('change', () => {
  renderTransactionList();
  renderExpenseChart();
});
