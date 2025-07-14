import './style.css';
import Chart from 'chart.js/auto';

let balance = 0;
let transactions = [];
let savings = {};
let limits = {};
let notes = {};
let reminders = [];

const balanceEl = document.getElementById('balance');
const limitEl = document.getElementById('limitDisplay');
const savingsEl = document.getElementById('savingsDisplay');
const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const monthFilterEl = document.getElementById('month-filter');
const noteInput = document.getElementById('note');
const noteList = document.getElementById('notesList');
const reminderTextEl = document.getElementById('reminder-text');
const remindersEl = document.getElementById('reminders');
const chartCtx = document.getElementById('expenseChart').getContext('2d');
let currentChart;

function updateBalance() {
  balanceEl.textContent = `Баланс: ${balance.toFixed(2)} ₽`;
}

function updateLimitDisplay() {
  const date = monthFilterEl.value;
  const limit = limits[date];
  limitEl.textContent = limit ? `Лимит: ${limit} ₽` : 'Лимит: не установлен';
}

function updateSavingsDisplay() {
  const date = monthFilterEl.value;
  const saving = savings[date] || 0;
  savingsEl.textContent = saving ? `Накопления: ${saving} ₽` : '';
}

function updateMonthOptions() {
  const months = [...new Set(transactions.map(t => t.date))];
  monthFilterEl.innerHTML = '';
  months.forEach(m => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = m;
    monthFilterEl.appendChild(option);
  });
}

function renderTransactionList() {
  const txContainer = document.getElementById('transactions');
  txContainer.innerHTML = '';

  const selected = monthFilterEl.value;
  const filtered = transactions.filter(t => t.date === selected);

  filtered.forEach(tx => {
    const div = document.createElement('div');
    div.className = `transaction ${tx.isIncome ? 'income' : 'expense'}`;
    div.textContent = tx.isIncome
      ? `+${tx.amount.toFixed(2)} ₽`
      : `-${tx.amount.toFixed(2)} ₽ — ${tx.category}`;

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => {
      transactions = transactions.filter(t => t.id !== tx.id);
      balance += tx.isIncome ? -tx.amount : tx.amount;
      updateAll();
    };
    div.appendChild(delBtn);
    txContainer.appendChild(div);
  });
}

function renderReminders() {
  remindersEl.innerHTML = '';
  reminders.forEach((r, i) => {
    const li = document.createElement('li');
    li.textContent = r.text;
    if (r.done) {
      li.classList.add('reminder-done');
      li.textContent += ' (оплачено)';
    }

    const doneBtn = document.createElement('button');
    doneBtn.textContent = '✔';
    doneBtn.className = 'delete-btn';
    doneBtn.onclick = () => {
      reminders[i].done = true;
      renderReminders();
    };

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => {
      reminders.splice(i, 1);
      renderReminders();
    };

    if (!r.done) li.appendChild(doneBtn);
    li.appendChild(delBtn);
    remindersEl.appendChild(li);
  });
}

function renderNotes() {
  noteList.innerHTML = '';
  const date = monthFilterEl.value;
  if (!notes[date]) return;

  notes[date].forEach((note, i) => {
    const li = document.createElement('li');
    li.textContent = note;
    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'delete-btn';
    delBtn.onclick = () => {
      notes[date].splice(i, 1);
      renderNotes();
    };
    li.appendChild(delBtn);
    noteList.appendChild(li);
  });
}

function updateChart() {
  if (currentChart) currentChart.destroy();

  const selected = monthFilterEl.value;
  const filtered = transactions.filter(t => t.date === selected && !t.isIncome);

  const categorySums = {};
  filtered.forEach(t => {
    categorySums[t.category] = (categorySums[t.category] || 0) + t.amount;
  });

  const data = {
    labels: Object.keys(categorySums),
    datasets: [{
      data: Object.values(categorySums),
      backgroundColor: ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#795548', '#607d8b', '#e91e63']
    }]
  };

  currentChart = new Chart(chartCtx, {
    type: 'pie',
    data,
    options: {
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 12 },
            padding: 10
          }
        }
      }
    }
  });
}

function updateAll() {
  updateBalance();
  updateLimitDisplay();
  updateSavingsDisplay();
  updateMonthOptions();
  renderTransactionList();
  renderReminders();
  renderNotes();
  updateChart();
}

document.getElementById('add-expense').onclick = () => {
  const amount = parseFloat(amountEl.value);
  const category = categoryEl.value;
  const date = dateEl.value;
  if (!amount || !category || !date) return;

  const id = Date.now() + Math.random();
  transactions.push({ id, amount, category, date, isIncome: false });
  balance -= amount;

  if (limits[date] && filteredSum(date) > limits[date]) {
    alert('Лимит превышен!');
  }

  updateAll();
};

document.getElementById('add-income').onclick = () => {
  const amount = parseFloat(amountEl.value);
  const date = dateEl.value;
  if (!amount || !date) return;

  const id = Date.now() + Math.random();
  transactions.push({ id, amount, date, isIncome: true });
  balance += amount;
  updateAll();
};

document.getElementById('set-saving').onclick = () => {
  const amount = parseFloat(document.getElementById('saving-amount').value);
  const date = dateEl.value;
  if (!amount || !date) return;

  savings[date] = (savings[date] || 0) + amount;
  balance -= amount;
  updateAll();
};

document.getElementById('clear-saving').onclick = () => {
  const date = dateEl.value;
  balance += savings[date] || 0;
  delete savings[date];
  updateAll();
};

document.getElementById('set-limit').onclick = () => {
  const limit = parseFloat(document.getElementById('monthly-limit').value);
  const date = dateEl.value;
  if (!limit || !date) return;
  limits[date] = limit;
  updateAll();
};

document.getElementById('save-note').onclick = () => {
  const text = noteInput.value;
  const date = dateEl.value;
  if (!text || !date) return;
  if (!notes[date]) notes[date] = [];
  notes[date].push(text);
  updateAll();
};

document.getElementById('add-reminder').onclick = () => {
  const text = reminderTextEl.value;
  if (!text) return;
  reminders.push({ text, done: false });
  renderReminders();
};

monthFilterEl.onchange = () => {
  renderTransactionList();
  renderNotes();
  updateChart();
  updateLimitDisplay();
  updateSavingsDisplay();
};

function filteredSum(date) {
  return transactions
    .filter(t => t.date === date && !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
}

// Export / Import
document.getElementById('export-json').onclick = () => {
  const data = {
    balance,
    transactions,
    savings,
    limits,
    notes,
    reminders
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'finance-data.json';
  a.click();
};

document.getElementById('import-json').onclick = () => {
  document.getElementById('import-file').click();
};

document.getElementById('import-file').onchange = (e) => {
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
      updateAll();
    } catch (e) {
      alert('Ошибка при загрузке файла!');
    }
  };
  reader.readAsText(file);
};

updateAll();
