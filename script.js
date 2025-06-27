const accounts = [
  { id: 1, name: "Mpesa_KES_1", currency: "KES", balance: 150000 },
  { id: 2, name: "Bank_KES_2", currency: "KES", balance: 100000 },
  { id: 3, name: "Wallet_KES_3", currency: "KES", balance: 90000 },
  { id: 4, name: "Bank_USD_1", currency: "USD", balance: 2000 },
  { id: 5, name: "Mpesa_USD_2", currency: "USD", balance: 1800 },
  { id: 6, name: "Wallet_USD_3", currency: "USD", balance: 2200 },
  { id: 7, name: "Bank_NGN_1", currency: "NGN", balance: 500000 },
  { id: 8, name: "Wallet_NGN_2", currency: "NGN", balance: 400000 },
  { id: 9, name: "Mpesa_NGN_3", currency: "NGN", balance: 450000 },
  { id: 10, name: "Reserve_NGN_4", currency: "NGN", balance: 600000 }
];

const fxRates = {
  "USD-KES": 129,
  "KES-USD": 1 / 129,
  "USD-NGN": 1549,
  "NGN-USD": 1 / 1549,
  "KES-NGN": 11,
  "NGN-KES": 1 / 11
};

const accountsList = document.getElementById("accountsList");
const fromSelect = document.getElementById("fromAccount");
const toSelect = document.getElementById("toAccount");
const filterAccount = document.getElementById("filterAccount");
const filterCurrency = document.getElementById("filterCurrency");
const filterMessage = document.getElementById("filterMessage");
const formMessage = document.getElementById("formMessage");
const transferForm = document.getElementById("transferForm");
const logTableBody = document.querySelector("#logTable tbody");
let transactions = [];

const formatCurrency = (currency, amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);

const renderAccounts = () => {
  accountsList.innerHTML = "";
  accounts.forEach(account => {
    const card = document.createElement("div");
    card.innerHTML = `
      <strong>${account.name}</strong><br>
      Currency: ${account.currency}<br>
      Balance: ${formatCurrency(account.currency, account.balance)}
    `;
    accountsList.appendChild(card);
  });
};

const populateDropdowns = () => {
  [fromSelect, toSelect, filterAccount].forEach(dropdown => {
    dropdown.innerHTML = '<option value="">Select Account</option>';
    accounts.forEach(acc => {
      const option = document.createElement("option");
      option.value = acc.id;
      option.textContent = `${acc.name} (${acc.currency})`;
      dropdown.appendChild(option);
    });
  });

  const uniqueCurrencies = [...new Set(accounts.map(a => a.currency))];
  filterCurrency.innerHTML = '<option value="">All Currencies</option>';
  uniqueCurrencies.forEach(cur => {
    const option = document.createElement("option");
    option.value = cur;
    option.textContent = cur;
    filterCurrency.appendChild(option);
  });
};

const updateToFromDropdowns = () => {
  const fromId = parseInt(fromSelect.value);
  const toId = parseInt(toSelect.value);

  [...toSelect.options].forEach(opt => {
    opt.disabled = opt.value && parseInt(opt.value) === fromId;
  });

  [...fromSelect.options].forEach(opt => {
    opt.disabled = opt.value && parseInt(opt.value) === toId;
  });
};

fromSelect.addEventListener("change", updateToFromDropdowns);
toSelect.addEventListener("change", updateToFromDropdowns);

transferForm.addEventListener("submit", e => {
  e.preventDefault();
  formMessage.textContent = ""; // Clear previous message

  const fromId = parseInt(fromSelect.value);
  const toId = parseInt(toSelect.value);
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value.trim();
  const futureDate = document.getElementById("futureDate").value;

  if (!fromId || !toId || isNaN(amount) || amount <= 0) {
    formMessage.textContent = "Please fill all fields correctly.";
    return;
  }

  if (fromId === toId) {
    formMessage.textContent = "From and To accounts must be different.";
    return;
  }

  const fromAcc = accounts.find(acc => acc.id === fromId);
  const toAcc = accounts.find(acc => acc.id === toId);

  let fxRate = 1;
  let convertedAmount = amount;

  if (fromAcc.currency !== toAcc.currency) {
    const key = `${fromAcc.currency}-${toAcc.currency}`;
    fxRate = fxRates[key];
    if (!fxRate) {
      formMessage.textContent = "FX rate not available.";
      return;
    }
    convertedAmount = amount * fxRate;
  }

  if (!futureDate && fromAcc.balance < amount) {
    formMessage.textContent = "Insufficient funds.";
    return;
  }

  if (!futureDate) {
    fromAcc.balance -= amount;
    toAcc.balance += convertedAmount;
    renderAccounts();
  }

  const now = new Date();
  const tx = {
    date: futureDate || now.toISOString().split("T")[0],
    fromId: fromAcc.id,
    toId: toAcc.id,
    from: fromAcc.name,
    to: toAcc.name,
    fromCurrency: fromAcc.currency,
    toCurrency: toAcc.currency,
    amountFormatted: `${formatCurrency(fromAcc.currency, amount)} → ${formatCurrency(toAcc.currency, convertedAmount)}`,
    fx: fxRate !== 1 ? `1 ${fromAcc.currency} = ${fxRate.toFixed(2)} ${toAcc.currency}` : "N/A",
    note: note || "—"
  };

  transactions.push(tx);
  updateTransactionLog();
  transferForm.reset();
  updateToFromDropdowns();
  formMessage.textContent = "Transfer successful.";
  formMessage.style.color = "green";
});

const updateTransactionLog = (filterAccId = "", filterCur = "") => {
  logTableBody.innerHTML = "";

  const filtered = transactions.filter(tx => {
    const accMatch = !filterAccId || tx.fromId == filterAccId || tx.toId == filterAccId;
    const curMatch = !filterCur || tx.fromCurrency === filterCur || tx.toCurrency === filterCur;
    return accMatch && curMatch;
  });

  if (filtered.length === 0) {
    filterMessage.textContent = "No matching transactions found.";
  } else {
    filterMessage.textContent = `Showing ${filtered.length} transaction${filtered.length > 1 ? "s" : ""}.`;
  }

  filtered.forEach(tx => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.from}</td>
      <td>${tx.to}</td>
      <td>${tx.amountFormatted}</td>
      <td>${tx.fx}</td>
      <td>${tx.note}</td>
    `;
    logTableBody.appendChild(row);
  });
};

filterAccount.addEventListener("change", () => {
  updateTransactionLog(filterAccount.value, filterCurrency.value);
});

filterCurrency.addEventListener("change", () => {
  updateTransactionLog(filterAccount.value, filterCurrency.value);
});

document.addEventListener("DOMContentLoaded", () => {
  renderAccounts();
  populateDropdowns();
});
