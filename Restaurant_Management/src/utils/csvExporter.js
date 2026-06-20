// Convert array of objects to CSV string
function exportToCsv(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h] !== null && row[h] !== undefined ? String(row[h]) : '';
      // Escape quotes
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = { exportToCsv };
