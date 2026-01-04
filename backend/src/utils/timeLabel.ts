export function format12Hour(hour24: number) {
  if (hour24 === 0) return '12:00 AM';
  if (hour24 === 12) return '12:00 PM';
  if (hour24 < 12) return `${hour24}:00 AM`;
  return `${hour24 - 12}:00 PM`;
}

export function formatTimeRange(startHour: number, endHour: number) {
  return `${format12Hour(startHour)} - ${format12Hour(endHour % 24)}`;
}


