/**
 * Shared utility functions for date and time formatting across the application.
 */

/**
 * Returns a relative time string (e.g., "Today", "Yesterday", "3 days ago").
 */
export const getRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const actualDate = typeof dateInput === 'object' && dateInput.$date ? dateInput.$date : dateInput;
  const date = new Date(actualDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInDays = Math.floor(diffInSeconds / 86400);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  
  if (diffInDays === 0 && date.getDate() === now.getDate()) return 'Today';
  if (diffInDays <= 1 || (diffInDays === 1 && date.getDate() !== now.getDate())) {
     // Check if it was actually yesterday's date
     const yesterday = new Date(now);
     yesterday.setDate(now.getDate() - 1);
     if (date.getDate() === yesterday.getDate()) return 'Yesterday';
  }

  if (diffInDays < 30) return `${diffInDays} days ago`;
  if (diffInMonths < 12) return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

/**
 * Formats a date string (or MongoDB $date object) into a human-readable localized string.
 * Example: "Today, Mar 25, 2026, 01:23 PM"
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return 'Never';
  
  const actualDate = typeof dateInput === 'object' && dateInput.$date ? dateInput.$date : dateInput;
  const date = new Date(actualDate);
  
  if (isNaN(date.getTime())) return 'Invalid Date';

  const absoluteDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const relative = getRelativeTime(dateInput);
  return relative ? `${relative}, ${absoluteDate}` : absoluteDate;
};

/**
 * Formats a date for simple YYYY-MM-DD display.
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  const actualDate = typeof dateInput === 'object' && dateInput.$date ? dateInput.$date : dateInput;
  const date = new Date(actualDate);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toISOString().split('T')[0];
};

/**
 * Compares two dates (supporting MongoDB $date objects) for sorting.
 * Newest first (descending).
 */
export const compareDates = (a, b) => {
  const dateA = a?.$date ? new Date(a.$date) : new Date(a);
  const dateB = b?.$date ? new Date(b.$date) : new Date(b);
  return dateB - dateA;
};

/**
 * Returns just the time part of a date.
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return '';
  const actualDate = typeof dateInput === 'object' && dateInput.$date ? dateInput.$date : dateInput;
  const date = new Date(actualDate);
  return date.toLocaleTimeString();
};
