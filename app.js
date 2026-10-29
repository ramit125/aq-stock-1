const defaultCategories = ['Orthopedic', 'General medicines', 'Injections', 'Surgical supplies', 'Medical devices'];
const defaultItems = [
  { id: 'item-1', name: 'Knee stabilizer brace', category: 'Orthopedic', price: 690, wholesalePrice: 570, minimumWholesaleQty: 5, stock: 14, description: 'Adjustable support brace. Confirm size availability before ordering.', emoji: '🦿' },
  { id: 'item-2', name: 'Lumbar support belt', category: 'Orthopedic', price: 850, wholesalePrice: 720, minimumWholesaleQty: 5, stock: 8, description: 'Back support belt available in multiple sizes.', emoji: '🩹' },
  { id: 'item-3', name: 'Elastic crepe bandage', category: 'Orthopedic', price: 85, wholesalePrice: 62, minimumWholesaleQty: 12, stock: 30, description: 'Reusable elastic bandage in standard size.', emoji: '🩹' },
  { id: 'item-4', name: 'Paracetamol tablets', category: 'General medicines', price: 28, wholesalePrice: 20, minimumWholesaleQty: 20, stock: 40, description: 'Pack size and current brand supplied as stocked.', emoji: '💊' },
  { id: 'item-5', name: 'Oral rehydration salts', category: 'General medicines', price: 22, wholesalePrice: 15, minimumWholesaleQty: 25, stock: 35, description: 'Single sachet. Check pack details at purchase.', emoji: '🧃' },
  { id: 'item-6', name: 'Antacid tablets', category: 'General medicines', price: 48, wholesalePrice: 36, minimumWholesaleQty: 12, stock: 18, description: 'Pack size and current brand supplied as stocked.', emoji: '💊' },
  { id: 'item-7', name: 'Insulin injection', category: 'Injections', price: 320, wholesalePrice: 280, minimumWholesaleQty: 10, stock: 0, description: 'Prescription-required product. Dispensing subject to local rules.', emoji: '💉' },
  { id: 'item-8', name: 'Vitamin B-complex injection', category: 'Injections', price: 95, wholesalePrice: 78, minimumWholesaleQty: 10, stock: 6, description: 'Prescription requirements depend on product and local rules.', emoji: '💉' },
  { id: 'item-9', name: 'Disposable syringes, 5 ml', category: 'Injections', price: 12, wholesalePrice: 8, minimumWholesaleQty: 100, stock: 250, description: 'Sterile, single-use syringes. Box quantities available.', emoji: '🧪' },
  { id: 'item-10', name: 'Sterile gauze pads', category: 'Surgical supplies', price: 45, wholesalePrice: 33, minimumWholesaleQty: 25, stock: 40, description: 'Individually packed sterile dressing pads.', emoji: '🩹' },
  { id: 'item-11', name: 'Nitrile examination gloves', category: 'Surgical supplies', price: 240, wholesalePrice: 195, minimumWholesaleQty: 10, stock: 16, description: 'Powder-free gloves. Multiple sizes may be available.', emoji: '🧤' },
  { id: 'item-12', name: 'Digital thermometer', category: 'Medical devices', price: 180, wholesalePrice: 145, minimumWholesaleQty: 5, stock: 7, description: 'Digital thermometer with display and storage case.', emoji: '🌡️' },
];

const artColors = {
  Orthopedic: '#d9e8c9',
  'General medicines': '#d6e5e0',
  Injections: '#f0d7c8',
  'Surgical supplies': '#eee1b9',
  'Medical devices': '#e5dce9',
};
const storageKey = 'aqua-chemi-items';
const categoryStorageKey = 'aqua-chemi-categories';
const SHOPKEEPER_PASSWORD = 'AC';
const config = window.AQUA_CHEMI_CONFIG || {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabasePublishableKey);
const supabaseClient = hasSupabaseConfig && window.supabase?.createClient
  ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey)
  : null;
const grid = document.querySelector('#product-grid');
const categoryList = document.querySelector('#category-list');
const searchInput = document.querySelector('#search-input');
const sortSelect = document.querySelector('#sort-select');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const dialog = document.querySelector('#item-dialog');
const itemForm = document.querySelector('#item-form');
const passwordDialog = document.querySelector('#password-dialog');
const passwordForm = document.querySelector('#password-form');
const loginDialog = document.querySelector('#login-dialog');
const loginForm = document.querySelector('#login-form');
const qrDialog = document.querySelector('#qr-dialog');
const qrCode = document.querySelector('#qr-code');
const toast = document.querySelector('#toast');
let items = [];
let order = [];
let categories = [...defaultCategories];
let activeCategory = 'All items';
let activeCompany = 'All companies';
let managerMode = false;
let toastTimeout;
let authUser = null;
let realtimeChannel = null;

function loadDemoItems() {
  try {
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.every((item) => item && typeof item === 'object')) return parsed;
  } catch (error) {
    console.warn('Saved shop stock could not be read.', error);
  }
  return defaultItems.map((item) => ({ ...item }));
}

function saveDemoItems() {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function loadDemoCategories() {
  let hasSavedCategories = false;
  try {
    const saved = localStorage.getItem(categoryStorageKey);
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed)) {
      categories = parsed.filter((category) => typeof category === 'string');
      hasSavedCategories = true;
    }
  } catch (error) {
    console.warn('Saved product categories could not be read.', error);
  }
  if (!hasSavedCategories) categories = [...defaultCategories];
  categories = [...new Set([...categories, ...items.map((item) => item.category).filter(Boolean)])];
}

function saveDemoCategories() {
  localStorage.setItem(categoryStorageKey, JSON.stringify(categories));
}

function fromDatabaseRow(row) {
  return {
    id: row.id,
    name: row.name,
    company: row.company || '',
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    category: row.category,
    price: Number(row.price),
    wholesalePrice: Number(row.wholesale_price),
    minimumWholesaleQty: Number(row.minimum_wholesale_qty),
    stock: Number(row.stock),
    description: row.description || '',
    emoji: row.emoji || '📦',
    sortOrder: Number(row.sort_order) || 0,
  };
}

function toDatabaseRow(item) {
  return {
    id: item.id,
    name: item.name,
    company: item.company || '',
    sizes: Array.isArray(item.sizes) ? item.sizes : [],
    category: item.category,
    price: item.price,
    wholesale_price: item.wholesalePrice,
    minimum_wholesale_qty: item.minimumWholesaleQty,
    stock: item.stock,
    description: item.description,
    emoji: item.emoji,
    sort_order: item.sortOrder,
  };
}

function setSyncStatus(message, state) {
  const status = document.querySelector('#sync-status');
  status.textContent = message;
  status.dataset.state = state;
}

async function loadLiveItems() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    setSyncStatus('Live stock unavailable', 'offline');
    showToast(`Could not load shared stock: ${error.message}`);
    return;
  }
  items = data.map(fromDatabaseRow);
  render();
  setSyncStatus('Live stock connected', 'live');
}

async function loadLiveCategories() {
  const { data, error } = await supabaseClient
    .from('product_categories')
    .select('name')
    .order('name', { ascending: true });
  if (error) {
    showToast(`Could not load shared categories: ${error.message}. Run the updated Supabase setup.sql.`);
    categories = [...new Set([...defaultCategories, ...items.map((item) => item.category).filter(Boolean)])];
    render();
    return;
  }
  categories = [...new Set(data.map((row) => row.name))];
  render();
}

function subscribeToLiveItems() {
  realtimeChannel = supabaseClient
    .channel('aqua-chemi-products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      loadLiveItems();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'product_categories' }, () => {
      loadLiveCategories();
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setSyncStatus('Live updates disconnected', 'offline');
      }
    });
}

async function initializeInventory() {
  if (hasSupabaseConfig) {
    if (!supabaseClient) {
      setSyncStatus('Supabase client unavailable', 'offline');
      showToast('Could not connect to Supabase. Check your internet connection and config.');
      return;
    }
    setSyncStatus('Connecting shared stock…', 'loading');
    await loadLiveItems();
    await loadLiveCategories();
    subscribeToLiveItems();
    const { data } = await supabaseClient.auth.getSession();
    authUser = data.session?.user || null;
    updateManagerButton();
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      authUser = session?.user || null;
      if (!authUser && managerMode) setManagerMode(false);
      updateManagerButton();
    });
    return;
  }
  items = loadDemoItems();
  loadDemoCategories();
  render();
  setSyncStatus('Demo stock · this browser only', 'demo');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(price) || 0);
}

function renderCategories() {
  const choices = ['All items', ...categories];
  if (!choices.includes(activeCategory)) activeCategory = 'All items';
  categoryList.innerHTML = choices.map((category) => `
    <button class="category-button" type="button" data-category="${escapeHtml(category)}" aria-pressed="${activeCategory === category}">
      ${escapeHtml(category)}
    </button>`).join('');
  const companyFilter = document.querySelector('#company-filter');
  const companies = [...new Set(items.map((item) => String(item.company || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  if (!companies.includes(activeCompany)) activeCompany = 'All companies';
  companyFilter.innerHTML = ['All companies', ...companies].map((company) => `
    <option value="${escapeHtml(company)}" ${activeCompany === company ? 'selected' : ''}>${escapeHtml(company)}</option>`).join('');
  const itemCategory = document.querySelector('#item-category');
  const selectedCategory = itemCategory.value;
  itemCategory.innerHTML = categories.map((category) => `
    <option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  itemCategory.value = categories.includes(selectedCategory) ? selectedCategory : (categories[0] || '');
}

function getItemSizes(item) {
  const sizes = Array.isArray(item.sizes)
    ? item.sizes.map((size) => String(size).trim()).filter(Boolean)
    : [];
  return sizes.length ? [...new Set(sizes)] : ['Standard'];
}

function parseItemSizes(value) {
  const sizes = new Map();
  String(value || '').split(',').map((size) => size.trim()).filter(Boolean).forEach((size) => {
    const key = size.toLocaleLowerCase();
    if (!sizes.has(key)) sizes.set(key, size);
  });
  return [...sizes.values()];
}

function getOrderQuantity(itemId) {
  return order
    .filter((line) => line.itemId === itemId)
    .reduce((total, line) => total + line.quantity, 0);
}

function getOrderUnitPrice(item) {
  return getOrderQuantity(item.id) >= (Number(item.minimumWholesaleQty) || 1)
    ? Number(item.wholesalePrice)
    : Number(item.price);
}

function updateOrderButton() {
  document.querySelector('#order-count').textContent = String(
    order.reduce((total, line) => total + line.quantity, 0),
  );
}

function getVisibleItems() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const visible = items.filter((item) => {
    const matchesCategory = activeCategory === 'All items' || item.category === activeCategory;
    const matchesCompany = activeCompany === 'All companies' || String(item.company || '').trim() === activeCompany;
    const searchable = `${item.name} ${item.company || ''} ${getItemSizes(item).join(' ')} ${item.category} ${item.description}`.toLocaleLowerCase();
    return matchesCategory && matchesCompany && searchable.includes(query);
  });
  const sort = sortSelect.value;
  if (sort === 'name') visible.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'price-low') visible.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === 'price-high') visible.sort((a, b) => Number(b.price) - Number(a.price));
  return visible;
}

function renderItems() {
  const visible = getVisibleItems();
  resultCount.textContent = `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`;
  document.querySelector('#footer-stock').textContent = `${items.length} GOODS ON THE SHELVES`;
  emptyState.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  updateOrderButton();
  grid.innerHTML = visible.map((item, index) => {
    const stock = Math.max(0, Number(item.stock) || 0);
    const out = stock === 0;
    const low = stock > 0 && stock <= 3;
    const sizes = getItemSizes(item);
    return `
      <article class="product-card" style="--art-bg:${escapeHtml(artColors[item.category] || '#e6e9df')}; animation-delay:${Math.min(index, 7) * 35}ms">
        <div class="product-art">
          <span class="stock-badge ${out ? 'out' : ''}">${out ? 'OUT OF STOCK' : 'IN STOCK'}</span>
          ${managerMode ? `<div class="manager-actions">
            <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(item.id)}" aria-label="Edit ${escapeHtml(item.name)}" title="Edit item">✎</button>
            <button class="icon-button delete" type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.name)}" title="Delete item">×</button>
          </div>` : ''}
          <span class="product-emoji" aria-hidden="true">${escapeHtml(item.emoji || '📦')}</span>
        </div>
        <div class="product-info">
          <p class="product-category">${escapeHtml(item.category)}</p>
          <h3 class="product-name">${escapeHtml(item.name)}</h3>
          ${item.company ? `<p class="product-company">${escapeHtml(item.company)}</p>` : ''}
          <p class="product-description">${escapeHtml(item.description || 'A good thing for your everyday.')}</p>
          <div class="product-bottom">
            <span class="product-pricing">
              <span class="product-price">Retail ${formatPrice(item.price)}</span>
              <span class="wholesale-price">Wholesale ${formatPrice(item.wholesalePrice)} · ${Number(item.minimumWholesaleQty) || 1}+ units</span>
            </span>
            <span class="quantity ${low ? 'low' : ''}">${out ? 'Not available' : `${stock} ${stock === 1 ? 'left' : 'available'}`}</span>
          </div>
          ${managerMode && low && !out ? '<p class="manager-note">Running low</p>' : ''}
          <div class="order-controls">
            <label class="order-size-field">Size
              <select class="order-size" aria-label="Size for ${escapeHtml(item.name)}" ${out ? 'disabled' : ''}>
                ${sizes.map((size) => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`).join('')}
              </select>
            </label>
            <label class="order-quantity-field">Qty
              <input class="order-quantity" type="number" min="1" max="${stock}" value="1" aria-label="Quantity for ${escapeHtml(item.name)}" ${out ? 'disabled' : ''} />
            </label>
            <button class="add-order-item" type="button" data-action="order-add" data-id="${escapeHtml(item.id)}" ${out ? 'disabled' : ''}>Add</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

function render() {
  renderCategories();
  renderCategoryManager();
  renderItems();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function openItemDialog(item) {
  renderCategories();
  itemForm.reset();
  document.querySelector('#item-id').value = item?.id || '';
  document.querySelector('#dialog-title').textContent = item ? 'Edit item' : 'Add an item';
  document.querySelector('#item-name').value = item?.name || '';
  document.querySelector('#item-company').value = item?.company || '';
  document.querySelector('#item-sizes').value = Array.isArray(item?.sizes) ? item.sizes.join(', ') : '';
  document.querySelector('#item-category').value = item?.category
    || (activeCategory !== 'All items' ? activeCategory : categories[0])
    || '';
  document.querySelector('#item-emoji').value = item?.emoji || '📦';
  document.querySelector('#item-price').value = item?.price ?? '';
  document.querySelector('#item-stock').value = item?.stock ?? '';
  document.querySelector('#item-wholesale-price').value = item?.wholesalePrice ?? '';
  document.querySelector('#item-minimum-order').value = item?.minimumWholesaleQty ?? 1;
  document.querySelector('#item-description').value = item?.description || '';
  dialog.showModal();
  document.querySelector('#item-name').focus();
}

function renderCategoryManager() {
  const list = document.querySelector('#category-manager-list');
  if (!list) return;
  list.innerHTML = categories.map((category) => {
    const count = items.filter((item) => item.category === category).length;
    return `
      <div class="category-manager-row">
        <label class="field">
          <span class="visually-hidden">Category name</span>
          <input type="text" maxlength="60" value="${escapeHtml(category)}" data-category-name="${escapeHtml(category)}" aria-label="Category name: ${escapeHtml(category)}" />
        </label>
        <span class="category-item-count">${count} ${count === 1 ? 'item' : 'items'}</span>
        <button class="category-action-button" type="button" data-category-action="save" data-category="${escapeHtml(category)}">Save</button>
        <button class="category-action-button" type="button" data-category-action="add-item" data-category="${escapeHtml(category)}">Add item</button>
        <button class="category-action-button delete" type="button" data-category-action="delete" data-category="${escapeHtml(category)}" aria-label="Delete ${escapeHtml(category)} category">Delete</button>
      </div>`;
  }).join('');
}

function openCategoryDialog() {
  renderCategoryManager();
  document.querySelector('#category-dialog').showModal();
  document.querySelector('#new-category-name').focus();
}

function normalizeCategoryName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function findCategoryDuplicate(name, excluding = '') {
  const normalized = name.toLocaleLowerCase();
  return categories.some((category) => category !== excluding && category.toLocaleLowerCase() === normalized);
}

async function addCategory(name) {
  const normalized = normalizeCategoryName(name);
  if (!normalized) {
    showToast('Enter a category name');
    return false;
  }
  if (findCategoryDuplicate(normalized)) {
    showToast('That category already exists');
    return false;
  }
  if (supabaseClient) {
    const { error } = await supabaseClient.from('product_categories').insert({ name: normalized });
    if (error) throw error;
    await loadLiveCategories();
  } else {
    categories = [...categories, normalized];
    saveDemoCategories();
    render();
  }
  showToast(`${normalized} category added`);
  return true;
}

async function renameCategory(oldName, newName) {
  const normalized = normalizeCategoryName(newName);
  if (!normalized) {
    showToast('Enter a category name');
    return false;
  }
  if (normalized === oldName) return true;
  if (findCategoryDuplicate(normalized, oldName)) {
    showToast('That category already exists');
    return false;
  }
  if (supabaseClient) {
    const { error } = await supabaseClient.rpc('rename_product_category', {
      old_name: oldName,
      new_name: normalized,
    });
    if (error) throw error;
    await Promise.all([loadLiveItems(), loadLiveCategories()]);
  } else {
    categories = categories.map((category) => category === oldName ? normalized : category);
    items = items.map((item) => item.category === oldName ? { ...item, category: normalized } : item);
    if (activeCategory === oldName) activeCategory = normalized;
    saveDemoCategories();
    saveDemoItems();
    render();
  }
  showToast(`${oldName} renamed to ${normalized}`);
  return true;
}

async function deleteCategory(category) {
  const count = items.filter((item) => item.category === category).length;
  if (count > 0) {
    showToast(`Move or delete all ${count} ${count === 1 ? 'item' : 'items'} in ${category} before deleting it`);
    return;
  }
  if (supabaseClient) {
    const { error } = await supabaseClient.rpc('delete_product_category', { category_name: category });
    if (error) throw error;
    await loadLiveCategories();
  } else {
    categories = categories.filter((entry) => entry !== category);
    if (activeCategory === category) activeCategory = 'All items';
    saveDemoCategories();
    render();
  }
  showToast(`${category} category deleted`);
}

function renderOrderCart() {
  const orderLines = document.querySelector('#order-lines');
  const orderTotal = document.querySelector('#order-total');
  const sendButton = document.querySelector('#send-order');
  const lines = order.map((line) => ({
    ...line,
    item: items.find((item) => item.id === line.itemId),
  })).filter((line) => line.item);
  if (lines.length !== order.length) {
    order = lines.map(({ item, ...line }) => line);
    updateOrderButton();
  }
  if (lines.length === 0) {
    orderLines.innerHTML = '<p class="empty-order">Your order is empty. Add products from the catalog first.</p>';
    orderTotal.textContent = '';
    sendButton.disabled = true;
    return;
  }
  sendButton.disabled = false;
  orderLines.innerHTML = lines.map(({ item, size, quantity }) => {
    const unitPrice = getOrderUnitPrice(item);
    return `
      <div class="order-line">
        <div class="order-line-details">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${item.company ? `${escapeHtml(item.company)} · ` : ''}${escapeHtml(size)}</span>
          <span>${formatPrice(unitPrice)} each</span>
        </div>
        <label class="order-line-quantity">Qty
          <input type="number" min="1" max="${Math.max(0, Number(item.stock) || 0)}" value="${quantity}" data-order-quantity="${escapeHtml(item.id)}" data-order-size="${escapeHtml(size)}" aria-label="Order quantity for ${escapeHtml(item.name)} (${escapeHtml(size)})" />
        </label>
        <button class="remove-order-item" type="button" data-order-remove="${escapeHtml(item.id)}" data-order-size="${escapeHtml(size)}" aria-label="Remove ${escapeHtml(item.name)} (${escapeHtml(size)})">×</button>
      </div>`;
  }).join('');
  const total = lines.reduce((sum, { item, quantity }) => sum + getOrderUnitPrice(item) * quantity, 0);
  orderTotal.textContent = `Estimated total: ${formatPrice(total)}`;
}

function openOrderDialog() {
  renderOrderCart();
  document.querySelector('#order-dialog').showModal();
}

function updateManagerButton() {
  const modeButton = document.querySelector('#mode-toggle');
  modeButton.setAttribute('aria-pressed', String(managerMode));
  document.querySelector('#mode-label').textContent = managerMode
    ? 'Exit shopkeeper mode'
    : hasSupabaseConfig ? 'Shopkeeper sign in' : 'Shopkeeper mode';
}

function setManagerMode(enabled) {
  managerMode = enabled;
  updateManagerButton();
  document.querySelector('#add-item').hidden = !managerMode;
  document.querySelector('#manage-categories').hidden = !managerMode;
  renderItems();
}

renderCategories();
render();
initializeInventory();

document.querySelector('#mode-toggle').addEventListener('click', async () => {
  if (managerMode) {
    setManagerMode(false);
    if (supabaseClient) await supabaseClient.auth.signOut({ scope: 'local' });
    return;
  }
  if (hasSupabaseConfig) {
    if (!supabaseClient) {
      showToast('Supabase is not available. Check the client script and configuration.');
      return;
    }
    if (authUser) {
      setManagerMode(true);
      return;
    }
    loginForm.reset();
    document.querySelector('#login-error').hidden = true;
    loginDialog.showModal();
    document.querySelector('#login-email').focus();
    return;
  }
  passwordForm.reset();
  document.querySelector('#password-error').hidden = true;
  passwordDialog.showModal();
  document.querySelector('#shopkeeper-password').focus();
});

passwordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const passwordInput = document.querySelector('#shopkeeper-password');
  if (passwordInput.value !== SHOPKEEPER_PASSWORD) {
    document.querySelector('#password-error').hidden = false;
    passwordInput.value = '';
    passwordInput.focus();
    return;
  }
  passwordDialog.close();
  passwordForm.reset();
  setManagerMode(true);
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const errorMessage = document.querySelector('#login-error');
  errorMessage.hidden = true;
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: document.querySelector('#login-email').value.trim(),
    password: document.querySelector('#login-password').value,
  });
  if (error) {
    errorMessage.textContent = 'Sign-in failed. Check your email and password.';
    errorMessage.hidden = false;
    return;
  }
  authUser = data.user;
  loginDialog.close();
  setManagerMode(true);
});

document.querySelector('#close-login').addEventListener('click', () => loginDialog.close());
document.querySelector('#cancel-login').addEventListener('click', () => loginDialog.close());
loginDialog.addEventListener('click', (event) => {
  if (event.target === loginDialog) loginDialog.close();
});

document.querySelector('#close-password').addEventListener('click', () => passwordDialog.close());
document.querySelector('#cancel-password').addEventListener('click', () => passwordDialog.close());
passwordDialog.addEventListener('click', (event) => {
  if (event.target === passwordDialog) passwordDialog.close();
});

categoryList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = button.dataset.category;
  render();
});

document.querySelector('#company-filter').addEventListener('change', (event) => {
  activeCompany = event.target.value;
  renderItems();
});
searchInput.addEventListener('input', renderItems);
sortSelect.addEventListener('change', renderItems);
document.querySelector('#add-item').addEventListener('click', () => openItemDialog());
document.querySelector('#clear-filters').addEventListener('click', () => {
  searchInput.value = '';
  activeCategory = 'All items';
  activeCompany = 'All companies';
  render();
});

grid.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const item = items.find((entry) => entry.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === 'order-add') {
    const card = button.closest('.product-card');
    const size = card.querySelector('.order-size').value;
    const quantity = Number(card.querySelector('.order-quantity').value);
    const stock = Math.max(0, Number(item.stock) || 0);
    const existing = order.find((line) => line.itemId === item.id && line.size === size);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (!Number.isInteger(quantity) || quantity < 1 || getOrderQuantity(item.id) + quantity > stock) {
      showToast(`Only ${Math.max(0, stock - getOrderQuantity(item.id))} ${item.name} available`);
      return;
    }
    if (existing) existing.quantity = nextQuantity;
    else order.push({ itemId: item.id, size, quantity });
    updateOrderButton();
    showToast(`${item.name} added to your order`);
    return;
  }
  if (button.dataset.action === 'edit') openItemDialog(item);
  if (button.dataset.action === 'delete' && window.confirm(`Delete “${item.name}” from the shop stock?`)) {
    try {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('products').delete().eq('id', item.id);
        if (error) throw error;
        await loadLiveItems();
      } else {
        items = items.filter((entry) => entry.id !== item.id);
        saveDemoItems();
        render();
      }
      showToast(`${item.name} deleted`);
    } catch (error) {
      showToast(`Delete failed: ${error.message}`);
    }
  }
});

itemForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!itemForm.reportValidity()) return;
  const id = document.querySelector('#item-id').value;
  const existing = items.find((item) => item.id === id);
  const item = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`),
    name: document.querySelector('#item-name').value.trim(),
    company: document.querySelector('#item-company').value.trim(),
    sizes: parseItemSizes(document.querySelector('#item-sizes').value),
    category: document.querySelector('#item-category').value,
    emoji: document.querySelector('#item-emoji').value.trim() || '📦',
    price: Number(document.querySelector('#item-price').value),
    stock: Number(document.querySelector('#item-stock').value),
    wholesalePrice: Number(document.querySelector('#item-wholesale-price').value),
    minimumWholesaleQty: Number(document.querySelector('#item-minimum-order').value),
    description: document.querySelector('#item-description').value.trim(),
    sortOrder: existing?.sortOrder ?? Math.min(0, ...items.map((entry) => entry.sortOrder ?? 0)) - 1,
  };
  if (!categories.includes(item.category)) {
    showToast('Choose a valid category');
    return;
  }
  try {
    if (supabaseClient) {
      const { error } = await supabaseClient.from('products').upsert(toDatabaseRow(item));
      if (error) throw error;
      await loadLiveItems();
    } else {
      if (existing) items = items.map((entry) => entry.id === id ? item : entry);
      else items.unshift(item);
      saveDemoItems();
      render();
    }
    dialog.close();
    showToast(existing ? `${item.name} updated` : `${item.name} added`);
  } catch (error) {
    showToast(`Save failed: ${error.message}`);
  }
});

document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

const categoryDialog = document.querySelector('#category-dialog');
const categoryForm = document.querySelector('#category-form');
document.querySelector('#manage-categories').addEventListener('click', openCategoryDialog);
document.querySelector('#close-categories').addEventListener('click', () => categoryDialog.close());
categoryDialog.addEventListener('click', (event) => {
  if (event.target === categoryDialog) categoryDialog.close();
});
categoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!categoryForm.reportValidity()) return;
  try {
    const added = await addCategory(document.querySelector('#new-category-name').value);
    if (added) {
      categoryForm.reset();
      renderCategoryManager();
    }
  } catch (error) {
    showToast(`Could not add category: ${error.message}`);
  }
});
document.querySelector('#category-manager-list').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-category-action]');
  if (!button) return;
  const category = button.dataset.category;
  if (button.dataset.categoryAction === 'add-item') {
    activeCategory = category;
    activeCompany = 'All companies';
    categoryDialog.close();
    render();
    openItemDialog();
    return;
  }
  if (button.dataset.categoryAction === 'save') {
    const newName = button.closest('.category-manager-row').querySelector('input').value;
    try {
      if (await renameCategory(category, newName)) renderCategoryManager();
    } catch (error) {
      showToast(`Could not rename category: ${error.message}`);
    }
    return;
  }
  if (button.dataset.categoryAction === 'delete') {
    const hasProducts = items.some((item) => item.category === category);
    if (hasProducts) {
      showToast(`Move or delete all products in ${category} before deleting it`);
      return;
    }
    if (!window.confirm(`Delete the empty category “${category}”?`)) return;
    try {
      await deleteCategory(category);
      renderCategoryManager();
    } catch (error) {
      showToast(`Could not delete category: ${error.message}`);
    }
  }
});

const orderDialog = document.querySelector('#order-dialog');
const orderForm = document.querySelector('#order-form');
document.querySelector('#open-order').addEventListener('click', openOrderDialog);
document.querySelector('#close-order').addEventListener('click', () => orderDialog.close());
document.querySelector('#continue-shopping').addEventListener('click', () => orderDialog.close());
orderDialog.addEventListener('click', (event) => {
  if (event.target === orderDialog) orderDialog.close();
});
document.querySelector('#order-lines').addEventListener('click', (event) => {
  const button = event.target.closest('[data-order-remove]');
  if (!button) return;
  order = order.filter((line) => line.itemId !== button.dataset.orderRemove || line.size !== button.dataset.orderSize);
  updateOrderButton();
  renderOrderCart();
});
document.querySelector('#order-lines').addEventListener('change', (event) => {
  const input = event.target.closest('[data-order-quantity]');
  if (!input) return;
  const quantity = Number(input.value);
  const itemId = input.dataset.orderQuantity;
  const size = input.dataset.orderSize;
  const line = order.find((entry) => entry.itemId === itemId && entry.size === size);
  const item = items.find((entry) => entry.id === itemId);
  if (!line || !item) return;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > Number(item.stock)) {
    showToast(`Enter a quantity from 1 to ${Math.max(0, Number(item.stock) || 0)}`);
    input.value = String(line.quantity);
    return;
  }
  line.quantity = quantity;
  updateOrderButton();
  renderOrderCart();
});
orderForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!orderForm.reportValidity()) return;
  if (order.length === 0) {
    showToast('Add at least one product to your order');
    return;
  }
  for (const line of order) {
    const item = items.find((entry) => entry.id === line.itemId);
    if (!item || !getItemSizes(item).includes(line.size) || line.quantity > Number(item.stock)) {
      showToast(`Please update the size or quantity for ${item?.name || 'an unavailable product'}`);
      renderOrderCart();
      return;
    }
  }
  const shopNumber = String(config.shopWhatsAppNumber || '').replace(/\D/g, '');
  if (shopNumber.length < 8 || shopNumber.length > 15) {
    showToast('Shop WhatsApp number is not configured. Add it in config.js with country code.');
    return;
  }
  const customerName = document.querySelector('#customer-name').value.trim();
  const customerPhone = document.querySelector('#customer-phone').value.trim();
  const notes = document.querySelector('#order-notes').value.trim();
  const lines = order.map((line) => {
    const item = items.find((entry) => entry.id === line.itemId);
    const unitPrice = getOrderUnitPrice(item);
    const brand = item.company ? `, ${item.company}` : '';
    return `• ${item.name}${brand} — Size: ${line.size}, Qty: ${line.quantity}, ${formatPrice(unitPrice)} each = ${formatPrice(unitPrice * line.quantity)}`;
  });
  const total = order.reduce((sum, line) => {
    const item = items.find((entry) => entry.id === line.itemId);
    return sum + getOrderUnitPrice(item) * line.quantity;
  }, 0);
  const message = [
    'Hello, I would like to place an order from AQUA CHEMI.',
    '',
    ...lines,
    '',
    `Estimated total: ${formatPrice(total)}`,
    `Name: ${customerName}`,
    customerPhone ? `Customer phone: ${customerPhone}` : '',
    notes ? `Note: ${notes}` : '',
    '',
    'Please confirm availability and final price.',
  ].filter(Boolean).join('\n');
  const whatsappUrl = `https://wa.me/${shopNumber}?text=${encodeURIComponent(message)}`;
  window.location.assign(whatsappUrl);
});

function getCatalogUrl() {
  const configuredUrl = String(config.publicCatalogUrl || '').trim();
  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl);
      return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null;
    } catch {
      return null;
    }
  }
  if (['https:', 'http:'].includes(window.location.protocol)) {
    return `${window.location.origin}${window.location.pathname}`;
  }
  return null;
}

function renderQrCode() {
  qrCode.innerHTML = '';
  const catalogUrl = getCatalogUrl();
  const status = document.querySelector('#qr-status');
  const urlLabel = document.querySelector('#qr-url');
  const downloadButton = document.querySelector('#download-qr');
  const copyButton = document.querySelector('#copy-catalog-link');
  if (!catalogUrl) {
    status.textContent = 'Publish the catalog or set its public URL in config.js to make a customer QR.';
    urlLabel.textContent = '';
    downloadButton.disabled = true;
    copyButton.disabled = true;
    return;
  }
  if (!window.QRCode) {
    status.textContent = 'QR generator did not load. Check your internet connection.';
    downloadButton.disabled = true;
    copyButton.disabled = false;
    urlLabel.textContent = catalogUrl;
    return;
  }
  status.textContent = 'This permanent link opens the latest shared stock.';
  urlLabel.textContent = catalogUrl;
  downloadButton.disabled = false;
  copyButton.disabled = false;
  new window.QRCode(qrCode, {
    text: catalogUrl,
    width: 220,
    height: 220,
    colorDark: '#202b25',
    colorLight: '#ffffff',
    correctLevel: window.QRCode.CorrectLevel.H,
  });
}

document.querySelector('#qr-open').addEventListener('click', () => {
  renderQrCode();
  qrDialog.showModal();
});
document.querySelector('#close-qr').addEventListener('click', () => qrDialog.close());
qrDialog.addEventListener('click', (event) => {
  if (event.target === qrDialog) qrDialog.close();
});
document.querySelector('#download-qr').addEventListener('click', () => {
  const canvas = qrCode.querySelector('canvas');
  const image = qrCode.querySelector('img');
  const imageUrl = canvas?.toDataURL('image/png') || image?.src;
  if (!imageUrl) return;
  const downloadLink = document.createElement('a');
  downloadLink.href = imageUrl;
  downloadLink.download = 'aqua-chemi-customer-stock-qr.png';
  downloadLink.click();
});
document.querySelector('#copy-catalog-link').addEventListener('click', async () => {
  const catalogUrl = getCatalogUrl();
  if (!catalogUrl) return;
  try {
    await navigator.clipboard.writeText(catalogUrl);
    showToast('Customer catalog link copied');
  } catch {
    showToast('Copy is unavailable in this browser. Use the displayed catalog link.');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});