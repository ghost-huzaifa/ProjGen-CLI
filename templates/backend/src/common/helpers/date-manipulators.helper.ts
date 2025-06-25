//Input: '7d', '24h', '55m', '28s' => Output: milliseconds
export function convertToMilliseconds(duration: string): number {
  // Extract the numeric value and the unit (assumes the last character is the unit)
  const value = parseFloat(duration.slice(0, -1));
  const unit = duration.slice(-1);

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    case 's':
      return value * 1000;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

function timeStampMilliseconds(): number {
  return new Date().getTime();
}

export function unixTimestamp(): number {
  return Math.round(timeStampMilliseconds() / 1000);
}
