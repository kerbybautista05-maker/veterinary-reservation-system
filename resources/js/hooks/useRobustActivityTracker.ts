// resources/js/hooks/useRobustActivityTracker.ts

import { useEffect, useRef, useState, useCallback } from 'react';

interface ActivityEvent {
    type: string;
    timestamp: number;
}

interface UseRobustActivityTrackerOptions {
    inactiveThresholdMinutes?: number;
    enableHeartbeat?: boolean;
    heartbeatIntervalMs?: number;
    enableTabDetection?: boolean;
    onInactive?: (minutes: number) => void;
    onActive?: () => void;
    onHeartbeat?: (data: { timestamp: Date; tabVisible: boolean }) => void;
}

export function useRobustActivityTracker(options: UseRobustActivityTrackerOptions = {}) {
    const {
        inactiveThresholdMinutes = 30,
        enableHeartbeat = true,
        heartbeatIntervalMs = 30000,
        enableTabDetection = true,
        onInactive,
        onActive,
        onHeartbeat,
    } = options;

    const [isActive, setIsActive] = useState(true);
    const [inactiveMinutes, setInactiveMinutes] = useState(0);
    const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(document.visibilityState);
    const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
    
    // Use refs to avoid dependency issues
    const lastActivityRef = useRef<Date>(new Date());
    const idleSinceRef = useRef<Date | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reminderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const warnedRef = useRef(false);
    const isMountedRef = useRef(true);
    const activityEventsRef = useRef<ActivityEvent[]>([]);
    
    // Store callbacks in refs to avoid dependency changes
    const onInactiveRef = useRef(onInactive);
    const onActiveRef = useRef(onActive);
    const onHeartbeatRef = useRef(onHeartbeat);
    
    useEffect(() => {
        onInactiveRef.current = onInactive;
        onActiveRef.current = onActive;
        onHeartbeatRef.current = onHeartbeat;
    }, [onInactive, onActive, onHeartbeat]);
    
    const IDLE_WARNING_MS = inactiveThresholdMinutes * 60 * 1000;
    const IDLE_REMIND_MS = 2 * 60 * 1000;
    const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    
    // Send heartbeat to server
    const sendHeartbeat = useCallback(async (eventType: string = 'activity') => {
        if (!enableHeartbeat) return;
        
        try {
            const response = await fetch('/api/time-tracker/heartbeat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    event_type: eventType,
                    timestamp: new Date().toISOString(),
                    tab_visible: document.visibilityState === 'visible',
                    last_activity: lastActivityRef.current.toISOString(),
                }),
                credentials: 'include',
            });
            
            if (response.ok) {
                onHeartbeatRef.current?.({
                    timestamp: new Date(),
                    tabVisible: document.visibilityState === 'visible',
                });
            }
        } catch (error) {
            // Silently fail
            console.debug('Heartbeat failed:', error);
        }
    }, [enableHeartbeat]);
    
    // Reset idle timer (user is active)
    const resetIdleTimer = useCallback(() => {
        const now = new Date();
        lastActivityRef.current = now;
        setLastActivityTime(now);
        
        // Only update state if needed
        if (!isActive) {
            setIsActive(true);
            onActiveRef.current?.();
        }
        
        idleSinceRef.current = null;
        
        // Only update minutes if needed
        if (inactiveMinutes !== 0) {
            setInactiveMinutes(0);
        }
        
        warnedRef.current = false;
        
        // Clear existing timers
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (reminderTimerRef.current) {
            clearInterval(reminderTimerRef.current);
            reminderTimerRef.current = null;
        }
        
        // Set new idle timer
        idleTimerRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;
            
            setIsActive(false);
            const since = new Date();
            idleSinceRef.current = since;
            warnedRef.current = true;
            
            onInactiveRef.current?.(inactiveThresholdMinutes);
            sendHeartbeat('idle_start');
            
            // Clean up any existing reminder
            if (reminderTimerRef.current) {
                clearInterval(reminderTimerRef.current);
            }
            
            reminderTimerRef.current = setInterval(() => {
                if (warnedRef.current && isMountedRef.current) {
                    const mins = Math.round((Date.now() - since.getTime()) / 60000);
                    setInactiveMinutes(mins);
                    onInactiveRef.current?.(mins);
                    sendHeartbeat('idle_reminder');
                }
            }, IDLE_REMIND_MS);
            
        }, IDLE_WARNING_MS);
    }, [isActive, inactiveMinutes, inactiveThresholdMinutes, sendHeartbeat]);
    
    // Handle user activity
    const handleActivity = useCallback(() => {
        const now = new Date();
        const wasInactive = !isActive;
        const inactiveDuration = (now.getTime() - lastActivityRef.current.getTime()) / 60000;
        
        // Record activity event
        activityEventsRef.current.push({ 
            type: 'activity', 
            timestamp: now.getTime() 
        });
        
        // Clean old events
        const cutoff = now.getTime() - 10 * 60 * 1000;
        activityEventsRef.current = activityEventsRef.current.filter(e => e.timestamp > cutoff);
        
        // Reset the idle timer
        resetIdleTimer();
        
        // Send wake signal if coming from inactive
        if (wasInactive || inactiveDuration >= 1) {
            sendHeartbeat('wake');
        }
    }, [isActive, resetIdleTimer, sendHeartbeat]);
    
    // Track tab visibility
    useEffect(() => {
        if (!enableTabDetection) return;
        
        const handleVisibilityChange = () => {
            const newState = document.visibilityState;
            setVisibilityState(newState);
            
            if (newState === 'visible') {
                resetIdleTimer();
                sendHeartbeat('tab_visible');
            } else {
                setIsActive(false);
                sendHeartbeat('tab_hidden');
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [enableTabDetection, resetIdleTimer, sendHeartbeat]);
    
    // Set up activity event listeners
    useEffect(() => {
        isMountedRef.current = true;
        
        const handler = () => handleActivity();
        
        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, handler, { passive: true });
        });
        
        // Initial timer setup
        resetIdleTimer();
        
        // Update inactive minutes display
        const ticker = setInterval(() => {
            if (idleSinceRef.current && isMountedRef.current) {
                const mins = Math.round((Date.now() - idleSinceRef.current.getTime()) / 60000);
                if (mins !== inactiveMinutes) {
                    setInactiveMinutes(mins);
                }
            }
        }, 30_000);
        
        // Set up heartbeat interval
        if (enableHeartbeat) {
            heartbeatIntervalRef.current = setInterval(() => {
                if (isMountedRef.current) {
                    const now = new Date();
                    const inactiveDuration = (now.getTime() - lastActivityRef.current.getTime()) / 60000;
                    
                    if (document.visibilityState === 'visible' && inactiveDuration < 1) {
                        sendHeartbeat('periodic');
                    }
                }
            }, heartbeatIntervalMs);
        }
        
        return () => {
            isMountedRef.current = false;
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, handler);
            });
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
                idleTimerRef.current = null;
            }
            if (reminderTimerRef.current) {
                clearInterval(reminderTimerRef.current);
                reminderTimerRef.current = null;
            }
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
            clearInterval(ticker);
        };
    }, [handleActivity, resetIdleTimer, enableHeartbeat, heartbeatIntervalMs, sendHeartbeat, inactiveMinutes]);
    
    // Get activity stats
    const getActivityStats = useCallback(() => {
        const now = Date.now();
        const lastMinuteEvents = activityEventsRef.current.filter(e => e.timestamp > now - 60000);
        const last5MinutesEvents = activityEventsRef.current.filter(e => e.timestamp > now - 300000);
        
        return {
            eventsLastMinute: lastMinuteEvents.length,
            eventsLast5Minutes: last5MinutesEvents.length,
            isActive,
            inactiveMinutes,
            visibilityState,
            lastActivity: lastActivityRef.current,
        };
    }, [isActive, inactiveMinutes, visibilityState]);
    
    // Manually trigger activity
    const triggerActivity = useCallback(() => {
        handleActivity();
    }, [handleActivity]);
    
    return {
        isActive,
        inactiveMinutes,
        visibilityState,
        lastActivityTime,
        getActivityStats,
        triggerActivity,
        resetIdleTimer,
    };
}

/**
 * Hook to determine if a staff member is actively working
 */
export function useWorkStatus(clockedIn: boolean, clockedOut: boolean) {
    const { isActive, visibilityState, inactiveMinutes, triggerActivity } = useRobustActivityTracker({
        enableHeartbeat: clockedIn && !clockedOut,
        onInactive: undefined,
        onActive: undefined,
    });
    
    const isWorking = clockedIn && !clockedOut;
    const isActivelyWorking = isWorking && isActive && visibilityState === 'visible';
    const isWorkingButAway = isWorking && (!isActive || visibilityState !== 'visible');
    const isIdleLong = isWorkingButAway && inactiveMinutes > 5;
    
    return {
        isWorking,
        isActivelyWorking,
        isWorkingButAway,
        isIdleLong,
        inactiveMinutes,
        triggerActivity,
        status: isActivelyWorking ? 'active' : (isWorkingButAway ? 'away' : 'offline'),
    };
}

export default useRobustActivityTracker;