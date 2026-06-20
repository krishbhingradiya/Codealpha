// Cart management using localStorage
const CART_KEY = 'dineflow_cart';
const CURRENCY = '₹';
let appliedCoupon = null;

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  // Dispatch custom event so other parts of the page can react
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
}

function addToCart(item) {
  if (!item || !item.id) {
    console.error('addToCart: invalid item', item);
    return;
  }
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      image_url: item.image_url || null,
      category_icon: item.category_icon || '🍽️',
      quantity: 1
    });
  }
  
  saveCart(cart);
  showToast(`${item.name} added to cart!`, 'success');
  
  // Update the button to show quantity controls if on menu page
  updateMenuItemButton(item.id);
}

function removeFromCart(itemId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== itemId);
  saveCart(cart);
  if (typeof renderCartPage === 'function') renderCartPage();
  updateMenuItemButton(itemId);
}

function updateQuantity(itemId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === itemId);
  
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    saveCart(cart);
    if (typeof renderCartPage === 'function') renderCartPage();
    updateMenuItemButton(itemId);
  }
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  appliedCoupon = null;
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));
}

function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-count');
  
  if (badge) {
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.classList.remove('hidden');
      badge.classList.add('flex');
    } else {
      badge.classList.add('hidden');
      badge.classList.remove('flex');
    }
  }
}

function getCartTotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function fmtPrice(num) {
  const n = parseFloat(num);
  if (isNaN(n)) return '';
  return CURRENCY + (Number.isInteger(n) ? n : n.toFixed(2));
}

/** Update the Add button on the menu page to show quantity controls */
function updateMenuItemButton(itemId) {
  const cart = getCart();
  const cartItem = cart.find(i => i.id === itemId);
  
  // Find the button with matching data-item that contains this id
  const buttons = document.querySelectorAll(`[data-item-id="${itemId}"]`);
  buttons.forEach(container => {
    if (cartItem && cartItem.quantity > 0) {
      container.innerHTML = `
        <div class="flex items-center gap-1">
          <button onclick="event.stopPropagation();updateQuantity('${itemId}', -1)" class="w-8 h-8 rounded-lg bg-orange-50 text-primary flex items-center justify-center hover:bg-orange-100 transition-colors font-bold">−</button>
          <span class="w-8 text-center font-semibold text-sm text-secondary">${cartItem.quantity}</span>
          <button onclick="event.stopPropagation();updateQuantity('${itemId}', 1)" class="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors font-bold">+</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button onclick="event.stopPropagation();addToCartById('${itemId}')" class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-sm active:scale-95">
          <i class="ri-add-line mr-1"></i>Add
        </button>
      `;
    }
  });
}

/** Fallback: add to cart by reading data from container's dataset */
function addToCartById(itemId) {
  const container = document.querySelector(`[data-item-id="${itemId}"]`);
  if (container && container.dataset.itemJson) {
    const item = JSON.parse(container.dataset.itemJson);
    addToCart(item);
  }
}

function renderCartPage() {
  const cart = getCart();
  const emptyEl = document.getElementById('cart-empty');
  const contentEl = document.getElementById('cart-content');
  const listEl = document.getElementById('cart-items-list');
  
  if (!emptyEl || !contentEl) return;
  
  if (cart.length === 0) {
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }
  
  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');
  
  if (listEl) {
    listEl.innerHTML = cart.map(item => `
      <div class="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
        <div class="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          ${item.image_url 
            ? `<img src="${item.image_url}" alt="${item.name}" class="w-full h-full object-cover rounded-xl">`
            : `<span class="text-2xl">${item.category_icon || '🍽️'}</span>`
          }
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-sm text-secondary truncate">${item.name}</h3>
          <p class="text-primary font-medium text-sm">${fmtPrice(item.price)}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="updateQuantity('${item.id}', -1)" class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
            <i class="ri-subtract-line"></i>
          </button>
          <span class="w-8 text-center font-medium text-sm">${item.quantity}</span>
          <button onclick="updateQuantity('${item.id}', 1)" class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
            <i class="ri-add-line"></i>
          </button>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="font-semibold text-sm">${fmtPrice(item.price * item.quantity)}</p>
          <button onclick="removeFromCart('${item.id}')" class="text-xs text-red-400 hover:text-red-600 mt-1">Remove</button>
        </div>
      </div>
    `).join('');
  }
  
  // Update summary
  const total = getCartTotal();
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  
  const countEl = document.getElementById('summary-count');
  const subtotalEl = document.getElementById('summary-subtotal');
  const totalEl = document.getElementById('summary-total');
  const discountRow = document.getElementById('discount-row');
  const discountCodeEl = document.getElementById('discount-coupon-code');
  const discountAmountEl = document.getElementById('summary-discount');
  const couponInputEl = document.getElementById('coupon-code-input');
  
  if (countEl) countEl.textContent = totalItems;
  if (subtotalEl) subtotalEl.textContent = fmtPrice(total);
  
  let discount = 0;
  if (appliedCoupon) {
    if (total >= parseFloat(appliedCoupon.minOrder)) {
      discount = Math.min(total * (parseFloat(appliedCoupon.discountPercent) / 100), parseFloat(appliedCoupon.maxDiscount));
      
      if (discountRow) discountRow.classList.remove('hidden');
      if (discountCodeEl) discountCodeEl.textContent = appliedCoupon.couponCode;
      if (discountAmountEl) discountAmountEl.textContent = '- ' + fmtPrice(discount);
      if (couponInputEl) couponInputEl.value = appliedCoupon.couponCode;
    } else {
      // Order amount fell below coupon requirement
      if (discountRow) discountRow.classList.add('hidden');
      if (couponInputEl) couponInputEl.value = '';
      showCouponFeedback(`Coupon code ${appliedCoupon.couponCode} requires minimum order of ${fmtPrice(appliedCoupon.minOrder)}`, 'error');
    }
  } else {
    if (discountRow) discountRow.classList.add('hidden');
    if (couponInputEl) couponInputEl.value = '';
  }
  
  if (totalEl) totalEl.textContent = fmtPrice(Math.max(0, total - discount));
}

function applyCouponCode() {
  const field = document.getElementById('coupon-field');
  if (!field) return;
  const code = field.value.trim().toUpperCase();
  
  if (!code) {
    showCouponFeedback('Please enter a coupon code', 'error');
    return;
  }
  
  const orderAmount = getCartTotal();
  
  fetch('/api/coupons/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, orderAmount })
  })
  .then(async res => {
    const data = await res.json();
    if (res.ok && data.success) {
      appliedCoupon = data;
      renderCartPage();
      showCouponFeedback(`Coupon applied! Discount: ₹${parseFloat(data.discountAmount).toFixed(2)}`, 'success');
    } else {
      appliedCoupon = null;
      renderCartPage();
      showCouponFeedback(data.error || 'Failed to validate coupon', 'error');
    }
  })
  .catch(err => {
    console.error('Validation error:', err);
    showCouponFeedback('Error validating coupon', 'error');
  });
}

function showCouponFeedback(message, type) {
  const feedbackEl = document.getElementById('coupon-feedback');
  if (!feedbackEl) return;
  
  feedbackEl.textContent = message;
  feedbackEl.classList.remove('hidden', 'text-green-600', 'text-red-600');
  
  if (type === 'success') {
    feedbackEl.classList.add('text-green-600');
  } else {
    feedbackEl.classList.add('text-red-600');
  }
}

function prepareCheckout() {
  const cart = getCart();
  const orderItemsInput = document.getElementById('order-items');
  
  if (orderItemsInput) {
    const items = cart.map(item => ({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    orderItemsInput.value = JSON.stringify(items);
  }
  
  // Clear cart and coupon after placing order
  setTimeout(() => {
    clearCart();
  }, 1000);
}

function showToast(message, type) {
  // Remove any existing toast
  const existing = document.getElementById('dineflow-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'dineflow-toast';
  toast.className = 'fixed bottom-4 right-4 z-[9999] bg-secondary text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2';
  toast.style.animation = 'slideInUp 0.3s ease-out';
  
  const icon = type === 'success' ? 'ri-check-line text-green-400' : 'ri-information-line text-blue-400';
  toast.innerHTML = `<i class="${icon}"></i>${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Add CSS animation for toast
(function() {
  if (!document.getElementById('cart-toast-style')) {
    const style = document.createElement('style');
    style.id = 'cart-toast-style';
    style.textContent = `
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }
})();

// Initialize cart badge on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartBadge();
  
  // Initialize quantity controls on menu page for items already in cart
  const cart = getCart();
  cart.forEach(item => updateMenuItemButton(item.id));
});
