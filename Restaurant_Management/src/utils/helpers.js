// Format currency
function formatCurrency(amount) {
  return `$${parseFloat(amount || 0).toFixed(2)}`;
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format time
function formatTime(timeStr) {
  if (!timeStr) return 'N/A';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// Format datetime
function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Status badge class
function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    served: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    occupied: 'bg-red-100 text-red-800',
    confirmed: 'bg-green-100 text-green-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

module.exports = { formatCurrency, formatDate, formatTime, formatDateTime, getStatusColor };
