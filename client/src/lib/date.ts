import {
  format,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  isToday,
  isYesterday,
  isTomorrow,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  isAfter,
  isBefore,
  isEqual,
  min,
  max,
} from "date-fns";

// Date formatting utilities
export const dateUtils = {
  // Format dates
  format: (date: Date | string, formatString: string = "PPP") => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatString);
  },

  // Format relative time (e.g., "2 hours ago")
  formatRelative: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  },

  // Format relative date (e.g., "yesterday at 2:30 PM")
  formatRelativeDate: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return formatRelative(dateObj, new Date());
  },

  // Check if date is valid
  isValid: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return isValid(dateObj);
  },

  // Date comparison helpers
  isToday: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return isToday(dateObj);
  },

  isYesterday: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return isYesterday(dateObj);
  },

  isTomorrow: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return isTomorrow(dateObj);
  },

  // Date range helpers
  startOfDay: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return startOfDay(dateObj);
  },

  endOfDay: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return endOfDay(dateObj);
  },

  startOfWeek: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return startOfWeek(dateObj);
  },

  endOfWeek: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return endOfWeek(dateObj);
  },

  startOfMonth: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return startOfMonth(dateObj);
  },

  endOfMonth: (date: Date | string) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return endOfMonth(dateObj);
  },

  // Date arithmetic
  addDays: (date: Date | string, amount: number) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return addDays(dateObj, amount);
  },

  addWeeks: (date: Date | string, amount: number) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return addWeeks(dateObj, amount);
  },

  addMonths: (date: Date | string, amount: number) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return addMonths(dateObj, amount);
  },

  addYears: (date: Date | string, amount: number) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return addYears(dateObj, amount);
  },

  subDays: (date: Date | string, amount: number) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return subDays(dateObj, amount);
  },

  subWeeks: (date: Date | string, amount: number) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return subWeeks(dateObj, amount);
  },

  subMonths: (date: Date | string, amount: number) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return subMonths(dateObj, amount);
  },

  subYears: (date: Date | string, amount: number) => {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return subYears(dateObj, amount);
  },

  // Date difference calculations
  differenceInDays: (dateLeft: Date | string, dateRight: Date | string) => {
    const left = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
    const right = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
    return differenceInDays(left, right);
  },

  differenceInWeeks: (dateLeft: Date | string, dateRight: Date | string) => {
    const left = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
    const right = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
    return differenceInWeeks(left, right);
  },

  differenceInMonths: (dateLeft: Date | string, dateRight: Date | string) => {
    const left = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
    const right = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
    return differenceInMonths(left, right);
  },

  differenceInYears: (dateLeft: Date | string, dateRight: Date | string) => {
    const left = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
    const right = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
    return differenceInYears(left, right);
  },

  // Date comparison
  isAfter: (dateLeft: Date | string, dateRight: Date | string) => {
    const left = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
    const right = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
    return isAfter(left, right);
  },

  isBefore: (dateLeft: Date | string, dateRight: Date | string) => {
    const left = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
    const right = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
    return isBefore(left, right);
  },

  isEqual: (dateLeft: Date | string, dateRight: Date | string) => {
    const left = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
    const right = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
    return isEqual(left, right);
  },

  // Min/Max dates
  min: (...dates: (Date | string)[]) => {
    const dateObjs = dates.map(date => typeof date === "string" ? parseISO(date) : date);
    return min(dateObjs);
  },

  max: (...dates: (Date | string)[]) => {
    const dateObjs = dates.map(date => typeof date === "string" ? parseISO(date) : date);
    return max(dateObjs);
  },
};

// Common date format strings
export const dateFormats = {
  short: "MMM dd, yyyy",
  long: "MMMM dd, yyyy",
  time: "HH:mm",
  dateTime: "MMM dd, yyyy HH:mm",
  iso: "yyyy-MM-dd",
  timeAgo: "relative", // Special format for relative time
} as const;

// Export individual functions for direct use
export {
  format,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  isToday,
  isYesterday,
  isTomorrow,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  isAfter,
  isBefore,
  isEqual,
  min,
  max,
};
