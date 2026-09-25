/** Saison associative : du 1er septembre au 31 août. */
export function seasonOf(date = new Date()) {
  const y = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return { start: y, label: `${y} / ${y + 1}`, short: `${y}/${y + 1}`, validUntil: `${y + 1}-08-31` };
}
