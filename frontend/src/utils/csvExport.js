/**
 * Export JSON data array to CSV file and trigger download in browser.
 * @param {Array<Object>} data The dataset to export.
 * @param {Array<string>} headers The columns to output.
 * @param {string} filename The name of the downloaded file.
 */
export const exportToCSV = (data, headers, filename = 'export.csv') => {
  if (!data || !data.length) {
    console.error('No data available to export');
    return;
  }

  // Create header row
  const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');

  // Create rows
  const rows = data.map(item => {
    return headers.map(header => {
      // Find matching key in item
      const key = Object.keys(item).find(
        k => k.toLowerCase().replace(/_/g, '') === header.toLowerCase().replace(/_/g, '')
      ) || header;
      
      let val = item[key];
      
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      
      // Escape double quotes and surround with double quotes
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
