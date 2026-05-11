/**
 * Shared utility functions for date and time formatting across the application.
 */

/**
 * Parses various date input formats (JS Date, MongoDB $date object, Jackson array) 
 * consistently into a JS Date object, assuming UTC for arrays.
 */
export const parseDate = (dateInput) => {
  if (!dateInput) return new Date(0);
  if (typeof dateInput === 'object' && dateInput.$date) {
    return new Date(dateInput.$date);
  } else if (Array.isArray(dateInput)) {
    // Jackson format: [year, month, day, hour, minute, second]
    // Crucial: Treat as UTC to avoid local timezone offset issues
    return new Date(Date.UTC(dateInput[0], dateInput[1] - 1, dateInput[2], dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0));
  } else {
    return new Date(dateInput);
  }
};

/**
 * Returns a relative time string (e.g., "Today", "Yesterday", "3 days ago").
 */
export const getRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  
  const date = parseDate(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInDays = Math.floor(diffInSeconds / 86400);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // Handle negative diffs (future dates due to clock skew) as 'Just now'
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  
  if (diffInDays === 0 && date.getDate() === now.getDate()) return 'Today';
  if (diffInDays <= 1 || (diffInDays === 1 && date.getDate() !== now.getDate())) {
     const yesterday = new Date(now);
     yesterday.setDate(now.getDate() - 1);
     if (date.getDate() === yesterday.getDate()) return 'Yesterday';
  }

  if (diffInDays < 30) return `${diffInDays} days ago`;
  if (diffInMonths < 12) return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

/**
 * Formats a date string into a human-readable localized string.
 * Example: "Today, Mar 25, 2026, 01:23 PM"
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return 'Never';
  const date = parseDate(dateInput);
  
  if (isNaN(date.getTime())) return 'Invalid Date';

  const absoluteDate = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const relative = getRelativeTime(dateInput);
  return relative ? `${relative}, ${absoluteDate}` : absoluteDate;
};

/**
 * Formats a date for simple YYYY-MM-DD display.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  const date = parseDate(dateInput);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toISOString().split('T')[0];
};

/**
 * Compares two dates for sorting. Newest first (descending).
 */
export const compareDates = (a, b) => {
  const dateA = parseDate(a);
  const dateB = parseDate(b);
  return dateB - dateA;
};

/**
 * Returns just the time part of a date.
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return '';
  const date = parseDate(dateInput);
  return date.toLocaleTimeString();
};
