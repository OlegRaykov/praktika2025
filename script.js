let balance = 0;

function updateBalance() {
  document.getElementById('balance').textContent = balance.toFixed(2);
}

function addTransaction(isIncome) {
  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');

  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (isNaN(amount) || amount <= 0) {
    alert('Введите корректную сумму.');
    return;
  }

  const transactionList = document.getElementById('transaction-list');
  const transactionItem = document.createElement('div');
  transactionItem.className = 'transaction ' + (isIncome ? 'income' : 'expense');

  if (isIncome) {
    transactionItem.textContent = `+${amount.toFixed(2)} ₽`;
  } else {
    transactionItem.textContent = `-${amount.toFixed(2)} ₽ — ${category}`;
  }

  transactionList.prepend(transactionItem);

  balance += isIncome ? amount : -amount;
  updateBalance();


  amountInput.value = '';
}

updateBalance();
