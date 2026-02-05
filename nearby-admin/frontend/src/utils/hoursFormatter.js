// Utility functions for formatting hours for display

const DAYS_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Format a time object for display
export function formatTime(timeObj) {
  if (!timeObj) return '';
  
  if (timeObj.type === 'fixed' && timeObj.time) {
    // Convert 24hr to 12hr format
    const [hours, minutes] = timeObj.time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  
  if (timeObj.type === 'dawn' || timeObj.type === 'dusk') {
    const offset = timeObj.offset || 0;
    if (offset === 0) return timeObj.type;
    const sign = offset > 0 ? '+' : '';
    return `${timeObj.type} ${sign}${offset}min`;
  }
  
  if (timeObj.type === 'appointment') return 'By Appointment';
  if (timeObj.type === 'call') return 'Call for Hours';
  
  return '';
}

// Format a single day's hours
export function formatDayHours(hours) {
  if (!hours) return 'Closed';
  
  if (hours.status === 'closed') return 'Closed';
  if (hours.status === '24hours') return '24 Hours';
  
  if (hours.status === 'open' && hours.periods) {
    return hours.periods.map(period => {
      const open = formatTime(period.open);
      const close = formatTime(period.close);
      return `${open} - ${close}`;
    }).join(', ');
  }
  
  return 'Hours not set';
}

// Group consecutive days with same hours
export function groupHours(hoursData) {
  if (!hoursData || !hoursData.regular) return [];
  
  const groups = [];
  let currentGroup = null;
  
  DAYS_ORDER.forEach(day => {
    const dayHours = hoursData.regular[day];
    const formatted = formatDayHours(dayHours);
    
    if (!currentGroup || currentGroup.hours !== formatted) {
      // Start new group
      currentGroup = {
        days: [day],
        hours: formatted
      };
      groups.push(currentGroup);
    } else {
      // Add to current group
      currentGroup.days.push(day);
    }
  });
  
  return groups;
}

// Format grouped hours for display
export function formatGroupedHours(group) {
  const days = group.days;
  
  if (days.length === 1) {
    return `${DAYS_SHORT[days[0]]}: ${group.hours}`;
  }
  
  if (days.length === 7) {
    return `Every day: ${group.hours}`;
  }
  
  // Check for Mon-Fri
  if (days.length === 5 && 
      days[0] === 'monday' && 
      days[4] === 'friday') {
    return `Mon-Fri: ${group.hours}`;
  }
  
  // Check for Sat-Sun
  if (days.length === 2 && 
      days[0] === 'saturday' && 
      days[1] === 'sunday') {
    return `Sat-Sun: ${group.hours}`;
  }
  
  // Format as range
  const firstDay = DAYS_SHORT[days[0]];
  const lastDay = DAYS_SHORT[days[days.length - 1]];
  return `${firstDay}-${lastDay}: ${group.hours}`;
}

// Get a simple summary of hours
export function getHoursSummary(hoursData) {
  if (!hoursData || !hoursData.regular) return 'Hours not set';
  
  const groups = groupHours(hoursData);
  if (groups.length === 0) return 'Hours not set';
  
  // Check for 24/7
  if (groups.length === 1 && groups[0].hours === '24 Hours' && groups[0].days.length === 7) {
    return 'Open 24/7';
  }
  
  // Return first group as summary
  return formatGroupedHours(groups[0]);
}

// Check if currently open
export function isCurrentlyOpen(hoursData) {
  if (!hoursData || !hoursData.regular) return false;
  
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // Check for exceptions first
  const today = now.toISOString().split('T')[0];
  if (hoursData.exceptions) {
    const exception = hoursData.exceptions.find(e => e.date === today);
    if (exception) {
      if (exception.status === 'closed') return false;
      if (exception.status === '24hours') return true;
      // Check modified hours
      if (exception.status === 'modified' && exception.periods) {
        return checkPeriodsOpen(exception.periods, currentTime);
      }
    }
  }
  
  // Check holidays
  if (hoursData.holidays) {
    // This would need more complex holiday date calculation
    // For now, just check if any holiday is today
  }
  
  // Check seasonal hours
  const currentMonth = now.getMonth() + 1;
  let activeSeason = null;
  if (currentMonth >= 3 && currentMonth <= 5) activeSeason = 'spring';
  else if (currentMonth >= 6 && currentMonth <= 8) activeSeason = 'summer';
  else if (currentMonth >= 9 && currentMonth <= 11) activeSeason = 'fall';
  else activeSeason = 'winter';
  
  if (hoursData.seasonal && hoursData.seasonal[activeSeason]) {
    const seasonalDay = hoursData.seasonal[activeSeason][currentDay];
    if (seasonalDay) {
      if (seasonalDay.status === 'closed') return false;
      if (seasonalDay.status === '24hours') return true;
      if (seasonalDay.status === 'open' && seasonalDay.periods) {
        return checkPeriodsOpen(seasonalDay.periods, currentTime);
      }
    }
  }
  
  // Check regular hours
  const dayHours = hoursData.regular[currentDay];
  if (!dayHours) return false;
  
  if (dayHours.status === 'closed') return false;
  if (dayHours.status === '24hours') return true;
  
  if (dayHours.status === 'open' && dayHours.periods) {
    return checkPeriodsOpen(dayHours.periods, currentTime);
  }
  
  return false;
}

// Helper to check if current time is within periods
function checkPeriodsOpen(periods, currentTime) {
  for (const period of periods) {
    if (period.open?.type === 'fixed' && period.close?.type === 'fixed') {
      const openTime = period.open.time;
      const closeTime = period.close.time;
      
      // Handle times that cross midnight
      if (closeTime < openTime) {
        // Open past midnight
        if (currentTime >= openTime || currentTime < closeTime) {
          return true;
        }
      } else {
        // Normal hours
        if (currentTime >= openTime && currentTime < closeTime) {
          return true;
        }
      }
    }
    // For dawn/dusk, would need sunrise/sunset calculation
  }
  return false;
}

// Get next open time
export function getNextOpenTime(hoursData) {
  if (!hoursData || !hoursData.regular) return null;
  
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    const dayName = dayNames[checkDate.getDay()];
    
    const dayHours = hoursData.regular[dayName];
    if (dayHours && dayHours.status === 'open' && dayHours.periods) {
      const firstPeriod = dayHours.periods[0];
      if (firstPeriod.open?.type === 'fixed') {
        // If it's today, check if we haven't passed the opening time yet
        if (i === 0) {
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          if (currentTime < firstPeriod.open.time) {
            return {
              day: 'Today',
              time: formatTime(firstPeriod.open)
            };
          }
        } else if (i === 1) {
          return {
            day: 'Tomorrow',
            time: formatTime(firstPeriod.open)
          };
        } else {
          return {
            day: DAYS_SHORT[dayName],
            time: formatTime(firstPeriod.open)
          };
        }
      }
    }
  }
  
  return null;
}