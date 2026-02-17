import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './CalendarPicker.css';
import './TimePicker.css';

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
                className={`calendar-modal time-picker-modal ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="time-picker-header">
                    <p className="time-picker-title">Select Time</p>
                </div>

                <div className="time-picker-body">
                    {/* Time Display */}
                    <div className="time-picker-focus">
                        <div className="time-picker-display">
                            <span className="time-picker-display-value">
                                {String(display12Hour).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
                            </span>
                            <span className="time-picker-period-badge">
                                {period}
                            </span>
                        </div>
                        <div className="time-picker-period-row">
                            <button
                                onClick={() => handlePeriodChange('AM')}
                                className={`time-picker-period-btn ${period === 'AM' ? 'selected' : ''}`}
                            >
                                AM
                            </button>
                            <button
                                onClick={() => handlePeriodChange('PM')}
                                className={`time-picker-period-btn ${period === 'PM' ? 'selected' : ''}`}
                            >
                                PM
                            </button>
                        </div>
                        <div className="time-picker-quick">
                            {[0, 15, 30, 45].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMinutes(m)}
                                    className={`time-picker-quick-btn ${minutes === m ? 'selected' : ''}`}
                                >
                                    :{String(m).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Selectors */}
                    <div className="time-picker-selectors">
                        {/* Hours */}
                        <div className="time-picker-column">
                            <div className="time-picker-column-label">
                                Hour
                            </div>
                            <div className="time-picker-scroll-container time-scroll">
                                {hoursArray.map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => handleHourChange(h)}
                                        className={`time-picker-option ${display12Hour === h ? 'selected' : ''}`}
                                    >
                                        {String(h).padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Minutes */}
                        <div className="time-picker-column">
                            <div className="time-picker-column-label">
                                Min
                            </div>
                            <div className="time-picker-scroll-container time-scroll">
                                {minutesArray.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMinutes(m)}
                                        className={`time-picker-option ${minutes === m ? 'selected' : ''}`}
                                    >
                                        {String(m).padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="time-picker-actions">
                    <button
                        onClick={handleNow}
                        className="time-picker-btn-secondary"
                    >
                        Now
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="time-picker-btn-primary"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(pickerContent, document.body);
};


