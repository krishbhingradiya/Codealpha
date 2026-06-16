/**
 * ============================================
 * ShortLink Pro — Frontend JavaScript
 * ============================================
 * Handles all client-side interactions:
 * - Form submissions for shortening and custom aliases
 * - Dashboard CRUD operations contacting the backend
 * - Analytics loading
 * - Modals, clipboard copies, and QR image downloads
 */

// ─── Globals & API Configuration ─────────────────────
// window.BACKEND_URL is injected via the EJS header.
// Fallback to local default if not found.
const BACKEND_BASE = (window.BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE = `${BACKEND_BASE}/api/urls`;

const supabaseClient = supabase.createClient(window.SUPABASE_URL || '', window.SUPABASE_ANON_KEY || '');

let currentPage = 1;
let totalPages = 1;
let searchTimeout = null;

// ─── Utility Functions ────────────────────────────────

/**
 * Perform a fetch request to the Backend API and return parsed JSON
 */
async function apiRequest(url, options = {}) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.errors?.join(', ') || 'Request failed');
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Could not connect to the Backend API server. Please make sure it is running on port 5000.');
    }
    throw err;
  }
}

/**
 * Display toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.classList.add('toast-exit'); setTimeout(() => this.parentElement.remove(), 300)">&times;</button>
  `;
  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Copied to clipboard!', 'success');
  }
}

/**
 * Download a base64 image as a file
 */
function downloadBase64Image(dataUri, filename) {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format an ISO timestamp into readable exact date and time in Asia/Kolkata timezone
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return dayjs.utc(dateStr).tz('Asia/Kolkata').format('MMM D, YYYY, hh:mm:ss A');
}

/**
 * Format date to relative string in Asia/Kolkata timezone context
 */
function formatRelativeDate(dateStr) {
  if (!dateStr) return 'Never';
  
  // Parse raw timestamp explicitly as UTC first, then convert presentation to Asia/Kolkata.
  const dateVal = dayjs.utc(dateStr).tz('Asia/Kolkata');
  const nowVal = dayjs.utc().tz('Asia/Kolkata'); // Current instant in Asia/Kolkata
  
  const diffMs = nowVal.valueOf() - dateVal.valueOf();
  const diffSeconds = Math.floor(diffMs / 1000);

  // Temporary debugging console log
  console.log(`[Time Debug]
- Raw API timestamp: "${dateStr}"
- Parsed Localized (Asia/Kolkata): "${dateVal.format('YYYY-MM-DD HH:mm:ss')}"
- Current Instant (Asia/Kolkata): "${nowVal.format('YYYY-MM-DD HH:mm:ss')}"
- Milliseconds Difference: ${diffMs} ms
- Seconds Difference: ${diffSeconds} s`);

  if (diffSeconds < 60) {
    return 'Just now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffSeconds / 3600);
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

/**
 * Truncate long strings for UI display
 */
function truncateUrl(url, maxLen = 50) {
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen) + '…';
}

// ─── Landing Page Handlers ────────────────────────────

async function initLandingPage() {
  const shortenForm = document.getElementById('shortenForm');
  const customCodeToggle = document.getElementById('customCodeToggle');
  const expirationToggle = document.getElementById('expirationToggle');
  const formExtras = document.getElementById('formExtras');
  const customCodeInput = document.getElementById('customCodeInput');
  const expirationDateInput = document.getElementById('expirationDateInput');
  const expirationTimeInput = document.getElementById('expirationTimeInput');

  if (!shortenForm) return;

  const { data: { session } } = await supabaseClient.auth.getSession();

  // Handle premium options visibility / interceptors
  if (session) {
    const customLock = document.getElementById('customAliasLock');
    const expiryLock = document.getElementById('expirationLock');
    if (customLock) customLock.style.display = 'none';
    if (expiryLock) expiryLock.style.display = 'none';

    // Toggle custom alias code input
    if (customCodeToggle) {
      customCodeToggle.addEventListener('change', () => {
        customCodeInput.style.display = customCodeToggle.checked ? 'block' : 'none';
        updateFormExtrasVisibility();
      });
    }

    // Toggle expiration input
    if (expirationToggle) {
      expirationToggle.addEventListener('change', () => {
        const show = expirationToggle.checked ? 'block' : 'none';
        expirationDateInput.style.display = show;
        expirationTimeInput.style.display = show;
        updateFormExtrasVisibility();
      });
    }
  } else {
    // Guest intercepts
    if (customCodeToggle) {
      customCodeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('🔒 Custom aliases are a premium feature. Please sign up to customize links.', 'warning');
      });
    }
    if (expirationToggle) {
      expirationToggle.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('🔒 Setting expiration dates is a premium feature. Please sign up to customize links.', 'warning');
      });
    }
  }

  function updateFormExtrasVisibility() {
    const showCustom = customCodeToggle?.checked;
    const showExpiry = expirationToggle?.checked;
    formExtras.style.display = (showCustom || showExpiry) ? 'flex' : 'none';
  }

  // Guest links check at initialization
  const guestLinks = JSON.parse(localStorage.getItem('shortlink_guest_links')) || [];
  if (!session && guestLinks.length >= 3) {
    const limitBanner = document.getElementById('guestLimitBanner');
    if (limitBanner) limitBanner.style.display = 'flex';
    
    const urlInput = document.getElementById('urlInput');
    const shortenBtn = document.getElementById('shortenBtn');
    if (urlInput) urlInput.disabled = true;
    if (shortenBtn) shortenBtn.disabled = true;
  }

  // Submit shortener form
  shortenForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const urlInput = document.getElementById('urlInput');
    const shortenBtn = document.getElementById('shortenBtn');
    const btnText = shortenBtn.querySelector('.btn-text');
    const btnLoader = shortenBtn.querySelector('.btn-loader');

    const url = urlInput.value.trim();
    if (!url) return;

    // Guest limits double-check
    const activeGuestLinks = JSON.parse(localStorage.getItem('shortlink_guest_links')) || [];
    if (!session && activeGuestLinks.length >= 3) {
      showToast('⚠️ Guest limit of 3 temporary links reached. Please sign up to continue.', 'error');
      return;
    }

    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    shortenBtn.disabled = true;

    try {
      let result;
      const useCustom = customCodeToggle?.checked && customCodeInput?.value.trim();
      const expiresAt = expirationToggle?.checked && expirationDateInput?.value
        ? new Date(`${expirationDateInput.value}T${expirationTimeInput?.value || '23:59'}:00`).toISOString()
        : null;

      if (useCustom) {
        result = await apiRequest(`${API_BASE}/custom`, {
          method: 'POST',
          body: JSON.stringify({
            url,
            custom_code: customCodeInput.value.trim(),
            expires_at: expiresAt,
          }),
        });
      } else {
        result = await apiRequest(`${API_BASE}/shorten`, {
          method: 'POST',
          body: JSON.stringify({
            url,
            expires_at: expiresAt,
          }),
        });
      }

      // Record guest shortened link
      if (!session) {
        activeGuestLinks.push(result.data.short_code);
        localStorage.setItem('shortlink_guest_links', JSON.stringify(activeGuestLinks));
        
        if (activeGuestLinks.length >= 3) {
          const limitBanner = document.getElementById('guestLimitBanner');
          if (limitBanner) limitBanner.style.display = 'flex';
          if (urlInput) urlInput.disabled = true;
          if (shortenBtn) shortenBtn.disabled = true;
        }
      }

      displayResult(result.data, session);
      showToast('URL shortened successfully!', 'success');

      // Refresh numbers
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      if (!(!session && activeGuestLinks.length >= 3)) {
        shortenBtn.disabled = false;
      }
    }
  });

  loadStats();
}

/**
 * Display generated shorten result card
 */
function displayResult(data, session = null) {
  const resultCard = document.getElementById('resultCard');
  const resultShortUrl = document.getElementById('resultShortUrl');
  const resultOriginalUrl = document.getElementById('resultOriginalUrl');
  const resultQrCode = document.getElementById('resultQrCode');
  const copyBtn = document.getElementById('copyBtn');
  const downloadQr = document.getElementById('downloadQr');
  const qrLockOverlay = document.getElementById('qrLockOverlay');
  const guestUpgradeBanner = document.getElementById('guestUpgradeBanner');

  if (!resultCard) return;

  resultShortUrl.href = data.short_url;
  resultShortUrl.textContent = data.short_url;
  resultOriginalUrl.textContent = data.original_url;
  resultQrCode.src = data.qr_code;
  copyBtn.dataset.url = data.short_url;

  resultCard.style.display = 'block';

  // Copy button handler
  copyBtn.onclick = () => copyToClipboard(data.short_url);

  // Render lock indicators / conversion sections dynamically
  if (session) {
    if (qrLockOverlay) qrLockOverlay.style.display = 'none';
    if (guestUpgradeBanner) guestUpgradeBanner.style.display = 'none';
    if (downloadQr) {
      downloadQr.disabled = false;
      downloadQr.style.opacity = '1';
      downloadQr.onclick = () => downloadBase64Image(data.qr_code, `qr-${data.short_code}.png`);
    }
  } else {
    if (qrLockOverlay) qrLockOverlay.style.display = 'flex';
    if (guestUpgradeBanner) guestUpgradeBanner.style.display = 'block';
    if (downloadQr) {
      downloadQr.disabled = true;
      downloadQr.style.opacity = '0.5';
      downloadQr.onclick = (e) => {
        e.preventDefault();
        showToast('🔒 QR downloads require a free account.', 'warning');
      };
    }
  }
}

/**
 * Load global stats counts
 */
async function loadStats() {
  try {
    const result = await apiRequest(`${API_BASE}?limit=1`);
    const total = result.data?.pagination?.total || 0;

    animateCounter('statUrls', total);

    if (total > 0) {
      const allResult = await apiRequest(`${API_BASE}?limit=100`);
      const totalClicks = allResult.data?.urls?.reduce((sum, u) => sum + (u.click_count || 0), 0) || 0;
      animateCounter('statClicks', totalClicks);
    }
  } catch (err) {
    // Fail silently on public landing statistics
  }
}

/**
 * Animates counting numbers
 */
function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el || target === 0) {
    if (el) el.textContent = target;
    return;
  }

  let current = 0;
  const increment = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = current.toLocaleString();
    }
  }, 25);
}

function getPinnedLinks() {
  try {
    return JSON.parse(localStorage.getItem('pinned_links')) || [];
  } catch { return []; }
}

function setPinnedLinks(pinned) {
  localStorage.setItem('pinned_links', JSON.stringify(pinned));
}

function getFavoriteLinks() {
  try {
    return JSON.parse(localStorage.getItem('favorite_links')) || [];
  } catch { return []; }
}

function setFavoriteLinks(favs) {
  localStorage.setItem('favorite_links', JSON.stringify(favs));
}

window.togglePin = function(shortCode) {
  let pinned = getPinnedLinks();
  if (pinned.includes(shortCode)) {
    pinned = pinned.filter(c => c !== shortCode);
    showToast(`Unpinned /${shortCode}`, 'info');
  } else {
    pinned.push(shortCode);
    showToast(`Pinned /${shortCode}`, 'success');
  }
  setPinnedLinks(pinned);
  
  if (window.location.pathname === '/dashboard') {
    loadDashboardInsights();
  } else {
    loadUrls();
  }
};

window.toggleFavorite = function(shortCode) {
  let favs = getFavoriteLinks();
  if (favs.includes(shortCode)) {
    favs = favs.filter(c => c !== shortCode);
    showToast(`Removed /${shortCode} from Favorites`, 'info');
  } else {
    favs.push(shortCode);
    showToast(`Added /${shortCode} to Favorites`, 'success');
  }
  setFavoriteLinks(favs);
  
  if (window.location.pathname === '/dashboard') {
    loadDashboardInsights();
  } else {
    loadUrls();
  }
};

// ─── Smart Workspace Dashboard Handlers ───────────────

function initDashboardInsights() {
  loadDashboardInsights();

  // Raycast shortening bar submit handler
  const workspaceForm = document.getElementById('workspaceShortenForm');
  if (workspaceForm) {
    workspaceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const urlInput = document.getElementById('workspaceUrlInput');
      const customInput = document.getElementById('workspaceCustomInput');
      const submitBtn = document.getElementById('workspaceShortenBtn');
      
      const url = urlInput.value.trim();
      if (!url) return;
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      
      try {
        const body = { url };
        const customCode = customInput?.value.trim();
        if (customCode) {
          body.custom_code = customCode;
        }
        
        const endpoint = customCode ? `${API_BASE}/custom` : `${API_BASE}/shorten`;
        await apiRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(body)
        });
        
        urlInput.value = '';
        if (customInput) customInput.value = '';
        
        showToast('Link shortened in workspace!', 'success');
        loadDashboardInsights();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Shorten';
      }
    });
  }
}

async function loadDashboardInsights() {
  try {
    const result = await apiRequest(`${API_BASE}?page=1&limit=100&sort=click_count_desc`);
    const allUrls = result.data?.urls || [];
    const total = result.data?.pagination?.total || allUrls.length;

    const onboardingPanel = document.getElementById('workspaceOnboarding');
    const pinnedPanel = document.getElementById('pinnedLinksPanel');
    const gridSplit = document.getElementById('workspaceGridSplit');
    const activityPanel = document.getElementById('recentActivityPanel');

    if (total === 0) {
      // Show onboarding empty state
      if (onboardingPanel) onboardingPanel.style.display = 'block';
      if (pinnedPanel) pinnedPanel.style.display = 'none';
      if (gridSplit) gridSplit.style.display = 'none';
      if (activityPanel) activityPanel.style.display = 'none';

      // Set snippet metrics to clear placeholders
      const topPerformingVal = document.getElementById('topPerformingLinkVal');
      if (topPerformingVal) topPerformingVal.textContent = 'No links created';

      const trendingLinkVal = document.getElementById('trendingLinkVal');
      if (trendingLinkVal) trendingLinkVal.textContent = 'No links created';

      const activeCatalogVal = document.getElementById('activeCatalogVal');
      if (activeCatalogVal) activeCatalogVal.textContent = '0 links active';

      return;
    }

    // Otherwise show full active layout
    if (onboardingPanel) onboardingPanel.style.display = 'none';
    if (pinnedPanel) pinnedPanel.style.display = 'block';
    if (gridSplit) gridSplit.style.display = 'grid';
    if (activityPanel) activityPanel.style.display = 'block';

    // 1. Calculate and update Workspace Insight Snippets (Decision indicators)
    const activeCount = allUrls.filter((u) => u.is_active && (!u.expires_at || new Date(u.expires_at) > new Date())).length;
    
    // Top performing link details
    const mostPopular = allUrls[0];
    const topPerformingVal = document.getElementById('topPerformingLinkVal');
    if (topPerformingVal) {
      if (mostPopular && (mostPopular.click_count || 0) > 0) {
        topPerformingVal.innerHTML = `<a href="${mostPopular.short_url}" target="_blank" class="text-accent">/${mostPopular.short_code}</a> (${mostPopular.click_count} clicks)`;
      } else {
        topPerformingVal.textContent = 'No traffic logged';
      }
    }
    
    // Trending Link: recently visited link with clicks
    const visitedLinks = [...allUrls].filter(u => u.last_visited && u.click_count > 0);
    visitedLinks.sort((a, b) => new Date(b.last_visited) - new Date(a.last_visited));
    const trendingLink = visitedLinks[0];
    const trendingLinkVal = document.getElementById('trendingLinkVal');
    if (trendingLinkVal) {
      if (trendingLink) {
        trendingLinkVal.innerHTML = `<a href="${trendingLink.short_url}" target="_blank" class="text-accent">/${trendingLink.short_code}</a> (+24% traffic)`;
      } else {
        trendingLinkVal.textContent = 'No active trends';
      }
    }
    
    // Active catalog rate
    const activeCatalogVal = document.getElementById('activeCatalogVal');
    if (activeCatalogVal) {
      const rate = total > 0 ? Math.round((activeCount / total) * 100) : 100;
      activeCatalogVal.textContent = `${rate}% active redirect rate`;
    }

    // 2. Filter local items
    const pinnedCodes = getPinnedLinks();
    const favoriteCodes = getFavoriteLinks();

    const pinnedUrls = allUrls.filter(u => pinnedCodes.includes(u.short_code));
    const favoriteUrls = allUrls.filter(u => favoriteCodes.includes(u.short_code));
    
    pinnedUrls.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    favoriteUrls.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Render lists
    renderWorkspaceList('pinnedLinksList', pinnedUrls, 'No pinned links. Click the Pin icon in the Link Manager to pin key targets.', true);
    renderWorkspaceList('favoriteLinksList', favoriteUrls, 'No starred links. Click the Star icon in actions to add favorites.', false);

    // Render top 5 visited
    const top5Visited = [...allUrls].slice(0, 5);
    renderWorkspaceList('topVisitedLinksList', top5Visited, 'No links visited yet.', false);

    // 3. Render Activity Logs feed
    const activityList = document.getElementById('recentActivityList');
    if (activityList) {
      const events = [];
      allUrls.forEach(u => {
        events.push({
          type: 'create',
          text: `Vanity path <span style="font-weight: 700; color: var(--clr-accent);">/${u.short_code}</span> created`,
          time: u.created_at,
          class: 'act-create',
          icon: '🆕'
        });
        if (u.last_visited) {
          events.push({
            type: 'visit',
            text: `Vanity path <span style="font-weight: 700; color: var(--clr-accent);">/${u.short_code}</span> processed redirect`,
            time: u.last_visited,
            class: 'act-visit',
            icon: '⚡'
          });
        }
        if (u.expires_at && new Date(u.expires_at) <= new Date()) {
          events.push({
            type: 'expired',
            text: `Vanity path <span style="font-weight: 700; color: var(--clr-accent);">/${u.short_code}</span> has expired`,
            time: u.expires_at,
            class: 'act-expired',
            icon: '⏳'
          });
        }
      });

      // Sort DESC
      events.sort((a, b) => new Date(b.time) - new Date(a.time));
      const recentEvents = events.slice(0, 5);

      if (recentEvents.length > 0) {
        activityList.innerHTML = `
          <div class="activity-list" style="max-height: 250px;">
            ${recentEvents.map(ev => `
              <div class="activity-item ${ev.class}">
                <div style="font-size: 1.1rem; line-height: 1;">${ev.icon}</div>
                <div class="activity-content">
                  <span class="activity-text">${ev.text}</span>
                  <span class="activity-time">${formatRelativeDate(ev.time)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        activityList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 1rem 0; font-size: 0.9rem;">No recent activities.</p>`;
      }
    }

  } catch (err) {
    console.error('Failed to load workspace:', err);
    showToast('Failed to load workspace details: ' + err.message, 'error');

    // Clean up stuck "Loading..." state elements
    const topPerformingVal = document.getElementById('topPerformingLinkVal');
    if (topPerformingVal) topPerformingVal.textContent = 'Error loading';
    
    const trendingLinkVal = document.getElementById('trendingLinkVal');
    if (trendingLinkVal) trendingLinkVal.textContent = 'Error loading';
    
    const activeCatalogVal = document.getElementById('activeCatalogVal');
    if (activeCatalogVal) activeCatalogVal.textContent = 'Error loading';

    const activityList = document.getElementById('recentActivityList');
    if (activityList) activityList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 1rem 0; font-size: 0.9rem; color: var(--clr-danger);">Failed to load activity feed.</p>`;
  }
}

function renderWorkspaceList(containerId, list, emptyMsg, isPinnedList = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align: center; padding: 1.5rem 0; font-size: 0.9rem;">${emptyMsg}</p>`;
    return;
  }

  const pinned = getPinnedLinks();
  const favs = getFavoriteLinks();

  container.innerHTML = `
    <div class="workspace-link-list">
      ${list.map(u => {
        const isPinned = pinned.includes(u.short_code);
        const isFav = favs.includes(u.short_code);
        
        return `
          <div class="workspace-link-item">
            <div class="ws-link-info">
              <a href="${u.short_url}" target="_blank" class="ws-link-short">/${u.short_code}</a>
              <span class="ws-link-original" title="${u.original_url}">${truncateUrl(u.original_url, 40)}</span>
            </div>
            <div class="ws-link-actions">
              <span class="ws-badge-clicks">${u.click_count || 0} clicks</span>
              <button class="ws-btn-icon" title="Copy URL" onclick="copyToClipboard('${u.short_url}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
              <button class="ws-btn-icon" title="View QR" onclick="showQrModal('${u.short_url}', '${u.short_code}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button class="ws-btn-icon ${isPinned ? 'pinned' : ''}" title="${isPinned ? 'Unpin' : 'Pin'}" onclick="window.togglePin('${u.short_code}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-2-2h-3V3.5a1.5 1.5 0 0 0-3 0V6H7a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4z"></path><line x1="12" y1="14" x2="12" y2="21"></line></svg>
              </button>
              <button class="ws-btn-icon ${isFav ? 'active' : ''}" title="${isFav ? 'Unstar' : 'Star'}" onclick="window.toggleFavorite('${u.short_code}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </button>
              <button class="ws-btn-icon ws-action-delete" title="Delete" onclick="window.handleWorkspaceDelete('${u.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.handleWorkspaceDelete = async function(id) {
  if (!confirm('Are you sure you want to delete this short link? All redirects using this code will break immediately.')) {
    return;
  }

  try {
    await apiRequest(`${API_BASE}/${id}`, { method: 'DELETE' });
    showToast('Short link deleted from workspace!', 'success');
    loadDashboardInsights();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ─── Link Manager Console Handlers ────────────────────

let consoleFilter = 'all';
let consoleSort = 'created_at_desc';
let selectedUrls = [];

function initConsole() {
  const urlsTableBody = document.getElementById('urlsTableBody');
  if (!urlsTableBody) return;

  selectedUrls = [];
  loadUrls();

  // Search input change handler with debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        currentPage = 1;
        if (query.length > 0) {
          searchUrls(query);
        } else {
          loadUrls();
        }
      }, 400);
    });
  }

  // Filter dropdown
  const filterStatus = document.getElementById('filterStatus');
  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      consoleFilter = e.target.value;
      currentPage = 1;
      selectedUrls = [];
      updateBulkActionsBar();
      loadUrls();
    });
  }

  // Sort dropdown
  const sortField = document.getElementById('sortField');
  if (sortField) {
    sortField.addEventListener('change', (e) => {
      consoleSort = e.target.value;
      currentPage = 1;
      selectedUrls = [];
      updateBulkActionsBar();
      loadUrls();
    });
  }

  // Select All Checkbox
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.row-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        const id = cb.dataset.id;
        const shortUrl = cb.dataset.short;
        if (e.target.checked) {
          if (!selectedUrls.some(item => item.id === id)) {
            selectedUrls.push({ id, shortUrl });
          }
        } else {
          selectedUrls = selectedUrls.filter(item => item.id !== id);
        }
      });
      updateBulkActionsBar();
    });
  }

  // Bulk Copy Action
  document.getElementById('bulkCopyBtn')?.addEventListener('click', () => {
    if (selectedUrls.length === 0) return;
    const linksText = selectedUrls.map(item => item.shortUrl).join('\n');
    copyToClipboard(linksText);
    showToast(`Copied ${selectedUrls.length} links to clipboard!`, 'success');
  });

  // Bulk Export Action
  document.getElementById('bulkExportBtn')?.addEventListener('click', () => {
    if (selectedUrls.length === 0) return;
    exportSelectedUrlsCSV();
  });

  // Bulk Delete Action
  document.getElementById('bulkDeleteBtn')?.addEventListener('click', async () => {
    if (selectedUrls.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedUrls.length} selected links? This action cannot be undone.`)) {
      return;
    }
    
    const deleteBtn = document.getElementById('bulkDeleteBtn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    let successCount = 0;
    for (const item of selectedUrls) {
      try {
        await apiRequest(`${API_BASE}/${item.id}`, { method: 'DELETE' });
        successCount++;
      } catch (err) {
        console.error(`Failed to delete link ${item.id}:`, err);
      }
    }
    
    showToast(`Successfully deleted ${successCount} links!`, 'success');
    selectedUrls = [];
    updateBulkActionsBar();
    
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    
    loadUrls();
  });

  // Refresh data trigger
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (filterStatus) filterStatus.value = 'all';
      if (sortField) sortField.value = 'created_at_desc';
      consoleFilter = 'all';
      consoleSort = 'created_at_desc';
      currentPage = 1;
      selectedUrls = [];
      updateBulkActionsBar();
      
      const selectAllCheckbox = document.getElementById('selectAllCheckbox');
      if (selectAllCheckbox) selectAllCheckbox.checked = false;
      
      loadUrls();
      showToast('Catalog refreshed', 'info');
    });
  }

  // Add Link modal form submit
  const createForm = document.getElementById('createForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleCreate();
    });
  }

  // Edit Link modal form submit
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleEdit();
    });
  }

  // Table pagination buttons
  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadUrls();
    }
  });

  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadUrls();
    }
  });
}

function updateBulkActionsBar() {
  const bar = document.getElementById('bulkActionsBar');
  const countEl = document.getElementById('selectedCount');
  if (!bar || !countEl) return;
  
  if (selectedUrls.length > 0) {
    countEl.textContent = selectedUrls.length;
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
  }
}

function exportSelectedUrlsCSV() {
  const headers = ['ID', 'Short Code', 'Short URL', 'Destination URL', 'Clicks', 'Created At'];
  const csvRows = [headers];
  
  const rowCheckboxes = document.querySelectorAll('.row-checkbox:checked');
  rowCheckboxes.forEach(cb => {
    const row = cb.closest('tr');
    if (row) {
      const code = row.querySelector('.table-short-url')?.textContent || '';
      const dest = row.querySelector('.table-original-url')?.getAttribute('title') || '';
      const clicks = row.querySelector('.table-clicks')?.textContent || '0';
      const createdStr = row.querySelector('td:nth-child(6)')?.getAttribute('title') || '';
      
      csvRows.push([
        cb.dataset.id,
        code,
        cb.dataset.short,
        `"${dest.replace(/"/g, '""')}"`,
        clicks,
        createdStr
      ]);
    }
  });
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + csvRows.map(e => e.join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `shortlink_pro_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV export downloaded!', 'success');
}

async function loadUrls() {
  const tableBody = document.getElementById('urlsTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableCard = document.querySelector('.table-card');
  const pagination = document.getElementById('pagination');

  tableBody.innerHTML = `
    <tr class="table-loading">
      <td colspan="7">
        <div class="loading-state">
          <div class="spinner-lg"></div>
          <p>Loading URLs from your catalog...</p>
        </div>
      </td>
    </tr>
  `;
  tableCard.style.display = 'block';
  emptyState.style.display = 'none';

  try {
    const result = await apiRequest(`${API_BASE}?page=${currentPage}&limit=10&sort=${consoleSort}&filter=${consoleFilter}`);
    const { urls, pagination: pag } = result.data;

    totalPages = pag.totalPages;

    if (urls.length === 0 && currentPage === 1) {
      tableCard.style.display = 'none';
      emptyState.style.display = 'block';
      pagination.style.display = 'none';
      return;
    }

    renderUrlTable(urls);
    updatePagination(pag);
  } catch (err) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="loading-state">
            <p style="color: var(--clr-danger);">${err.message}</p>
            <button class="btn btn-ghost btn-sm" onclick="loadUrls()">Retry Request</button>
          </div>
        </td>
      </tr>
    `;
  }
}

async function searchUrls(query) {
  const tableBody = document.getElementById('urlsTableBody');

  tableBody.innerHTML = `
    <tr class="table-loading">
      <td colspan="7">
        <div class="loading-state">
          <div class="spinner-lg"></div>
          <p>Searching catalog...</p>
        </div>
      </td>
    </tr>
  `;

  try {
    const result = await apiRequest(`${API_BASE}/search?q=${encodeURIComponent(query)}&page=1&limit=10&sort=${consoleSort}&filter=${consoleFilter}`);
    const { urls, pagination: pag } = result.data;

    if (urls.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="loading-state">
              <p>No matches found for "${query}"</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    renderUrlTable(urls);
    totalPages = pag.totalPages;
    updatePagination(pag);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderUrlTable(urls) {
  const tableBody = document.getElementById('urlsTableBody');
  const tableCard = document.querySelector('.table-card');
  const emptyState = document.getElementById('emptyState');

  tableCard.style.display = 'block';
  emptyState.style.display = 'none';

  const pinned = getPinnedLinks();
  const favs = getFavoriteLinks();

  tableBody.innerHTML = urls.map((url) => {
    const isExpired = url.expires_at && new Date(url.expires_at) < new Date();
    let status, statusClass;
    if (isExpired) {
      status = 'Expired';
      statusClass = 'status-expired';
    } else if (url.is_active) {
      status = 'Active';
      statusClass = 'status-active';
    } else {
      status = 'Inactive';
      statusClass = 'status-inactive';
    }

    const isPinned = pinned.includes(url.short_code);
    const isFav = favs.includes(url.short_code);
    const isChecked = selectedUrls.some(item => item.id === url.id);

    return `
      <tr>
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="row-checkbox console-checkbox" data-id="${url.id}" data-short="${url.short_url}" ${isChecked ? 'checked' : ''} onchange="window.handleRowCheckboxChange(this)">
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button class="ws-btn-icon ${isPinned ? 'pinned' : ''}" title="${isPinned ? 'Unpin from workspace' : 'Pin to workspace'}" onclick="window.togglePin('${url.short_code}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-2-2h-3V3.5a1.5 1.5 0 0 0-3 0V6H7a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4z"></path><line x1="12" y1="14" x2="12" y2="21"></line></svg>
            </button>
            <button class="ws-btn-icon ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" onclick="window.toggleFavorite('${url.short_code}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
            <a href="${url.short_url}" target="_blank" class="table-short-url">${url.short_code}</a>
          </div>
        </td>
        <td>
          <span class="table-original-url" title="${url.original_url}">${truncateUrl(url.original_url, 35)}</span>
        </td>
        <td><span class="table-clicks">${url.click_count || 0}</span></td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td title="${formatDate(url.created_at)}">${formatRelativeDate(url.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn" title="Copy short URL" onclick="copyToClipboard('${url.short_url}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="action-btn" title="View QR Code" onclick="showQrModal('${url.short_url}', '${url.short_code}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
            <a href="/analytics/${url.short_code}" class="action-btn" title="View Analytics">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
            </a>
            <button class="action-btn" title="Edit" onclick="showEditModal('${url.id}', '${url.original_url.replace(/'/g, "\\'")}', '${url.expires_at || ''}', ${url.is_active})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn action-delete" title="Delete" onclick="handleDelete('${url.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.handleRowCheckboxChange = function(cb) {
  const id = cb.dataset.id;
  const shortUrl = cb.dataset.short;
  if (cb.checked) {
    if (!selectedUrls.some(item => item.id === id)) {
      selectedUrls.push({ id, shortUrl });
    }
  } else {
    selectedUrls = selectedUrls.filter(item => item.id !== id);
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
  }
  updateBulkActionsBar();
};

function updatePagination(pag) {
  const pagination = document.getElementById('pagination');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const info = document.getElementById('paginationInfo');

  if (!pagination || !prevBtn || !nextBtn || !info) return;

  if (pag.totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';
  prevBtn.disabled = pag.page <= 1;
  nextBtn.disabled = pag.page >= pag.totalPages;
  info.textContent = `Page ${pag.page} of ${pag.totalPages} (${pag.total} total)`;
}

/**
 * Update numbers displays
 */
function updateDashStats(total, clicks, active, expired) {
  const totalEl = document.getElementById('dashTotalUrls');
  const clicksEl = document.getElementById('dashTotalClicks');
  const activeEl = document.getElementById('dashActiveUrls');
  const expiredEl = document.getElementById('dashExpiredUrls');
  const qrEl = document.getElementById('dashQrCodes');

  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (clicksEl) clicksEl.textContent = clicks.toLocaleString();
  if (activeEl) activeEl.textContent = active.toLocaleString();
  if (expiredEl && expired !== undefined) expiredEl.textContent = expired.toLocaleString();
  if (qrEl) qrEl.textContent = total.toLocaleString();
}

/**
 * Compute aggregate stats from list payload
 */
async function updateDashStatsFromUrls(currentUrls, total) {
  try {
    // Request up to 100 links to compute complete click stats
    const result = await apiRequest(`${API_BASE}?page=1&limit=100`);
    const allUrls = result.data?.urls || currentUrls;
    const totalClicks = allUrls.reduce((sum, u) => sum + (u.click_count || 0), 0);
    const activeCount = allUrls.filter((u) => u.is_active && (!u.expires_at || new Date(u.expires_at) > new Date())).length;
    const expiredCount = allUrls.filter((u) => u.expires_at && new Date(u.expires_at) <= new Date()).length;

    updateDashStats(total, totalClicks, activeCount, expiredCount);
  } catch (err) {
    // Fall back to displaying calculations derived from current page only
    const clicks = currentUrls.reduce((sum, u) => sum + (u.click_count || 0), 0);
    const active = currentUrls.filter((u) => u.is_active).length;
    const expired = currentUrls.filter((u) => u.expires_at && new Date(u.expires_at) <= new Date()).length;
    updateDashStats(total, clicks, active, expired);
  }
}

/**
 * Create a new short link from dashboard modal
 */
async function handleCreate() {
  const urlInput = document.getElementById('modalUrl');
  const customCode = document.getElementById('modalCustomCode');
  const expirationDate = document.getElementById('modalExpirationDate');
  const expirationTime = document.getElementById('modalExpirationTime');
  const submitBtn = document.getElementById('createSubmitBtn');

  const url = urlInput.value.trim();
  if (!url) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating link...';

  try {
    const body = { url };

    if (customCode?.value.trim()) {
      body.custom_code = customCode.value.trim();
    }
    if (expirationDate?.value) {
      // Combine date + time (default to 23:59 if no time set)
      const timePart = expirationTime?.value || '23:59';
      const localDate = new Date(`${expirationDate.value}T${timePart}:00`);
      body.expires_at = localDate.toISOString();
    }

    const endpoint = body.custom_code ? `${API_BASE}/custom` : `${API_BASE}/shorten`;
    await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Close and reset
    document.getElementById('createModal').classList.remove('active');
    urlInput.value = '';
    if (customCode) customCode.value = '';
    if (expirationDate) expirationDate.value = '';
    if (expirationTime) expirationTime.value = '';

    showToast('Link shortened successfully!', 'success');
    loadUrls();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Link';
  }
}

/**
 * Open edit modal preloaded with selected link data
 */
function showEditModal(id, originalUrl, expiresAt, isActive) {
  document.getElementById('editId').value = id;
  document.getElementById('editUrl').value = originalUrl;
  document.getElementById('editActive').checked = isActive;

  const editDateEl = document.getElementById('editExpirationDate');
  const editTimeEl = document.getElementById('editExpirationTime');

  if (expiresAt) {
    // Convert to local time components for the date/time inputs
    const date = new Date(expiresAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    editDateEl.value = `${year}-${month}-${day}`;
    editTimeEl.value = `${hours}:${minutes}`;
  } else {
    editDateEl.value = '';
    editTimeEl.value = '';
  }

  document.getElementById('editModal').classList.add('active');
}

/**
 * Update modified link on backend
 */
async function handleEdit() {
  const id = document.getElementById('editId').value;
  const originalUrl = document.getElementById('editUrl').value.trim();
  const editDate = document.getElementById('editExpirationDate').value;
  const editTime = document.getElementById('editExpirationTime').value;
  const isActive = document.getElementById('editActive').checked;
  const submitBtn = document.getElementById('editSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving changes...';

  try {
    const body = {
      original_url: originalUrl,
      is_active: isActive,
    };

    if (editDate) {
      // Combine date + time (default to 23:59 if no time set)
      const timePart = editTime || '23:59';
      // Build a local date string and convert to ISO
      const localDate = new Date(`${editDate}T${timePart}:00`);
      body.expires_at = localDate.toISOString();
    } else {
      body.expires_at = null; // Clear expiration if unset
    }

    await apiRequest(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    document.getElementById('editModal').classList.remove('active');
    showToast('URL updated successfully!', 'success');
    loadUrls();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
  }
}

/**
 * Delete a link record
 */
async function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this short link? All redirects using this code will break immediately.')) {
    return;
  }

  try {
    await apiRequest(`${API_BASE}/${id}`, { method: 'DELETE' });
    showToast('Short link deleted!', 'success');
    loadUrls();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Display QR code preview overlay
 */
async function showQrModal(shortUrl, shortCode) {
  const modal = document.getElementById('qrModal');
  const qrImg = document.getElementById('qrModalImage');
  const qrUrl = document.getElementById('qrModalUrl');
  const qrDownload = document.getElementById('qrDownloadBtn');

  try {
    const result = await apiRequest(`${API_BASE}/analytics/${shortCode}`);
    qrImg.src = result.data.qr_code;
    qrUrl.textContent = shortUrl;

    qrDownload.onclick = () => downloadBase64Image(result.data.qr_code, `qr-${shortCode}.png`);

    modal.classList.add('active');
  } catch (err) {
    showToast('Failed to load QR code: ' + err.message, 'error');
  }
}

// ─── Analytics Page Handlers ──────────────────────────

function initAnalyticsPage() {
  if (typeof shortCode === 'undefined') return;
  loadAnalytics(shortCode);
}

/**
 * Fetch and fill analytics data elements
 */
async function loadAnalytics(code) {
  const loading = document.getElementById('analyticsLoading');
  const content = document.getElementById('analyticsContent');

  try {
    const result = await apiRequest(`${API_BASE}/analytics/${code}`);
    const data = result.data;

    animateCounter('analyticsClicks', data.click_count || 0);
    
    const createdEl = document.getElementById('analyticsCreated');
    createdEl.textContent = formatRelativeDate(data.created_at);
    createdEl.title = formatDate(data.created_at);

    const lastVisitEl = document.getElementById('analyticsLastVisit');
    lastVisitEl.textContent = formatRelativeDate(data.last_visited);
    lastVisitEl.title = formatDate(data.last_visited);

    const statusEl = document.getElementById('analyticsStatus');
    if (data.is_expired) {
      statusEl.textContent = 'Expired';
      statusEl.style.color = 'var(--clr-warning)';
    } else if (data.is_active) {
      statusEl.textContent = 'Active';
      statusEl.style.color = 'var(--clr-success)';
    } else {
      statusEl.textContent = 'Inactive';
      statusEl.style.color = 'var(--clr-danger)';
    }

    document.getElementById('analyticsShortUrl').textContent = data.short_url;
    document.getElementById('analyticsVisitBtn').href = data.short_url;
    document.getElementById('analyticsCopyBtn').onclick = () => copyToClipboard(data.short_url);

    document.getElementById('analyticsCode').textContent = data.short_code;
    
    const originalLink = document.getElementById('analyticsOriginal');
    originalLink.href = data.original_url;
    originalLink.textContent = truncateUrl(data.original_url, 60);
    
    document.getElementById('analyticsCreatedFull').textContent = formatDate(data.created_at);
    document.getElementById('analyticsUpdated').textContent = formatDate(data.updated_at);
    document.getElementById('analyticsExpires').textContent = data.expires_at ? formatDate(data.expires_at) : 'Never';

    // QR Image
    document.getElementById('analyticsQr').src = data.qr_code;
    document.getElementById('analyticsQrDownload').onclick = () =>
      downloadBase64Image(data.qr_code, `qr-${data.short_code}.png`);

    loading.style.display = 'none';
    content.style.display = 'block';
  } catch (err) {
    loading.innerHTML = `
      <p style="color: var(--clr-danger); margin-bottom: 1rem;">Failed to fetch analytics: ${err.message}</p>
      <a href="/dashboard" class="btn btn-ghost btn-sm">Return to Dashboard</a>
    `;
  }
}

// ─── Modal & Navigation UI Setup ─────────────────────

// Close overlay on background click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Close overlay on Escape keypress
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach((modal) => {
      modal.classList.remove('active');
    });
  }
});

// Mobile menu toggling
const navToggle = document.getElementById('navToggle');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    if (links) {
      links.classList.toggle('nav-open');
    }
  });
}

// OTP Error Message Helper — converts raw Supabase error messages into user-friendly text
function getOtpErrorMessage(err) {
  const raw = (err?.message || '').toLowerCase();
  if (raw.includes('token has expired') || raw.includes('otp has expired') || raw.includes('expired')) {
    return 'Your verification code has expired. Please request a new one.';
  }
  if (raw.includes('invalid') || raw.includes('otp_disabled') || raw.includes('incorrect')) {
    return 'Invalid verification code. Please check and try again.';
  }
  if (raw.includes('rate') || raw.includes('too many') || raw.includes('limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (raw.includes('user not found') || raw.includes('no user')) {
    return 'No account found with this email. Please sign up first.';
  }
  return err?.message || 'Verification failed. Please try again.';
}

// Shake animation for OTP container on incorrect code
function shakeOtpContainer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.classList.add('otp-shake');
  // Also briefly flash all inputs red
  const inputs = container.querySelectorAll('.otp-input');
  inputs.forEach(inp => inp.classList.add('otp-error'));
  setTimeout(() => {
    container.classList.remove('otp-shake');
    inputs.forEach(inp => inp.classList.remove('otp-error'));
  }, 600);
}

// Global OTP Input Utility
function setupOtpInputs(containerId, onComplete) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const inputs = container.querySelectorAll('.otp-input');
  const otpLength = inputs.length; // Dynamic: works with 6 or 8 inputs
  
  inputs.forEach((input, index) => {
    // Only allow numbers
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      
      if (e.target.value.length > 0) {
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else {
          // Check if all fields are filled
          const code = Array.from(inputs).map(inp => inp.value).join('');
          if (code.length === otpLength && typeof onComplete === 'function') {
            onComplete(code);
          }
        }
      }
    });
    
    // Backspace key focuses previous input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value) {
        if (index > 0) {
          inputs[index - 1].value = '';
          inputs[index - 1].focus();
        }
      }
    });
    
    // Paste support
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
      if (pasteData && pasteData.length === otpLength && /^\d+$/.test(pasteData)) {
        inputs.forEach((inp, idx) => {
          inp.value = pasteData[idx] || '';
        });
        inputs[otpLength - 1].focus();
        if (typeof onComplete === 'function') {
          onComplete(pasteData);
        }
      }
    });
  });
}

// Global Resend Timer State
let otpTimerInterval = null;
function startOtpTimer(btnId, textId, seconds = 60) {
  const btn = document.getElementById(btnId);
  const text = document.getElementById(textId);
  if (!btn || !text) return;
  
  btn.disabled = true;
  let remaining = seconds;
  text.textContent = `(${remaining}s)`;
  
  clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(otpTimerInterval);
      btn.disabled = false;
      text.textContent = '';
    } else {
      text.textContent = `(${remaining}s)`;
    }
  }, 1000);
}

function initLoginPage() {
  const loginPasswordPanel = document.getElementById('loginPasswordPanel');
  const loginOtpPanel = document.getElementById('loginOtpPanel');
  const tabPasswordBtn = document.getElementById('tabPasswordBtn');
  const tabOtpBtn = document.getElementById('tabOtpBtn');

  if (tabPasswordBtn && tabOtpBtn && loginPasswordPanel && loginOtpPanel) {
    tabPasswordBtn.addEventListener('click', () => {
      tabPasswordBtn.classList.add('active');
      tabOtpBtn.classList.remove('active');
      loginPasswordPanel.classList.add('active');
      loginOtpPanel.classList.remove('active');
    });

    tabOtpBtn.addEventListener('click', () => {
      tabOtpBtn.classList.add('active');
      tabPasswordBtn.classList.remove('active');
      loginOtpPanel.classList.add('active');
      loginPasswordPanel.classList.remove('active');
    });
  }

  // --- Password Login Form Handler ---
  const passwordForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('loginPassword');
  const toggleBtn = document.getElementById('togglePasswordBtn');

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleBtn.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = passwordInput.value;
      const submitBtn = document.getElementById('loginSubmitBtn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoader = submitBtn.querySelector('.btn-loader');

      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
      submitBtn.disabled = true;

      try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Logged in successfully!', 'success');
        window.location.href = '/dashboard';
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
      }
    });
  }

  // --- OTP Login Form Handlers ---
  const otpEmailForm = document.getElementById('loginOtpEmailForm');
  const otpCodeForm = document.getElementById('loginOtpCodeForm');
  const otpEmailStep = document.getElementById('loginOtpEmailStep');
  const otpCodeStep = document.getElementById('loginOtpCodeStep');
  const changeEmailLink = document.getElementById('changeLoginEmailLink');
  const resendBtn = document.getElementById('resendLoginOtpBtn');
  
  let loginEmailVal = '';

  const sendLoginOtp = async (email) => {
    const submitBtn = document.getElementById('btnLoginOtpSend');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');

    if (btnText && btnLoader && submitBtn) {
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
      submitBtn.disabled = true;
    }

    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false // Do not create accounts dynamically on Login
        }
      });
      if (error) throw error;

      loginEmailVal = email;
      document.getElementById('loginOtpSentMessage').textContent = `Verification code sent to ${email}.`;
      otpEmailStep.style.display = 'none';
      otpCodeStep.style.display = 'block';
      
      // Setup focus, paste and verification completion handlers
      setupOtpInputs('loginOtpContainer', async (code) => {
        await verifyLoginOtp(code);
      });
      startOtpTimer('resendLoginOtpBtn', 'resendLoginTimerText', 60);
      showToast('Verification code sent!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send login code', 'error');
    } finally {
      if (btnText && btnLoader && submitBtn) {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
      }
    }
  };

  if (otpEmailForm) {
    otpEmailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginOtpEmail').value.trim();
      await sendLoginOtp(email);
    });
  }

  const verifyLoginOtp = async (code) => {
    const submitBtn = document.getElementById('btnLoginOtpVerify');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');

    if (btnText && btnLoader && submitBtn) {
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
      submitBtn.disabled = true;
    }

    try {
      const { error } = await supabaseClient.auth.verifyOtp({
        email: loginEmailVal,
        token: code,
        type: 'email'
      });
      if (error) throw error;

      showToast('Logged in successfully!', 'success');
      window.location.href = '/dashboard';
    } catch (err) {
      const msg = getOtpErrorMessage(err);
      showToast(msg, 'error');
      // Shake and clear OTP inputs on failure
      shakeOtpContainer('loginOtpContainer');
      document.querySelectorAll('#loginOtpContainer .otp-input').forEach(inp => inp.value = '');
      document.querySelector('#loginOtpContainer .otp-input')?.focus();
    } finally {
      if (btnText && btnLoader && submitBtn) {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
      }
    }
  };

  if (otpCodeForm) {
    otpCodeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputs = document.querySelectorAll('#loginOtpContainer .otp-input');
      const code = Array.from(inputs).map(inp => inp.value).join('');
      if (code.length < inputs.length) {
        showToast('Please enter the complete verification code', 'warning');
        shakeOtpContainer('loginOtpContainer');
        return;
      }
      await verifyLoginOtp(code);
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (loginEmailVal) {
        await sendLoginOtp(loginEmailVal);
      }
    });
  }

  if (changeEmailLink) {
    changeEmailLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearInterval(otpTimerInterval);
      otpCodeStep.style.display = 'none';
      otpEmailStep.style.display = 'block';
      document.querySelectorAll('#loginOtpContainer .otp-input').forEach(inp => inp.value = '');
    });
  }

  // Social Auth placeholder (Future Ready)
  document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
    showToast('Google login can be configured via Supabase dashboard.', 'info');
  });
  document.getElementById('githubLoginBtn')?.addEventListener('click', () => {
    showToast('GitHub login can be configured via Supabase dashboard.', 'info');
  });
}

function initSignupPage() {
  const step1 = document.getElementById('signupStep1');
  const step2 = document.getElementById('signupStep2');
  const step3 = document.getElementById('signupStep3');
  const step4 = document.getElementById('signupStep4');

  const form1 = document.getElementById('signupForm1');
  const form2 = document.getElementById('signupForm2');
  const form3 = document.getElementById('signupForm3');

  const resendBtn = document.getElementById('resendOtpBtn');
  const changeEmailLink = document.getElementById('changeEmailLink');

  let signupNameVal = '';
  let signupEmailVal = '';

  const setSignupStep = (stepNum) => {
    document.querySelectorAll('.auth-step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`signupStep${stepNum}`).classList.add('active');
  };

  // --- Step 1: Submit Name & Email to Send OTP ---
  const sendSignupOtp = async (name, email) => {
    const submitBtn = document.getElementById('btnSignup1');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');

    if (btnText && btnLoader && submitBtn) {
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
      submitBtn.disabled = true;
    }

    try {
      // Check if email is already registered before proceeding
      const { data: emailExists, error: checkError } = await supabaseClient.rpc('check_email_exists', {
        check_email: email
      });
      
      if (checkError) {
        console.warn('Email check failed:', checkError.message);
        // If the function doesn't exist yet, continue with signup (graceful fallback)
      } else if (emailExists === true) {
        showToast('This email is already registered. Please sign in instead.', 'error');
        if (btnText && btnLoader && submitBtn) {
          btnText.style.display = 'inline';
          btnLoader.style.display = 'none';
          submitBtn.disabled = false;
        }
        return;
      }

      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: name
          }
        }
      });
      if (error) throw error;

      signupNameVal = name;
      signupEmailVal = email;

      document.getElementById('otpSentMessage').textContent = `Verification code sent to ${email}.`;
      setSignupStep(2);

      setupOtpInputs('signupOtpContainer', async (code) => {
        await verifySignupOtp(code);
      });
      startOtpTimer('resendOtpBtn', 'resendTimerText', 60);
      showToast('Verification code sent!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send verification code', 'error');
    } finally {
      if (btnText && btnLoader && submitBtn) {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
      }
    }
  };

  if (form1) {
    form1.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      await sendSignupOtp(name, email);
    });
  }

  // --- Step 2: Verify OTP ---
  const verifySignupOtp = async (code) => {
    const submitBtn = document.getElementById('btnSignup2');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');

    if (btnText && btnLoader && submitBtn) {
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
      submitBtn.disabled = true;
    }

    try {
      const { error } = await supabaseClient.auth.verifyOtp({
        email: signupEmailVal,
        token: code,
        type: 'email'
      });
      if (error) throw error;

      clearInterval(otpTimerInterval);
      showToast('Email verified successfully!', 'success');
      setSignupStep(3);
      
      // Focus first password input
      setTimeout(() => document.getElementById('signupPassword')?.focus(), 100);
    } catch (err) {
      const msg = getOtpErrorMessage(err);
      showToast(msg, 'error');
      shakeOtpContainer('signupOtpContainer');
      document.querySelectorAll('#signupOtpContainer .otp-input').forEach(inp => inp.value = '');
      document.querySelector('#signupOtpContainer .otp-input')?.focus();
    } finally {
      if (btnText && btnLoader && submitBtn) {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
      }
    }
  };

  if (form2) {
    form2.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputs = document.querySelectorAll('#signupOtpContainer .otp-input');
      const code = Array.from(inputs).map(inp => inp.value).join('');
      if (code.length < inputs.length) {
        showToast('Please enter the complete verification code', 'warning');
        shakeOtpContainer('signupOtpContainer');
        return;
      }
      await verifySignupOtp(code);
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      if (signupNameVal && signupEmailVal) {
        await sendSignupOtp(signupNameVal, signupEmailVal);
      }
    });
  }

  if (changeEmailLink) {
    changeEmailLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearInterval(otpTimerInterval);
      setSignupStep(1);
      document.querySelectorAll('#signupOtpContainer .otp-input').forEach(inp => inp.value = '');
    });
  }

  // --- Step 3: Create Password & Password Strength ---
  const passwordInput = document.getElementById('signupPassword');
  const confirmPasswordInput = document.getElementById('signupConfirmPassword');
  const toggleBtn1 = document.getElementById('togglePasswordBtn1');
  const toggleBtn2 = document.getElementById('togglePasswordBtn2');

  if (toggleBtn1 && passwordInput) {
    toggleBtn1.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleBtn1.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

  if (toggleBtn2 && confirmPasswordInput) {
    toggleBtn2.addEventListener('click', () => {
      const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      confirmPasswordInput.setAttribute('type', type);
      toggleBtn2.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

  // Real-time password strength indicator
  const strengthWrapper = document.getElementById('passwordStrengthWrapper');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');

  if (passwordInput && strengthWrapper && strengthBar && strengthText) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (!val) {
        strengthWrapper.style.display = 'none';
        return;
      }
      strengthWrapper.style.display = 'block';
      let score = 0;
      
      if (val.length >= 6) score++;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      strengthBar.className = 'strength-bar';
      if (score <= 1) {
        strengthBar.classList.add('strength-weak');
        strengthText.textContent = 'Password Strength: Weak';
        strengthText.style.color = 'var(--clr-danger)';
      } else if (score <= 3) {
        strengthBar.classList.add('strength-medium');
        strengthText.textContent = 'Password Strength: Medium';
        strengthText.style.color = 'var(--clr-warning)';
      } else {
        strengthBar.classList.add('strength-strong');
        strengthText.textContent = 'Password Strength: Strong';
        strengthText.style.color = 'var(--clr-success)';
      }
    });
  }

  if (form3) {
    form3.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const submitBtn = document.getElementById('btnSignup3');
      const btnText = submitBtn?.querySelector('.btn-text');
      const btnLoader = submitBtn?.querySelector('.btn-loader');

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      if (btnText && btnLoader && submitBtn) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        submitBtn.disabled = true;
      }

      try {
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) throw error;

        // Switch to Step 4: Success, then send welcome email and redirect
setSignupStep(4);
// Send welcome email via backend route
(async () => {
  try {
    await fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signupEmailVal, name: signupNameVal })
    });
  } catch (e) {
    console.error('Welcome email error:', e);
  }
})();
setTimeout(() => {
  window.location.href = '/dashboard';
}, 2200);




      } catch (err) {
        showToast(err.message || 'Failed to set password', 'error');
        if (btnText && btnLoader && submitBtn) {
          btnText.style.display = 'inline';
          btnLoader.style.display = 'none';
          submitBtn.disabled = false;
        }
      }
    });
  }

  // Social Auth placeholder (Future Ready)
  document.getElementById('googleSignupBtn')?.addEventListener('click', () => {
    showToast('Google login can be configured via Supabase dashboard.', 'info');
  });
  document.getElementById('githubSignupBtn')?.addEventListener('click', () => {
    showToast('GitHub login can be configured via Supabase dashboard.', 'info');
  });
}

function initForgotPage() {
  const form = document.getElementById('forgotForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const submitBtn = document.getElementById('forgotSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    submitBtn.disabled = true;

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showToast('Password reset link sent! Check your inbox.', 'success');
      form.reset();
    } catch (err) {
      showToast(err.message || 'Failed to send recovery email', 'error');
    } finally {
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
}

function initResetPage() {
  const form = document.getElementById('resetForm');
  if (!form) return;

  const toggleBtn = document.getElementById('togglePasswordBtn');
  const passwordInput = document.getElementById('resetPassword');
  
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleBtn.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passwordInput.value;
    const submitBtn = document.getElementById('resetSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    submitBtn.disabled = true;

    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) throw error;
      showToast('Password updated successfully! Redirecting to login...', 'success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
}

// ─── Navbar & Session Management ──────────────────────

function renderNavbar(session) {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  const path = window.location.pathname;

  if (session) {
    const email = session.user.email;
    const userMetadata = session.user.user_metadata || {};
    const fullName = userMetadata.full_name || email.split('@')[0];
    const firstLetter = fullName.charAt(0).toUpperCase();

    navLinks.innerHTML = `
      <a href="/" class="nav-item ${path === '/' ? 'nav-active' : ''}" id="navHome">Home</a>
      <a href="/dashboard" class="nav-item ${path.startsWith('/dashboard') ? 'nav-active' : ''}" id="navDashboard">Workspace</a>
      <a href="/console" class="nav-item ${path.startsWith('/console') ? 'nav-active' : ''}" id="navConsole">Link Manager</a>
      <div class="profile-menu-container">
        <button class="profile-avatar-btn" id="profileMenuBtn" title="${email}">
          <span class="avatar-letter">${firstLetter}</span>
        </button>
        <div class="profile-dropdown" id="profileDropdown">
          <span class="dropdown-email" id="userEmailDisplay" style="font-weight: 700; margin-bottom: 0.25rem;">Hello, ${fullName} 👋</span>
          <span class="dropdown-email" style="font-size: 0.75rem; color: var(--clr-muted); margin-bottom: 0.5rem;">${email}</span>
          <hr class="dropdown-divider">
          <button class="dropdown-item" id="logoutBtn">Logout</button>
        </div>
      </div>
    `;

    // Dropdown toggling logic
    const menuBtn = document.getElementById('profileMenuBtn');
    const dropdown = document.getElementById('profileDropdown');
    
    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      dropdown.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent dropdown from closing immediately when clicking inside it
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('active');
      });
    }

    // Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await supabaseClient.auth.signOut();
          showToast('Logged out successfully', 'success');
          window.location.href = '/';
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

  } else {
    navLinks.innerHTML = `
      <a href="/" class="nav-item ${path === '/' ? 'nav-active' : ''}" id="navHome">Home</a>
      <a href="/login" class="nav-item ${path === '/login' ? 'nav-active' : ''}" id="navLogin">Login</a>
      <a href="/signup" class="btn btn-primary btn-sm ${path === '/signup' ? 'nav-active' : ''}" id="navSignupBtn">Sign Up</a>
    `;
  }
}

async function handleRouting() {
  const path = window.location.pathname;
  
  const isProtected = ['/dashboard', '/console'].includes(path) || path.startsWith('/analytics/');
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(path);
  
  // Hide body by default for protected pages to prevent flash of unauthenticated content
  if (isProtected) {
    document.body.style.display = 'none';
  }

  // Get active session
  const { data: { session } } = await supabaseClient.auth.getSession();

  // Render navbar accordingly
  renderNavbar(session);

  // Enforce session states
  if (isProtected && !session) {
    window.location.href = '/login';
    return;
  }

  if (isAuthPage && session) {
    window.location.href = '/dashboard';
    return;
  }

  // Restore page visibility
  if (isProtected) {
    document.body.style.display = 'flex';
  }

  // Invoke script hooks
  if (path === '/') {
    initLandingPage();
  } else if (path === '/dashboard') {
    initDashboardInsights();
  } else if (path === '/console') {
    initConsole();
  } else if (path.startsWith('/analytics/')) {
    initAnalyticsPage();
  } else if (path === '/login') {
    initLoginPage();
  } else if (path === '/signup') {
    initSignupPage();
  } else if (path === '/forgot-password') {
    initForgotPage();
  } else if (path === '/reset-password') {
    initResetPage();
  }
}

// ─── Routing Hook on Dom Load ─────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  handleRouting();
});
