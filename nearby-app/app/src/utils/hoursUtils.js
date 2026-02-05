/**
 * Hours utility functions for nearby-app
 * Handles display of business hours with proper override logic:
 * 1. Exception hours (highest priority)
 * 2. Holiday hours
 * 3. Seasonal hours (with date ranges)
 * 4. Regular hours (fallback)
 */

const DAYS_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const DAYS_FULL = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Holiday date calculations
const HOLIDAY_CALCULATORS = {
  'new_year': (year) => new Date(year, 0, 1),
  'mlk_day': (year) => getNthWeekdayOfMonth(year, 0, 1, 3), // 3rd Monday of January
  'presidents_day': (year) => getNthWeekdayOfMonth(year, 1, 1, 3), // 3rd Monday of February
  'memorial_day': (year) => getLastWeekdayOfMonth(year, 4, 1), // Last Monday of May
  'juneteenth': (year) => new Date(year, 5, 19),
  'independence_day': (year) => new Date(year, 6, 4),
  'labor_day': (year) => getNthWeekdayOfMonth(year, 8, 1, 1), // 1st Monday of September
  'columbus_day': (year) => getNthWeekdayOfMonth(year, 9, 1, 2), // 2nd Monday of October
  'veterans_day': (year) => new Date(year, 10, 11),
  'thanksgiving': (year) => getNthWeekdayOfMonth(year, 10, 4, 4), // 4th Thursday of November
  'black_friday': (year) => {
    const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4);
    return new Date(thanksgiving.getTime() + 24 * 60 * 60 * 1000);
  },
  'christmas_eve': (year) => new Date(year, 11, 24),
  'christmas': (year) => new Date(year, 11, 25),
  'new_year_eve': (year) => new Date(year, 11, 31),
  'easter': (year) => calculateEaster(year),
  'good_friday': (year) => {
    const easter = calculateEaster(year);
    return new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000);
  },
  'mothers_day': (year) => getNthWeekdayOfMonth(year, 4, 0, 2), // 2nd Sunday of May
  'fathers_day': (year) => getNthWeekdayOfMonth(year, 5, 0, 3), // 3rd Sunday of June
  'halloween': (year) => new Date(year, 9, 31),
  'valentines_day': (year) => new Date(year, 1, 14)
};

// Human-readable holiday names
const HOLIDAY_NAMES = {
  'new_year': "New Year's Day",
  'new_years_day': "New Year's Day",
  'mlk_day': 'MLK Jr. Day',
  'presidents_day': "Presidents' Day",
  'memorial_day': 'Memorial Day',
  'juneteenth': 'Juneteenth',
  'independence_day': 'Independence Day',
  'labor_day': 'Labor Day',
  'columbus_day': 'Columbus Day',
  'veterans_day': "Veterans Day",
  'thanksgiving': 'Thanksgiving',
  'black_friday': 'Black Friday',
  'christmas_eve': 'Christmas Eve',
  'christmas': 'Christmas Day',
  'new_year_eve': "New Year's Eve",
  'easter': 'Easter Sunday',
  'good_friday': 'Good Friday',
  'mothers_day': "Mother's Day",
  'fathers_day': "Father's Day",
  'halloween': 'Halloween',
  'valentines_day': "Valentine's Day"
};

// Format a holiday key to human-readable name
function formatHolidayName(key) {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Get upcoming holidays from holiday_hours data
 * Returns array of { key, name, date, dateStr, hours } sorted by date
 */
export function getUpcomingHolidays(holidayHours, count = null) {
  if (!holidayHours || typeof holidayHours !== 'object') return [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentYear = now.getFullYear();
  const upcoming = [];

  for (const [key, hours] of Object.entries(holidayHours)) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
    const calculator = HOLIDAY_CALCULATORS[normalizedKey] || HOLIDAY_CALCULATORS[key];

    if (!calculator) continue;

    let holidayDate = calculator(currentYear);
    // If holiday already passed this year, get next year's date
    if (holidayDate < now) {
      holidayDate = calculator(currentYear + 1);
    }

    const dateStr = holidayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    upcoming.push({
      key,
      name: HOLIDAY_NAMES[normalizedKey] || HOLIDAY_NAMES[key] || formatHolidayName(key),
      date: holidayDate,
      dateStr,
      hours
    });
  }

  upcoming.sort((a, b) => a.date - b.date);
  return count ? upcoming.slice(0, count) : upcoming;
}

/**
 * Format a time string from "HH:MM" to "Ham/pm" format
 */
function formatTimeString(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  if (minutes === '00') {
    return `${displayHour}${ampm}`;
  }
  return `${displayHour}:${minutes}${ampm}`;
}

/**
 * Format legacy hours format (object with day keys and time strings/arrays)
 * Returns array of { day, dayShort, hours } for display
 */
export function formatLegacyHours(hours) {
  if (!hours || typeof hours !== 'object') return [];

  const result = [];

  for (const day of DAYS_ORDER) {
    const dayData = hours[day];
    let hoursText = 'Closed';

    if (dayData) {
      if (typeof dayData === 'string') {
        // Simple string like "9:00-17:00" or "Closed"
        if (dayData.toLowerCase() === 'closed') {
          hoursText = 'Closed';
        } else if (dayData.includes('-')) {
          const [open, close] = dayData.split('-').map(t => t.trim());
          hoursText = `${formatTimeString(open)} - ${formatTimeString(close)}`;
        } else {
          hoursText = dayData;
        }
      } else if (Array.isArray(dayData)) {
        // Array of periods like [{open: "9:00", close: "12:00"}, {open: "13:00", close: "17:00"}]
        const periods = dayData.map(period => {
          if (period.open && period.close) {
            return `${formatTimeString(period.open)} - ${formatTimeString(period.close)}`;
          }
          return '';
        }).filter(Boolean);
        hoursText = periods.length > 0 ? periods.join(', ') : 'Closed';
      } else if (typeof dayData === 'object') {
        // Object format with status and periods
        if (dayData.status === 'closed') {
          hoursText = 'Closed';
        } else if (dayData.status === '24hours') {
          hoursText = 'Open 24 Hours';
        } else if (dayData.status === 'open' && dayData.periods) {
          const periods = dayData.periods.map(period => {
            const open = period.open?.time || period.open;
            const close = period.close?.time || period.close;
            if (open && close) {
              return `${formatTimeString(open)} - ${formatTimeString(close)}`;
            }
            return '';
          }).filter(Boolean);
          hoursText = periods.length > 0 ? periods.join(', ') : 'Hours not set';
        }
      }
    }

    result.push({
      day,
      dayShort: DAYS_SHORT[day],
      dayFull: DAYS_FULL[day],
      hours: hoursText
    });
  }

  return result;
}

/**
 * Format holiday hours status for display
 */
export function formatHolidayStatus(hours) {
  if (!hours) return 'Regular Hours';
  if (hours.status === 'closed' || hours === 'closed') return 'Closed';
  if (hours.status === '24hours') return 'Open 24 Hours';
  if (hours.status === 'modified' && hours.periods) {
    const periods = hours.periods.map(p => {
      const open = formatTimeString(p.open?.time || p.open);
      const close = formatTimeString(p.close?.time || p.close);
      return `${open} - ${close}`;
    });
    return periods.join(', ');
  }
  if (typeof hours === 'string') return hours;
  return 'Modified Hours';
}

// Get nth weekday of month (0=Sunday, 1=Monday, etc.)
function getNthWeekdayOfMonth(year, month, weekday, n) {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  let dayOffset = weekday - firstWeekday;
  if (dayOffset < 0) dayOffset += 7;
  const day = 1 + dayOffset + (n - 1) * 7;
  return new Date(year, month, day);
}

// Get last weekday of month
function getLastWeekdayOfMonth(year, month, weekday) {
  const lastDay = new Date(year, month + 1, 0);
  const lastDayWeekday = lastDay.getDay();
  let dayOffset = lastDayWeekday - weekday;
  if (dayOffset < 0) dayOffset += 7;
  return new Date(year, month + 1, -dayOffset);
}

// Calculate Easter Sunday (using Anonymous Gregorian algorithm)
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

// Format time from 24hr to 12hr
export function formatTime(timeObj) {
  if (!timeObj) return '';

  if (timeObj.type === 'fixed' && timeObj.time) {
    const [hours, minutes] = timeObj.time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  if (timeObj.type === 'dawn') return 'Dawn';
  if (timeObj.type === 'dusk') return 'Dusk';
  if (timeObj.type === 'appointment') return 'By Appointment';
  if (timeObj.type === 'call') return 'Call for Hours';

  return '';
}

// Format a single day's hours
export function formatDayHours(hours) {
  if (!hours) return 'Closed';

  if (hours.status === 'closed') return 'Closed';
  if (hours.status === '24hours') return 'Open 24 Hours';
  if (hours.status === 'appointment') return 'By Appointment';

  if (hours.status === 'open' && hours.periods) {
    return hours.periods.map(period => {
      const open = formatTime(period.open);
      const close = formatTime(period.close);
      return `${open} - ${close}`;
    }).join(', ');
  }

  return 'Hours not set';
}

// Check if a date matches a recurring monthly exception
function matchesRecurringException(date, exception) {
  if (!exception || exception.type !== 'recurring' || !exception.pattern) return false;

  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
  const month = date.getMonth() + 1; // 1-12

  // Map day names to numbers
  const dayMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };

  // Map ordinal to number
  const ordinalMap = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'last': 'last'
  };

  const { ordinal, dayOfWeek: targetDayName, months } = exception.pattern;

  // Check if this month is included (empty array means all months)
  if (months && months.length > 0) {
    if (!months.includes(String(month))) return false;
  }

  // Check if this is the correct day of week
  const targetDay = dayMap[targetDayName?.toLowerCase()];
  if (targetDay === undefined || dayOfWeek !== targetDay) return false;

  // Calculate which occurrence of this weekday in the month
  const dayOfMonth = date.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  if (ordinal === 'last') {
    // Check if this is the last occurrence of this weekday
    const nextWeek = new Date(date);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.getMonth() !== date.getMonth();
  }

  const targetWeek = ordinalMap[ordinal];
  return weekOfMonth === targetWeek;
}

// Check if a date falls within a seasonal date range
function isInSeasonalRange(date, seasonData) {
  if (!seasonData) return false;

  // If season has custom date range, use it
  if (seasonData.startDate && seasonData.endDate) {
    const start = new Date(seasonData.startDate);
    const end = new Date(seasonData.endDate);
    return date >= start && date <= end;
  }

  // Fall back to month-based seasons
  const month = date.getMonth() + 1;
  const seasonMonths = {
    'spring': [3, 4, 5],
    'summer': [6, 7, 8],
    'fall': [9, 10, 11],
    'winter': [12, 1, 2]
  };

  for (const [season, months] of Object.entries(seasonMonths)) {
    if (seasonData[season] && months.includes(month)) {
      return season;
    }
  }

  return false;
}

// Get current active season
function getActiveSeason(date, seasonalData) {
  if (!seasonalData) return null;

  const currentYear = date.getFullYear();
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();

  // Check each season for custom date ranges first (useDateRange flag)
  for (const [seasonName, seasonData] of Object.entries(seasonalData)) {
    if (seasonData.useDateRange && seasonData.startDate && seasonData.endDate) {
      // Parse MM-DD format and compare with current date
      const [startMonth, startDay] = seasonData.startDate.split('-').map(Number);
      const [endMonth, endDay] = seasonData.endDate.split('-').map(Number);

      // Create dates for comparison (handle year wrap for ranges like Dec-Feb)
      let startDate = new Date(currentYear, startMonth - 1, startDay);
      let endDate = new Date(currentYear, endMonth - 1, endDay);

      // If end is before start, the range wraps around the year
      if (endDate < startDate) {
        // Check if date is after start OR before end
        const dateThisYear = new Date(currentYear, month - 1, dayOfMonth);
        if (dateThisYear >= startDate || dateThisYear <= endDate) {
          return seasonName;
        }
      } else {
        // Normal range within same year
        const dateThisYear = new Date(currentYear, month - 1, dayOfMonth);
        if (dateThisYear >= startDate && dateThisYear <= endDate) {
          return seasonName;
        }
      }
    }
  }

  // Fall back to month-based seasons for seasons without custom date ranges
  const seasonMonths = {
    'spring': [3, 4, 5],
    'summer': [6, 7, 8],
    'fall': [9, 10, 11],
    'winter': [12, 1, 2]
  };

  for (const [seasonName, months] of Object.entries(seasonMonths)) {
    if (seasonalData[seasonName] && !seasonalData[seasonName].useDateRange && months.includes(month)) {
      return seasonName;
    }
  }

  return null;
}

// Check if a date is a holiday
function getHolidayForDate(date, holidaysData) {
  if (!holidaysData) return null;

  const year = date.getFullYear();
  const dateStr = date.toISOString().split('T')[0];

  for (const [holidayId, holiday] of Object.entries(holidaysData)) {
    // Try to calculate the holiday date
    if (HOLIDAY_CALCULATORS[holidayId]) {
      const holidayDate = HOLIDAY_CALCULATORS[holidayId](year);
      if (holidayDate.toISOString().split('T')[0] === dateStr) {
        return { id: holidayId, ...holiday };
      }
    }

    // Check fixed date format (MM-DD)
    if (holiday.date && holiday.date.match(/^\d{2}-\d{2}$/)) {
      const [month, day] = holiday.date.split('-');
      const holidayDate = new Date(year, parseInt(month) - 1, parseInt(day));
      if (holidayDate.toISOString().split('T')[0] === dateStr) {
        return { id: holidayId, ...holiday };
      }
    }
  }

  return null;
}

// Get exception for a specific date
function getExceptionForDate(date, exceptionsData) {
  if (!date || !exceptionsData) return null;

  const dateStr = date.toISOString().split('T')[0];

  // Check all exceptions - both one-time and recurring are now in the same array
  for (const exception of exceptionsData) {
    // One-time exception
    if (!exception.type || exception.type === 'one-time') {
      if (exception.date === dateStr) {
        return { ...exception, type: 'one-time' };
      }
    }
    // Recurring exception
    else if (exception.type === 'recurring') {
      if (matchesRecurringException(date, exception)) {
        return exception;
      }
    }
  }

  return null;
}

/**
 * Get the effective hours for a specific date
 * Returns { hours, source, label } where source indicates override type
 */
export function getEffectiveHoursForDate(hoursData, date) {
  if (!hoursData) {
    return { hours: null, source: 'none', label: null };
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];

  // 1. Check exceptions first (highest priority) - both one-time and recurring are in exceptions array
  const exception = getExceptionForDate(date, hoursData.exceptions);
  if (exception) {
    const label = exception.reason || (exception.type === 'recurring' ? 'Modified Schedule' : 'Special Hours');
    if (exception.status === 'closed') {
      return { hours: { status: 'closed' }, source: 'exception', label };
    }
    if (exception.status === 'modified' && exception.periods) {
      return { hours: { status: 'open', periods: exception.periods }, source: 'exception', label };
    }
    if (exception.status === 'open') {
      // Fall through to regular hours but mark as exception
      const regularHours = hoursData.regular?.[dayName];
      return { hours: regularHours, source: 'exception', label };
    }
  }

  // 2. Check holiday hours
  const holiday = getHolidayForDate(date, hoursData.holidays);
  if (holiday) {
    if (holiday.status === 'closed') {
      return { hours: { status: 'closed' }, source: 'holiday', label: holiday.name };
    }
    if (holiday.status === 'modified' && holiday.periods) {
      return { hours: { status: 'open', periods: holiday.periods }, source: 'holiday', label: holiday.name };
    }
    // If 'open', use regular hours but still note it's a holiday
  }

  // 3. Check seasonal hours
  const activeSeason = getActiveSeason(date, hoursData.seasonal);
  if (activeSeason && hoursData.seasonal[activeSeason]) {
    const seasonalDayHours = hoursData.seasonal[activeSeason][dayName];
    if (seasonalDayHours) {
      const seasonNames = {
        'spring': 'Spring Hours',
        'summer': 'Summer Hours',
        'fall': 'Fall Hours',
        'winter': 'Winter Hours'
      };
      return { hours: seasonalDayHours, source: 'seasonal', label: seasonNames[activeSeason] };
    }
  }

  // 4. Fall back to regular hours
  const regularHours = hoursData.regular?.[dayName];
  return { hours: regularHours, source: 'regular', label: null };
}

/**
 * Get hours for a week starting from a given date
 * Returns array of { date, dayName, hours, source, label, isToday }
 */
export function getWeekHours(hoursData, startDate = new Date()) {
  const weekHours = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];

    const effective = getEffectiveHoursForDate(hoursData, date);

    weekHours.push({
      date,
      dayName,
      dayLabel: DAYS_FULL[dayName],
      dayShort: DAYS_SHORT[dayName],
      hours: effective.hours,
      formattedHours: formatDayHours(effective.hours),
      source: effective.source,
      label: effective.label,
      isToday: date.getTime() === today.getTime(),
      isModified: effective.source !== 'regular'
    });
  }

  return weekHours;
}

/**
 * Check if currently open based on all override rules
 */
export function isCurrentlyOpen(hoursData) {
  if (!hoursData) return { isOpen: false, status: 'unknown' };

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const { hours, source, label } = getEffectiveHoursForDate(hoursData, now);

  if (!hours) {
    return { isOpen: false, status: 'Hours not set' };
  }

  if (hours.status === 'closed') {
    return {
      isOpen: false,
      status: label ? `Closed - ${label}` : 'Closed',
      source,
      label
    };
  }

  if (hours.status === '24hours') {
    return {
      isOpen: true,
      status: 'Open 24 Hours',
      source,
      label
    };
  }

  if (hours.status === 'appointment') {
    return {
      isOpen: false,
      status: 'By Appointment Only',
      source,
      label
    };
  }

  if (hours.status === 'open' && hours.periods) {
    for (const period of hours.periods) {
      if (period.open?.type === 'fixed' && period.close?.type === 'fixed') {
        const openTime = period.open.time;
        const closeTime = period.close.time;

        // Handle times that cross midnight
        if (closeTime < openTime) {
          if (currentTime >= openTime || currentTime < closeTime) {
            return {
              isOpen: true,
              status: `Open until ${formatTime(period.close)}`,
              source,
              label
            };
          }
        } else {
          if (currentTime >= openTime && currentTime < closeTime) {
            return {
              isOpen: true,
              status: `Open until ${formatTime(period.close)}`,
              source,
              label
            };
          }
        }
      }
    }

    // Check if we're before opening
    const firstPeriod = hours.periods[0];
    if (firstPeriod?.open?.type === 'fixed' && currentTime < firstPeriod.open.time) {
      return {
        isOpen: false,
        status: `Opens at ${formatTime(firstPeriod.open)}`,
        source,
        label
      };
    }
  }

  return {
    isOpen: false,
    status: 'Closed',
    source,
    label
  };
}

/**
 * Group consecutive days with same hours for compact display
 */
export function groupHours(hoursData) {
  if (!hoursData || !hoursData.regular) return [];

  const groups = [];
  let currentGroup = null;

  DAYS_ORDER.forEach(day => {
    const dayHours = hoursData.regular[day];
    const formatted = formatDayHours(dayHours);

    if (!currentGroup || currentGroup.hours !== formatted) {
      currentGroup = {
        days: [day],
        hours: formatted
      };
      groups.push(currentGroup);
    } else {
      currentGroup.days.push(day);
    }
  });

  return groups;
}

/**
 * Format grouped hours for display
 */
export function formatGroupedHours(group) {
  const days = group.days;

  if (days.length === 1) {
    return { days: DAYS_SHORT[days[0]], hours: group.hours };
  }

  if (days.length === 7) {
    return { days: 'Every day', hours: group.hours };
  }

  if (days.length === 5 && days[0] === 'monday' && days[4] === 'friday') {
    return { days: 'Mon - Fri', hours: group.hours };
  }

  if (days.length === 2 && days[0] === 'saturday' && days[1] === 'sunday') {
    return { days: 'Sat - Sun', hours: group.hours };
  }

  const firstDay = DAYS_SHORT[days[0]];
  const lastDay = DAYS_SHORT[days[days.length - 1]];
  return { days: `${firstDay} - ${lastDay}`, hours: group.hours };
}

export default {
  formatTime,
  formatDayHours,
  getEffectiveHoursForDate,
  getWeekHours,
  isCurrentlyOpen,
  groupHours,
  formatGroupedHours,
  getUpcomingHolidays,
  formatLegacyHours,
  formatHolidayStatus
};
