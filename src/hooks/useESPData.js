// useESPData.js - Custom hook for fetching and transforming ESP data from Firebase
import { useState, useEffect } from 'react';
import { db, ref, get, onValue } from '../firebase';
import { formatSanDiegoTimeOnly, formatSanDiegoTime, timeService, getSanDiegoISOString } from '../utils/timeUtils';
import { toZonedTime } from 'date-fns-tz';

const VALID_CADET_IDS = Array.from({ length: 12 }, (_, i) => `S${i + 1}`);
const VALID_SECTOR_IDS = Array.from({ length: 6 }, (_, i) => `T${i + 1}`);
const VALID_DEVICE_IDS = [...VALID_CADET_IDS, ...VALID_SECTOR_IDS];

/**
 * Custom hook for fetching ESP data from Firebase and transforming it for plots
 * @param {boolean} enableRealTime - Whether to enable real-time updates (default: false)
 * @returns {Object} - ESP data in various formats for different plot types
 */
export function useESPData(enableRealTime = false) {
  const [espData, setEspData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meetingLogs, setMeetingLogs] = useState([]);
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || '');

  // Helper: normalize ESP record
  function normalizeRecord(record, meetingLogs) {
    const sanDiegoTime = toZonedTime(new Date(record.timestamp), 'America/Los_Angeles');
    // Proximity count: count 1-bits in integer
    const proximity_count = typeof record.proximity_mask === 'number'
      ? record.proximity_mask.toString(2).split('').filter(x => x === '1').length
      : 0;
    // Infection status: 1 = infected, 0 = healthy
    const infection_status = record.infection_status === 1 ? 'infected' : 'healthy';
    // Hour and session_half
    const hour = sanDiegoTime.getHours();
    const session_half = hour < 12 ? 'AM' : 'PM';
    // Meetings held up to this record
    const meetings_held = meetingLogs.filter(log => log.event === 'MEETINGEND' && new Date(log.sanDiegoTime) <= sanDiegoTime).length;
    // Derived infection fields
    const infected_cadets = record.device_id && infection_status === 'infected' && VALID_CADET_IDS.includes(record.device_id) ? record.device_id : null;
    const infected_sectors = record.device_id && infection_status === 'infected' && VALID_SECTOR_IDS.includes(record.device_id) ? record.device_id : null;
    const healthy_cadets = record.device_id && infection_status === 'healthy' && VALID_CADET_IDS.includes(record.device_id) ? record.device_id : null;
    const healthy_sectors = record.device_id && infection_status === 'healthy' && VALID_SECTOR_IDS.includes(record.device_id) ? record.device_id : null;
    return {
      ...record,
      sanDiegoTime,
      proximity_count,
      infection_status,
      hour,
      session_half,
      meetings_held,
      infected_cadets,
      infected_sectors,
      healthy_cadets,
      healthy_sectors,
    };
  }

  // Fetch meeting logs
  const fetchMeetingLogs = async (sid) => {
    if (!sid) return [];
    try {
      const logsRef = ref(db, `sessions/${sid}/MeetingLogs`);
      const snapshot = await get(logsRef);
      const data = snapshot.val();
      if (!data) return [];
      // Flatten and normalize
      return Object.values(data).map(log => ({
        ...log,
        sanDiegoTime: toZonedTime(new Date(log.timestamp), 'America/Los_Angeles'),
      }));
    } catch (err) {
      return [];
    }
  };

  // Real-time ESP data listener
  useEffect(() => {
    let espUnsub = null;
    let meetingInterval = null;
    let sessionInterval = null;
    let isMounted = true;

    const setup = async () => {
      setLoading(true);
      setError(null);
      // Get sessionId from localStorage (or Firebase if needed)
      let sid = localStorage.getItem('sessionId') || sessionId;
      setSessionId(sid);
      // Fetch initial meeting logs
      let logs = await fetchMeetingLogs(sid);
      if (isMounted) setMeetingLogs(logs);
      // ESP data listener
      const espRef = ref(db, 'readings');
      espUnsub = onValue(espRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setEspData([]);
          setLoading(false);
          return;
        }
        // Transform and normalize
        let transformedData = Object.values(data)
          .filter(record => record.device_id && VALID_DEVICE_IDS.includes(record.device_id) && record.timestamp)
          .map(record => normalizeRecord(record, logs));
        // Session-half filtering
        const nowSD = toZonedTime(new Date(), 'America/Los_Angeles');
        const noonSD = new Date(nowSD);
        noonSD.setHours(12, 0, 0, 0);
        const filteredData = transformedData.filter(item => {
          if (!(item.sanDiegoTime instanceof Date) || isNaN(item.sanDiegoTime)) return false;
          if (nowSD < noonSD) {
            return item.sanDiegoTime < noonSD;
          } else {
            return item.sanDiegoTime >= noonSD;
          }
        });
        setEspData(filteredData);
        setLoading(false);
      }, (err) => {
        setError(err.message);
        setLoading(false);
      });
      // Poll meeting logs every 30s
      meetingInterval = setInterval(async () => {
        let newLogs = await fetchMeetingLogs(sid);
        if (isMounted) setMeetingLogs(newLogs);
      }, 30000);
      // Poll sessionId every 30s (in case it changes)
      sessionInterval = setInterval(() => {
        let newSid = localStorage.getItem('sessionId');
        if (newSid && newSid !== sid) {
          setSessionId(newSid);
          setup(); // re-setup listeners
        }
      }, 30000);
    };
    setup();
    return () => {
      isMounted = false;
      if (espUnsub) espUnsub();
      if (meetingInterval) clearInterval(meetingInterval);
      if (sessionInterval) clearInterval(sessionInterval);
    };
  }, []);

  // Transform ESP data for different plot types
  const getPlotData = (plotType, xVariable = "timestamp", yVariable = "status") => {
    if (!espData.length) return [];

    switch (plotType) {
      case 'line':
      case 'scatter':
        return [{
          id: 'ESP Data',
          data: espData.map(item => ({
            x: xVariable === "timestamp" ? formatSanDiegoTimeOnly(item.timestamp) : item[xVariable],
            y: item[yVariable] || 0
          }))
        }];

      case 'bar':
        // Group by device ID and count button presses
        const groupedData = espData.reduce((acc, item) => {
          const deviceId = item.id || 'Unknown';
          if (!acc[deviceId]) {
            acc[deviceId] = {
              buttonAPresses: 0,
              buttonBPresses: 0,
              interactions: 0,
              totalPackets: 0
            };
          }
          acc[deviceId].buttonAPresses += item.buttonA || 0;
          acc[deviceId].buttonBPresses += item.buttonB || 0;
          acc[deviceId].interactions += item.beaconArray || 0;
          acc[deviceId].totalPackets += 1;
          return acc;
        }, {});
        
        return [
          {
            id: 'Button A Presses',
            data: Object.entries(groupedData).map(([deviceId, stats]) => ({
              x: deviceId,
              y: stats.buttonAPresses
            }))
          },
          {
            id: 'Button B Presses',
            data: Object.entries(groupedData).map(([deviceId, stats]) => ({
              x: deviceId,
              y: stats.buttonBPresses
            }))
          },
          {
            id: 'Interactions',
            data: Object.entries(groupedData).map(([deviceId, stats]) => ({
              x: deviceId,
              y: stats.interactions
            }))
          }
        ];

      case 'histogram':
        // Create histogram of status values
        const statusCounts = {};
        espData.forEach(item => {
          const status = item.status || 0;
          const bucket = Math.floor(status * 10) / 10; // Group by 0.1 increments
          statusCounts[bucket] = (statusCounts[bucket] || 0) + 1;
        });
        
        return [{
          id: 'Status Distribution',
          data: Object.entries(statusCounts).map(([bucket, count]) => ({
            x: `${parseFloat(bucket).toFixed(1)}`,
            y: count
          }))
        }];

      case 'pie':
        // Count button presses and interactions
        const totalStats = espData.reduce((acc, item) => {
          acc.buttonAPresses += item.buttonA || 0;
          acc.buttonBPresses += item.buttonB || 0;
          acc.interactions += item.beaconArray || 0;
          return acc;
        }, { buttonAPresses: 0, buttonBPresses: 0, interactions: 0 });
        
        return [
          {
            id: 'Button A',
            label: 'Button A Presses',
            value: totalStats.buttonAPresses
          },
          {
            id: 'Button B',
            label: 'Button B Presses',
            value: totalStats.buttonBPresses
          },
          {
            id: 'Interactions',
            label: 'Device Interactions',
            value: totalStats.interactions
          }
        ];

      default:
        return [];
    }
  };

  // Get available variables for plot configuration
  const getAvailableVariables = () => {
    if (!espData.length) return [];
    
    const firstItem = espData[0];
    return Object.keys(firstItem).filter(key => 
      key !== 'id' && 
      typeof firstItem[key] === 'number' || 
      typeof firstItem[key] === 'string'
    );
  };

  // Get unique device IDs
  const getDeviceIds = () => {
    return [...new Set(espData.map(item => item.id).filter(Boolean))];
  };

  // Calculate statistics
  const totalPackets = espData.length;
  const uniqueStudents = getDeviceIds().length;
  const timeRange = espData.length > 0 ? {
    start: espData[0]?.timestamp,
    end: espData[espData.length - 1]?.timestamp
  } : null;

  return {
    // Raw data
    espData,
    loading,
    error,
    
    // Manual fetch function
    fetchESPData: () => {}, // No direct fetch function exposed here as it's real-time
    
    // Plot data functions
    getPlotData,
    getAvailableVariables,
    getDeviceIds,
    
    // Statistics
    totalPackets,
    uniqueStudents,
    timeRange
  };
} 