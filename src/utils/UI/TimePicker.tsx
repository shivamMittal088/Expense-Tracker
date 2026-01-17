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
        >
            <div
                ref={pickerRef}
                className={`calendar-modal ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    maxWidth: '280px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                {/* Header */}
                <div className="calendar-header" style={{ justifyContent: 'center' }}>
                    <span className="calendar-title" style={{ color: 'white' }}>Select Time</span>
                </div>

                {/* Time Display */}
                <div 
                    style={{ 
                        textAlign: 'center', 
                        padding: '16px',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: 'white',
                        letterSpacing: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>{String(display12Hour).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</span>
                    <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>{period}</span>
                </div>

                {/* Time Selectors */}
                <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px' }}>
                    {/* Hours (12-hour) */}
                    <div style={{ flex: 1 }}>
                        <div style={{ 
                            fontSize: '10px', 
                            color: 'rgba(255,255,255,0.5)', 
                            marginBottom: '8px',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Hour
                        </div>
                        <div 
                            style={{ 
                                height: '150px', 
                                overflowY: 'auto',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                            className="time-scroll"
                        >
                            {hoursArray.map((h) => (
                                <button
                                    key={h}
                                    onClick={() => handleHourChange(h)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: display12Hour === h ? 'rgba(255,255,255,0.15)' : 'transparent',
                                        border: 'none',
                                        color: display12Hour === h ? 'white' : 'rgba(255,255,255,0.5)',
                                        fontSize: '14px',
                                        fontWeight: display12Hour === h ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
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
                            fontSize: '10px', 
                            color: 'rgba(255,255,255,0.5)', 
                            marginBottom: '8px',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Min
                        </div>
                        <div 
                            style={{ 
                                height: '150px', 
                                overflowY: 'auto',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                            className="time-scroll"
                        >
                            {minutesArray.map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMinutes(m)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: minutes === m ? 'rgba(255,255,255,0.15)' : 'transparent',
                                        border: 'none',
                                        color: minutes === m ? 'white' : 'rgba(255,255,255,0.5)',
                                        fontSize: '14px',
                                        fontWeight: minutes === m ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {String(m).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AM/PM */}
                    <div style={{ width: '60px' }}>
                        <div style={{ 
                            fontSize: '10px', 
                            color: 'rgba(255,255,255,0.5)', 
                            marginBottom: '8px',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            &nbsp;
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                                onClick={() => handlePeriodChange('AM')}
                                style={{
                                    padding: '12px 8px',
                                    background: period === 'AM' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: period === 'AM' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px',
                                    color: period === 'AM' ? 'white' : 'rgba(255,255,255,0.5)',
                                    fontSize: '13px',
                                    fontWeight: period === 'AM' ? '600' : '400',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                AM
                            </button>
                            <button
                                onClick={() => handlePeriodChange('PM')}
                                style={{
                                    padding: '12px 8px',
                                    background: period === 'PM' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: period === 'PM' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px',
                                    color: period === 'PM' ? 'white' : 'rgba(255,255,255,0.5)',
                                    fontSize: '13px',
                                    fontWeight: period === 'PM' ? '600' : '400',
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
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <button
                        onClick={handleNow}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: 'rgba(255,255,255,0.7)',
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
                            background: 'linear-gradient(to bottom, #ffffff, #f3f3f3)',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'black',
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
