/**
 * Parse a standard CSV table (header row + data rows) into an array of objects.
 */
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, i) => {
      const val = values[i] || '';
      obj[header] = val !== '' && !isNaN(val) ? Number(val) : val;
    });
    return obj;
  });
}

/**
 * Parse a key-value CSV (stat,value format) into a single object.
 */
export function parseKeyValueCSV(text) {
  const lines = text.trim().split('\n');
  const obj = {};
  lines.slice(1).filter(line => line.trim()).forEach(line => {
    const [key, ...rest] = line.split(',');
    const val = rest.join(',').trim();
    obj[key.trim()] = val !== '' && !isNaN(val) ? Number(val) : val;
  });
  return obj;
}
