import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './CalendarPicker.css';

interface TimePickerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTime: { hours: number; minutes: number };
    onTimeSelect: (hours: number, minutes: number) => void;
    closeOnClickOutside?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
    isOpen,
    onClose,
    selectedTime,
    onTimeSelect,
    closeOnClickOutside = true,
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [hours, setHours] = useState(selectedTime.hours);
    const [minutes, setMinutes] = useState(selectedTime.minutes);
    const [period, setPeriod] = useState<'AM' | 'PM'>(selectedTime.hours >= 12 ? 'PM' : 'AM');
    const pickerRef = useRef<HTMLDivElement>(null);

    // Convert 24h to 12h display
    const get12Hour = (h: number) => {
        if (h === 0) return 12;
        if (h > 12) return h - 12;
        return h;
    };

    // Convert 12h + period to 24h
    const to24Hour = (h12: number, p: 'AM' | 'PM') => {
        if (p === 'AM') {
            return h12 === 12 ? 0 : h12;
        } else {
            return h12 === 12 ? 12 : h12 + 12;
        }
    };

    // Reset when picker opens
    useEffect(() => {
        if (isOpen) {
            setHours(selectedTime.hours);
            setMinutes(selectedTime.minutes);
            setPeriod(selectedTime.hours >= 12 ? 'PM' : 'AM');
            setIsClosing(false);
        }
    }, [isOpen, selectedTime]);

    // Handle click outside
    useEffect(() => {
        if (!isOpen || !closeOnClickOutside) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }, 10);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, closeOnClickOutside]);

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 150);
    }, [onClose]);

    const handleConfirm = () => {
        const hour24 = to24Hour(get12Hour(hours), period);
        onTimeSelect(hour24, minutes);
        handleClose();
    };

    const handleNow = () => {
        const now = new Date();
        onTimeSelect(now.getHours(), now.getMinutes());
        handleClose();
    };

    const handleHourChange = (h12: number) => {
        // Store as 24h internally
        setHours(to24Hour(h12, period));
    };

    const handlePeriodChange = (p: 'AM' | 'PM') => {
        setPeriod(p);
        // Update hours to reflect new period
        const current12 = get12Hour(hours);
        setHours(to24Hour(current12, p));
    };

    if (!isOpen) return null;

    const hoursArray = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 12-hour format
    const minutesArray = Array.from({ length: 60 }, (_, i) => i);
    const display12Hour = get12Hour(hours);

    const pickerContent = (
        <div
            className={`calendar-overlay ${isClosing ? 'closing' : ''}`}
            onClick={closeOnClickOutside ? handleClose : undefined}
            style={{
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                ref={pickerRef}
                className={`calendar-modal ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    maxWidth: '260px',
                    width: '90%',
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    overflow: 'hidden',
                    padding: '16px',
                }}
            >
                {/* Header */}
                <p style={{ 
                    color: '#9ca3af', 
                    fontSize: '10px', 
                    fontWeight: '600', 
                    letterSpacing: '1.5px', 
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    marginBottom: '12px',
                }}>
                    Select Time
                </p>

                {/* Time Display */}
                <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                }}>
                    <span style={{ 
                        fontSize: '32px',
                        fontWeight: '300',
                        color: '#1f2937',
                        letterSpacing: '2px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}>
                        {String(display12Hour).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                    </span>
                    <span style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        fontWeight: '500',
                        letterSpacing: '1px',
                    }}>
                        {period}
                    </span>
                </div>

                {/* Time Selectors */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {/* Hours */}
                    <div style={{ flex: 1 }}>
                        <div style={{ 
                            fontSize: '9px', 
                            color: '#9ca3af', 
                            marginBottom: '6px',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: '600'
                        }}>
                            Hour
                        </div>
                        <div 
                            style={{ 
                                height: '100px', 
                                overflowY: 'auto',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                            }}
                            className="time-scroll time-scroll-light"
                        >
                            {hoursArray.map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleHourChange(h)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 4px',
                                        background: display12Hour === h ? '#dbeafe' : 'transparent',
                                        border: 'none',
                                        borderLeft: display12Hour === h ? '3px solid #3b82f6' : '3px solid transparent',
                                        color: display12Hour === h ? '#1e40af' : '#374151',
                                        fontSize: '13px',
                                        fontWeight: display12Hour === h ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        textAlign: 'center',
                                    }}
                                >
                                    {String(h).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Minutes */}
                    <div style={{ flex: 1 }}>
                        <div style={{ 
                            fontSize: '9px', 
                            color: '#9ca3af', 
                            marginBottom: '6px',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: '600'
                        }}>
                            Min
                        </div>
                        <div 
                            style={{ 
                                height: '100px', 
                                overflowY: 'auto',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                            }}
                            className="time-scroll time-scroll-light"
                        >
                            {minutesArray.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMinutes(m)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 4px',
                                        background: minutes === m ? '#dbeafe' : 'transparent',
                                        border: 'none',
                                        borderLeft: minutes === m ? '3px solid #3b82f6' : '3px solid transparent',
                                        color: minutes === m ? '#1e40af' : '#374151',
                                        fontSize: '13px',
                                        fontWeight: minutes === m ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        textAlign: 'center',
                                    }}
                                >
                                    {String(m).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AM/PM */}
                    <div style={{ width: '48px' }}>
                        <div style={{ 
                            fontSize: '9px', 
                            color: 'transparent', 
                            marginBottom: '6px',
                            textAlign: 'center',
                        }}>
                            &nbsp;
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <button
                                onClick={() => handlePeriodChange('AM')}
                                style={{
                                    padding: '12px 4px',
                                    background: period === 'AM' ? '#18181b' : '#ffffff',
                                    border: period === 'AM' ? 'none' : '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    color: period === 'AM' ? '#ffffff' : '#6b7280',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                AM
                            </button>
                            <button
                                onClick={() => handlePeriodChange('PM')}
                                style={{
                                    padding: '12px 4px',
                                    background: period === 'PM' ? '#18181b' : '#ffffff',
                                    border: period === 'PM' ? 'none' : '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    color: period === 'PM' ? '#ffffff' : '#6b7280',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                PM
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                }}>
                    <button
                        onClick={handleNow}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            color: '#374151',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        Now
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: '#18181b',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(pickerContent, document.body);
};


