// Main UI interactions

// Toggle user menu dropdown
function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
  const wrapper = document.getElementById('user-menu-wrapper');
  const menu = document.getElementById('user-menu');
  if (wrapper && menu && !wrapper.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

// Toggle mobile menu
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const icon = document.getElementById('mobile-menu-icon');
  if (menu) {
    menu.classList.toggle('hidden');
    if (icon) {
      icon.className = menu.classList.contains('hidden') ? 'ri-menu-line text-xl' : 'ri-close-line text-xl';
    }
  }
}

// Auto-dismiss flash messages after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  const flashMessages = document.querySelectorAll('.flash-message');
  flashMessages.forEach(msg => {
    setTimeout(() => {
      msg.style.transition = 'opacity 0.3s, transform 0.3s';
      msg.style.opacity = '0';
      msg.style.transform = 'translateX(100%)';
      setTimeout(() => msg.remove(), 300);
    }, 5000);
  });
});

// Confirm delete actions
function confirmDelete(message) {
  return confirm(message || 'Are you sure you want to delete this?');
}
