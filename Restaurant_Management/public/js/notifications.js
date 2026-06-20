// Notification polling
(function() {
  let lastCount = 0;
  
  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Note C5
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.15);
      
      // Note E5
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.3);
      }, 100);
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  }

  async function checkNotifications() {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        const count = data.count || 0;
        const badge = document.getElementById('notif-count');
        
        if (badge) {
          if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
            badge.classList.add('flex');
            
            // Show toast and play sound for new notifications
            if (count > lastCount && lastCount > 0) {
              showNotifToast(`You have ${count - lastCount} new notification(s)`);
              playNotificationSound();
            }
          } else {
            badge.classList.add('hidden');
            badge.classList.remove('flex');
          }
        }
        
        lastCount = count;
      }
    } catch (e) {
      // Silently fail
    }
  }
  
  function showNotifToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 z-50 bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slideIn';
    toast.innerHTML = `<i class="ri-notification-3-line"></i>${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  
  // Check immediately and then every 10 seconds
  checkNotifications();
  setInterval(checkNotifications, 10000);
})();
