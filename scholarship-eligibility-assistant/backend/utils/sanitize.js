// Strips control characters and angle brackets, collapses whitespace, enforces a max length.
function cleanText(value, max = 200) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
module.exports = { cleanText };
