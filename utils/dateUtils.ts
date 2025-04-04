export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // For past dates (negative diff)
  if (diffDays <= 0) {
    // Check if it's today
    const today = new Date();
    const dateToCheck = new Date(date);
    
    if (
      today.getFullYear() === dateToCheck.getFullYear() &&
      today.getMonth() === dateToCheck.getMonth() &&
      today.getDate() === dateToCheck.getDate()
    ) {
      // Get hours difference
      const hoursDiff = Math.abs(Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60)));
      if (hoursDiff < 1) {
        // Get minutes difference
        const minutesDiff = Math.abs(Math.floor((now.getTime() - date.getTime()) / (1000 * 60)));
        return minutesDiff < 1 ? 'just now' : `${minutesDiff} minutes ago`;
      }
      return hoursDiff === 1 ? '1 hour ago' : `${hoursDiff} hours ago`;
    }
    
    // Check if it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      yesterday.getFullYear() === dateToCheck.getFullYear() &&
      yesterday.getMonth() === dateToCheck.getMonth() &&
      yesterday.getDate() === dateToCheck.getDate()
    ) {
      return 'yesterday';
    }
    
    // For older dates
    const daysDiff = Math.abs(diffDays);
    if (daysDiff < 30) {
      return `${daysDiff} days ago`;
    } else if (daysDiff < 365) {
      const months = Math.floor(daysDiff / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(daysDiff / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  }
  
  // For future dates (positive diff)
  if (diffDays === 1) {
    return '1 day';
  } else if (diffDays < 30) {
    return `${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month' : `${months} months`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year' : `${years} years`;
  }
}