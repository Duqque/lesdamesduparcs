/** Saison associative : du 1er juillet au 30 juin. */
export function seasonOf(date = new Date()) {
  const y = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
  return { start: y, label: `${y} / ${y + 1}`, short: `${y}/${y + 1}`, validUntil: `${y + 1}-06-30` };
}
