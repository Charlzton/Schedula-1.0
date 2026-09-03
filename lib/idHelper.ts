export function generateLowestAvailableId(existingIds: string[], prefix: string, padLength: number = 3): string {
  const existingSet = new Set(
    existingIds
      .map(id => {
        if (!id) return null;
        const upper = String(id).toUpperCase();
        if (upper.startsWith(prefix.toUpperCase())) {
          const numStr = upper.slice(prefix.length);
          const num = parseInt(numStr, 10);
          return isNaN(num) ? null : num;
        }
        return null;
      })
      .filter((n): n is number => n !== null)
  );

  let n = 1;
  while (existingSet.has(n)) {
    n++;
  }
  return `${prefix}${String(n).padStart(padLength, '0')}`;
}
