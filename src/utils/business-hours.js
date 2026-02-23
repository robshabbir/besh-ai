/**
 * Business Hours Utility
 * Determines if a business is currently open based on config
 */

const DAY_MAP = {
  'sun': 0, 'sunday': 0,
  'mon': 1, 'monday': 1,
  'tue': 2, 'tuesday': 2, 'tues': 2,
  'wed': 3, 'wednesday': 3,
  'thu': 4, 'thursday': 4, 'thur': 4, 'thurs': 4,
  'fri': 5, 'friday': 5,
  'sat': 6, 'saturday': 6,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Parse time string like "9am", "9:00am", "17:00", "5pm" to minutes since midnight
 */
function parseTime(timeStr) {
  if (!timeStr) return null;
  timeStr = timeStr.trim().toLowerCase().replace(/\s+/g, '');

  // 24-hour format: "17:00", "9:00"
  let match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }

  // 12-hour format: "9am", "9:30pm", "12pm"
  match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2] || '0');
    const period = match[3];
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Parse day range like "Mon-Fri", "Mon-Sat", "Sunday"
 * Returns array of day numbers (0=Sun, 6=Sat)
 */
function parseDayRange(dayStr) {
  if (!dayStr) return [];
  dayStr = dayStr.trim().toLowerCase();

  // Range: "mon-fri", "mon-sat"
  const rangeMatch = dayStr.match(/^(\w+)\s*[-–]\s*(\w+)$/);
  if (rangeMatch) {
    const start = DAY_MAP[rangeMatch[1]];
    const end = DAY_MAP[rangeMatch[2]];
    if (start === undefined || end === undefined) return [];
    const days = [];
    let d = start;
    while (true) {
      days.push(d);
      if (d === end) break;
      d = (d + 1) % 7;
    }
    return days;
  }

  // Single day
  if (DAY_MAP[dayStr] !== undefined) return [DAY_MAP[dayStr]];

  // Comma-separated
  return dayStr.split(/[,&]/).flatMap(d => parseDayRange(d.trim()));
}

/**
 * Parse hours config string like "Mon-Fri 9am-5pm" or "Mon-Sat 7am-6pm"
 * Supports multiple segments: "Mon-Fri 9am-5pm, Sat 10am-2pm"
 * Returns array of { days: number[], open: minutes, close: minutes }
 */
function parseHoursConfig(hoursStr) {
  if (!hoursStr) return [];

  const segments = hoursStr.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  const result = [];

  for (const segment of segments) {
    // Try to match "DayRange TimeRange"
    const match = segment.match(/^(.+?)\s+(\d[\d:apmAPM]*\s*[-–]\s*\d[\d:apmAPM]*)$/);
    if (match) {
      const days = parseDayRange(match[1]);
      const [openStr, closeStr] = match[2].split(/\s*[-–]\s*/);
      const open = parseTime(openStr);
      const close = parseTime(closeStr);
      if (days.length && open !== null && close !== null) {
        result.push({ days, open, close });
      }
    }
  }

  return result;
}

/**
 * Check if business is currently open
 * @param {string} hoursConfig - e.g. "Mon-Fri 9am-5pm, Sat 10am-2pm"
 * @param {string} timezone - e.g. "America/New_York"
 * @returns {{ isOpen: boolean, nextOpen: string|null }}
 */
function isBusinessOpen(hoursConfig, timezone = 'America/New_York') {
  if (!hoursConfig) return { isOpen: true, nextOpen: null }; // No hours = always open

  const schedules = parseHoursConfig(hoursConfig);
  if (schedules.length === 0) return { isOpen: true, nextOpen: null }; // Can't parse = assume open

  // Get current time in business timezone
  const now = new Date();
  const options = { timeZone: timezone, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);

  let currentDay = -1;
  let currentMinutes = 0;

  for (const part of parts) {
    if (part.type === 'weekday') {
      currentDay = DAY_MAP[part.value.toLowerCase()] ?? -1;
    } else if (part.type === 'hour') {
      currentMinutes = parseInt(part.value) * 60;
    } else if (part.type === 'minute') {
      currentMinutes += parseInt(part.value);
    }
  }

  // Check if currently within any schedule
  for (const sched of schedules) {
    if (sched.days.includes(currentDay)) {
      if (currentMinutes >= sched.open && currentMinutes < sched.close) {
        return { isOpen: true, nextOpen: null };
      }
    }
  }

  // Not open — find next opening
  const nextOpen = findNextOpen(schedules, currentDay, currentMinutes);

  return { isOpen: false, nextOpen };
}

function findNextOpen(schedules, currentDay, currentMinutes) {
  // Check remaining today and then next 7 days
  for (let offset = 0; offset < 7; offset++) {
    const checkDay = (currentDay + offset) % 7;
    for (const sched of schedules) {
      if (sched.days.includes(checkDay)) {
        if (offset === 0 && sched.open > currentMinutes) {
          const h = Math.floor(sched.open / 60);
          const m = sched.open % 60;
          return `today at ${formatTime(h, m)}`;
        } else if (offset > 0) {
          const h = Math.floor(sched.open / 60);
          const m = sched.open % 60;
          return `${DAY_NAMES[checkDay]} at ${formatTime(h, m)}`;
        }
      }
    }
  }
  return null;
}

function formatTime(hours, minutes) {
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return minutes > 0 ? `${h}:${String(minutes).padStart(2, '0')} ${period}` : `${h} ${period}`;
}

module.exports = { isBusinessOpen, parseHoursConfig, parseTime, parseDayRange };
