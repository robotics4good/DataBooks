// timeUtils.js - Utility functions for NIST time API and San Diego timezone handling

import { format, toZonedTime } from 'date-fns-tz';

/**
 * Fetch current time from NIST time servers
 * Uses the official NIST time API
 */
export async function getNistTime() {
  try {
    // Try multiple NIST time servers for redundancy
    const nistServers = [
      'https://time.nist.gov/api/v1/time',
      'https://worldtimeapi.org/api/timezone/America/Los_Angeles'
    ];

    for (const server of nistServers) {
      try {
        const response = await fetch(server, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Handle different API response formats
        if (data.utc_datetime) {
          // worldtimeapi.org format
          return data.utc_datetime;
        } else if (data.datetime) {
          // NIST API format
          return data.datetime;
        } else if (data.utc) {
          // Alternative NIST format
          return data.utc;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${server}:`, error.message);
        continue;
      }
    }
    
    // If all NIST servers fail, fallback to local time
    throw new Error('All NIST servers failed');
  } catch (error) {
    console.warn('NIST time fetch failed, using local time:', error.message);
    return new Date().toISOString();
  }
}

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
 * Get current San Diego time as ISO string
 * @returns {Promise<string>} - Current time in San Diego timezone as ISO string
 */
export async function getCurrentSanDiegoTime() {
  const nistTime = await getNistTime();
  const sanDiegoDate = convertToSanDiegoTime(nistTime);
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

// --- TimeService Singleton for 15-min NIST/US Pacific time caching ---
class TimeService {
  constructor() {
    /**
     * The anchor time, always stored as a Date object in San Diego time (America/Los_Angeles),
     * NIST-anchored and never UTC. All time math is done in San Diego time.
     */
    this.sanDiegoAnchor = null; // Date object in San Diego time
    this.lastSync = null; // Date object (local system time when anchor was set)
    this.syncInterval = null;
    this.isSyncing = false;
    this.listeners = [];
    this.start();
  }

  async fetchNistTime() {
    this.isSyncing = true;
    try {
      const nistTimeStr = await getNistTime();
      // Convert to San Diego time immediately and store as anchor
      const sanDiegoAnchor = convertToSanDiegoTime(nistTimeStr);
      this.sanDiegoAnchor = sanDiegoAnchor;
      this.lastSync = new Date();
      this.notifyListeners();
    } catch (err) {
      // fallback: use local time, but still convert to San Diego
      this.sanDiegoAnchor = convertToSanDiegoTime(new Date().toISOString());
      this.lastSync = new Date();
      this.notifyListeners();
    } finally {
      this.isSyncing = false;
    }
  }

  start() {
    this.fetchNistTime();
    if (this.syncInterval) clearInterval(this.syncInterval);
    // 10 minutes = 600,000 ms
    this.syncInterval = setInterval(() => this.fetchNistTime(), 600000);
  }

  /**
   * Returns the current San Diego time as a Date object, NIST-anchored.
   * All time math is done in San Diego time, so this is always correct.
   */
  getCurrentTime() {
    if (!this.sanDiegoAnchor || !this.lastSync) return convertToSanDiegoTime(new Date().toISOString());
    const now = new Date();
    const elapsed = now.getTime() - this.lastSync.getTime();
    // Add elapsed ms to the San Diego anchor
    return new Date(this.sanDiegoAnchor.getTime() + elapsed);
  }

  // Optional: allow components to listen for time updates
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