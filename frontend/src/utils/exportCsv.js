export const exportToCsv = (filename, data) => {
  if (!data || !data.length) {
    alert('No data to export');
    return;
  }

  // Extract keys for CSV headers
  const keys = Object.keys(data[0]);
  
  // Format CSV content
  const csvContent = [
    keys.join(','), // First row is headers
    ...data.map(row => 
      keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        // Handle strings that contain quotes, commas, or newlines
        if (typeof cell === 'string') {
          cell = cell.replace(/"/g, '""'); // Escape double quotes
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  // Trigger file download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
