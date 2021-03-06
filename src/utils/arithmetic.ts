export function average(data: string[], decimalPlaces = 3): number {
  if (data.length === 0) return -1;
  const sum = data.reduce((acc, curr) => acc + parseInt(curr, 10), 0);
  const avg = sum / data.length;
  const pow10 = 10 ** decimalPlaces;
  const saltedAvg = avg * pow10 * (1 + Number.EPSILON);
  return Math.round(saltedAvg) / pow10;
}
