// timeUtils.js - Utility functions for local device time and San Diego timezone handling

import { format, toZonedTime } from 'date-fns-tz';

/**
 * Convert UTC timestamp to San Diego time (Pacific Time)
 * @param {string|Date} utcTimestamp - UTC timestamp
 * @returns {Date} - Date object in San Diego timezone
 */
export function convertToSanDiegoTime(utcTimestamp) {
  const date = new Date(utcTimestamp);
  // Convert to San Diego time (Pacific Time)
  return new Date(date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles"
  }));
}

/**
 * Format timestamp for display in San Diego time
 * @param {string|Date} timestamp - UTC timestamp
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted time string
 */
export function formatSanDiegoTime(timestamp, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  };
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    ...defaultOptions,
    ...options
  });
}

/**
 * Format time only (without date) in San Diego time
 * @param {string|Date} timestamp - UTC timestamp
 * @returns {string} - Time string in San Diego timezone
 */
export function formatSanDiegoTimeOnly(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get current San Diego time as ISO string (local device time, not NIST)
 * @returns {string} - Current time in San Diego timezone as ISO string
 */
export function getCurrentSanDiegoTime() {
  const now = new Date();
  const sanDiegoDate = convertToSanDiegoTime(now);
  return sanDiegoDate.toISOString();
}

/**
 * Get timezone offset information for San Diego
 * @returns {Object} - Timezone information
 */
export function getSanDiegoTimezoneInfo() {
  const now = new Date();
  const sanDiegoTime = new Date(now.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles"
  }));
  const utcTime = new Date(now.toLocaleString("en-US", {
    timeZone: "UTC"
  }));
  const offsetMs = sanDiegoTime.getTime() - utcTime.getTime();
  const offsetHours = offsetMs / (1000 * 60 * 60);
  return {
    timezone: "America/Los_Angeles",
    offset: offsetHours,
    offsetString: offsetHours >= 0 ? `+${offsetHours}` : `${offsetHours}`,
    abbreviation: offsetHours === -8 ? "PST" : "PDT", // Pacific Standard Time or Pacific Daylight Time
    isDST: offsetHours === -7 // PDT is -7, PST is -8
  };
}

/**
 * Check if San Diego is currently in Daylight Saving Time
 * @returns {boolean} - True if DST is active
 */
export function isSanDiegoDST() {
  const tzInfo = getSanDiegoTimezoneInfo();
  return tzInfo.isDST;
}

/**
 * Get ISO string in San Diego time with offset (e.g., 2024-07-09T05:29:00.000-07:00)
 * @param {Date} date - JS Date object (default: now)
 * @returns {string} - ISO 8601 string in San Diego time
 */
export function getSanDiegoISOString(date = new Date()) {
  const tz = 'America/Los_Angeles';
  const zoned = toZonedTime(date, tz);
  // 'yyyy-MM-ddTHH:mm:ss.SSSXXX' gives ISO 8601 with offset
  return format(zoned, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone: tz });
}

// --- TimeService Singleton for local device time only ---
class TimeService {
  constructor() {
    this.listeners = [];
  }
  // Returns the current San Diego time as a Date object (local device time)
  getCurrentTime() {
    return convertToSanDiegoTime(new Date());
  }
  // Optional: allow components to listen for time updates (no interval sync needed)
  subscribe(listener) {
    this.listeners.push(listener);
  }
  unsubscribe(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  notifyListeners() {
    this.listeners.forEach(l => l(this.getCurrentTime()));
  }
}

export const timeService = new TimeService(); 