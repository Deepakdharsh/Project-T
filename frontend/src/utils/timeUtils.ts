// Convert 24-hour to 12-hour format with AM/PM
export const format12Hour = (hour24: number): string => {
  if (hour24 === 0) return '12:00 AM';
  if (hour24 === 12) return '12:00 PM';
  if (hour24 < 12) return `${hour24}:00 AM`;
  return `${hour24 - 12}:00 PM`;
};

// Convert 12-hour format to 24-hour
export const parse12Hour = (time12: string): number | null => {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (hours === 12) {
    hours = period === 'AM' ? 0 : 12;
  } else if (period === 'PM') {
    hours += 12;
  }
  
  return hours;
};

// Convert hour (0-23) and period (AM/PM) to 24-hour format
export const convertTo24Hour = (hour: number, period: 'AM' | 'PM'): number => {
  if (hour === 12) {
    return period === 'AM' ? 0 : 12;
  }
  if (period === 'PM' && hour !== 12) {
    return hour + 12;
  }
  return hour;
};

// Convert 24-hour to 12-hour with period
export const convertTo12Hour = (hour24: number): { hour: number; period: 'AM' | 'PM' } => {
  if (hour24 === 0) return { hour: 12, period: 'AM' };
  if (hour24 === 12) return { hour: 12, period: 'PM' };
  if (hour24 < 12) return { hour: hour24, period: 'AM' };
  return { hour: hour24 - 12, period: 'PM' };
};

// Format time range for display (12-hour)
export const formatTimeRange = (startHour: number, endHour: number): string => {
  const start = format12Hour(startHour);
  const end = format12Hour(endHour);
  return `${start} - ${end}`;
};

// Format time range for display (24-hour)
export const formatTimeRange24 = (startHour: number, endHour: number): string => {
  const start = `${startHour.toString().padStart(2, '0')}:00`;
  const end = `${endHour.toString().padStart(2, '0')}:00`;
  return `${start} - ${end}`;
};

// Validate time range
export const validateTimeRange = (startHour: number, endHour: number): string | null => {
  if (isNaN(startHour) || isNaN(endHour)) {
    return 'Start and end times are required';
  }
  
  if (startHour < 0 || startHour > 23) {
    return 'Start hour must be between 0 and 23';
  }
  
  if (endHour < 0 || endHour > 23) {
    return 'End hour must be between 0 and 23';
  }
  
  if (startHour >= endHour) {
    return 'End time must be after start time';
  }
  
  if (endHour - startHour > 12) {
    return 'Slot duration cannot exceed 12 hours';
  }
  
  return null;
};

