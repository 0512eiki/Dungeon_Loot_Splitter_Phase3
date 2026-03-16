// Storage key declared at the top for consistent reuse across the app.
const STORAGE_KEY = 'lootSplitterState';

// Persistent state: the array and party size are the single source of truth.
let lootItems = [];
let partySize = 1;

// All DOM access uses getElementById, as required.
const partySizeInput = document.getElementById('partySize');
const partyMessage = document.getElementById('partyMessage');
const lootNameInput = document.getElementById('lootName');
const lootValueInput = document.getElementById('lootValue');
const lootQuantityInput = document.getElementById('lootQuantity');
const addLootBtn = document.getElementById('addLootBtn');
const addLootMessage = document.getElementById('addLootMessage');
const noLootMessage = document.getElementById('noLootMessage');
const lootRows = document.getElementById('lootRows');
const lootTotalsRow = document.getElementById('lootTotalsRow');
const totalLootElement = document.getElementById('totalLoot');
const splitLootBtn = document.getElementById('splitLootBtn');
const splitMessage = document.getElementById('splitMessage');
const finalTotalElement = document.getElementById('finalTotal');
const perMemberElement = document.getElementById('perMember');
const splitResults = document.getElementById('splitResults');
const resetAllBtn = document.getElementById('resetAllBtn');

// Register required events.
addLootBtn.addEventListener('click', addLoot);
splitLootBtn.addEventListener('click', splitLoot);
partySizeInput.addEventListener('input', handlePartySizeInput);
resetAllBtn.addEventListener('click', resetAll);

// Restore saved state after the DOM is ready, then render the interface.
restoreState();
updateUI();

function saveState() {
  // Save only after valid state mutations and never from inside updateUI().
  const payload = {
    loot: lootItems,
    partySize: partySize
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreState() {
  // Default state if storage is missing or invalid.
  lootItems = [];
  partySize = 1;
  partySizeInput.value = '1';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return;
  }

  try {
    const parsed = JSON.parse(stored);

    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.loot)) {
        for (let i = 0; i < parsed.loot.length; i += 1) {
          const item = parsed.loot[i];
          if (isValidLootItem(item)) {
            lootItems.push({
              name: item.name.trim(),
              value: Number(item.value),
              quantity: Number(item.quantity)
            });
          }
        }
      }

      if (Number.isInteger(parsed.partySize) && parsed.partySize >= 1) {
        partySize = parsed.partySize;
        partySizeInput.value = String(parsed.partySize);
      }
    }
  } catch (error) {
    // If parsing fails, fall back to default state without crashing.
    lootItems = [];
    partySize = 1;
    partySizeInput.value = '1';
  }
}

function isValidLootItem(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const nameValid = typeof item.name === 'string' && item.name.trim() !== '';
  const valueNumber = Number(item.value);
  const quantityNumber = Number(item.quantity);

  return nameValid
    && !Number.isNaN(valueNumber)
    && valueNumber >= 0
    && Number.isInteger(quantityNumber)
    && quantityNumber >= 1;
}

function addLoot() {
  addLootMessage.textContent = '';

  const name = lootNameInput.value.trim();
  const value = Number(lootValueInput.value);
  const quantity = Number(lootQuantityInput.value);

  // Validate before mutating state.
  if (name === '') {
    addLootMessage.textContent = 'Please enter a Loot Name.';
    return;
  }

  if (lootValueInput.value.trim() === '' || Number.isNaN(value)) {
    addLootMessage.textContent = 'Please enter a valid Loot Value.';
    return;
  }

  if (value < 0) {
    addLootMessage.textContent = 'Loot Value cannot be negative.';
    return;
  }

  if (lootQuantityInput.value.trim() === '' || Number.isNaN(quantity)) {
    addLootMessage.textContent = 'Please enter a valid Quantity.';
    return;
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    addLootMessage.textContent = 'Quantity must be 1 or greater.';
    return;
  }

  // Store loot as an object with name, value, and quantity.
  lootItems.push({ name: name, value: value, quantity: quantity });

  lootNameInput.value = '';
  lootValueInput.value = '';
  lootQuantityInput.value = '';
  addLootMessage.textContent = 'Loot added successfully.';

  saveState();
  updateUI();
}

function handlePartySizeInput() {
  const rawValue = partySizeInput.value.trim();
  const nextPartySize = Number(rawValue);
  const valid = rawValue !== '' && Number.isInteger(nextPartySize) && nextPartySize >= 1;

  if (valid) {
    partySize = nextPartySize;
    saveState();
  }

  updateUI();
}

function updateUI() {
  // Clear shared messages before recalculating interface state.
  splitMessage.textContent = '';

  // Read current party size and validate without mutating state.
  const partySizeRaw = partySizeInput.value.trim();
  const partySize = Number(partySizeRaw);
  const partySizeValid = partySizeRaw !== '' && !Number.isNaN(partySize) && partySize >= 1 && Number.isInteger(partySize);

  if (!partySizeValid && partySizeRaw !== '') {
    partyMessage.textContent = 'Party size must be 1 or greater.';
  } else if (partySizeRaw === '') {
    partyMessage.textContent = 'Enter party size to split loot.';
  } else {
    partyMessage.textContent = '';
  }

  // Always re-render the loot list from the array (source of truth).
  lootRows.innerHTML = '';

  if (lootItems.length === 0) {
    noLootMessage.classList.remove('hidden');
    lootTotalsRow.classList.add('hidden');
  } else {
    noLootMessage.classList.add('hidden');
    lootTotalsRow.classList.remove('hidden');
  }

  // Traditional for loop to render loot rows and calculate totals.
  let total = 0;
  for (let i = 0; i < lootItems.length; i += 1) {
    const row = document.createElement('div');
    row.className = 'loot-row';

    const nameCell = document.createElement('div');
    nameCell.className = 'loot-cell';
    nameCell.innerText = lootItems[i].name;

    const valueCell = document.createElement('div');
    valueCell.className = 'loot-cell';
    valueCell.innerText = lootItems[i].value.toFixed(2);

    const quantityCell = document.createElement('div');
    quantityCell.className = 'loot-cell';
    quantityCell.innerText = lootItems[i].quantity;

    const actionCell = document.createElement('div');
    actionCell.className = 'loot-cell loot-actions';

    const removeBtn = document.createElement('button');
    removeBtn.innerText = 'Remove';
    removeBtn.addEventListener('click', function () {
      removeLoot(i);
    });

    actionCell.appendChild(removeBtn);

    row.appendChild(nameCell);
    row.appendChild(valueCell);
    row.appendChild(quantityCell);
    row.appendChild(actionCell);

    lootRows.appendChild(row);

    total += lootItems[i].value * lootItems[i].quantity;
  }

  totalLootElement.textContent = total.toFixed(2);
  finalTotalElement.textContent = total.toFixed(2);

  const hasLoot = lootItems.length > 0;
  const canSplit = hasLoot && partySizeValid;

  splitLootBtn.disabled = !canSplit;

  if (canSplit) {
    const splitValue = total / partySize;
    perMemberElement.textContent = splitValue.toFixed(2);
    splitResults.classList.remove('hidden');
  } else {
    perMemberElement.textContent = '0.00';
    splitResults.classList.add('hidden');
  }
}

function splitLoot() {
  // Split button does not calculate; it simply triggers a refresh from state.
  updateUI();
}

function removeLoot(index) {
  // Remove the correct item using splice() and immediately re-render.
  lootItems.splice(index, 1);
  saveState();
  updateUI();
}

function resetAll() {
  lootItems = [];
  partySize = 1;
  partySizeInput.value = '1';
  localStorage.removeItem(STORAGE_KEY);
  addLootMessage.textContent = '';
  splitMessage.textContent = '';
  updateUI();
}
