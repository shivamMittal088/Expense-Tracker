import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarPicker.css';

interface CalendarPickerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    maxDate?: Date;
    closeOnClickOutside?: boolean;
    daySpendMap?: Record<string, number>;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const isSameDay = (a: Date, b: Date) => {
    return a.getDate() === b.getDate() &&
           a.getMonth() === b.getMonth() &&
           a.getFullYear() === b.getFullYear();
};

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
    isOpen,
    onClose,
    selectedDate,
    onDateSelect,
    maxDate = new Date(),
    closeOnClickOutside = true,
    daySpendMap = {},
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const [viewDate, setViewDate] = useState(selectedDate);
    const [view, setView] = useState<'days' | 'months' | 'years'>('days');
    const calendarRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 150);
    }, [onClose]);

    // Generate years for year picker (2020 to current year)
    const years = useMemo(() => {
        const currentYear = maxDate.getFullYear();
        const result = [];
        for (let y = currentYear; y >= 2020; y--) {
            result.push(y);
        }
        return result;
    }, [maxDate]);

    // Reset view when calendar opens
    useEffect(() => {
        if (isOpen) {
            setViewDate(selectedDate);
            setView('days');
            setIsClosing(false);
        }
    }, [isOpen, selectedDate]);

    // Handle click outside
    useEffect(() => {
        if (!isOpen || !closeOnClickOutside) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
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
    }, [isOpen, closeOnClickOutside, handleClose]);

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
    }, [isOpen, handleClose]);

    const handleDateClick = (date: Date) => {
        onDateSelect(date);
        handleClose();
    };

    const handleGoToToday = () => {
        const today = new Date();
        onDateSelect(today);
        handleClose();
    };

    const navigateMonth = (delta: number) => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const handleMonthSelect = (monthIndex: number) => {
        setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
        setView('days');
    };

    const handleYearSelect = (year: number) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setView('months');
    };

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; isDisabled: boolean }[] = [];
        
        // Previous month padding
        const prevMonth = new Date(year, month, 0);
        for (let i = startPadding - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonth.getDate() - i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: isSameDay(date, new Date()),
                isSelected: isSameDay(date, selectedDate),
                isDisabled: date > maxDate,
            });
        }
        
        // Current month
        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(year, month, d);
            days.push({
                date,
                isCurrentMonth: true,
                isToday: isSameDay(date, new Date()),
                isSelected: isSameDay(date, selectedDate),
                isDisabled: date > maxDate,
            });
        }
        
        // Next month padding (to fill 6 rows)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: isSameDay(date, new Date()),
                isSelected: isSameDay(date, selectedDate),
                isDisabled: date > maxDate,
            });
        }
        
        return days;
    }, [viewDate, selectedDate, maxDate]);

    const canGoNext = () => {
        const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        return nextMonth <= maxDate;
    };

    const getDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const formatDayAmount = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 1000).toFixed(0)}k`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}k`;
        }
        return `₹${Math.round(amount)}`;
    };

    if (!isOpen) return null;

    const calendarContent = (
        <div
            className={`calendar-overlay ${isClosing ? 'closing' : ''}`}
            onClick={closeOnClickOutside ? handleClose : undefined}
        >
            <div
                ref={calendarRef}
                className={`calendar-modal ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="calendar-header">
                    <button
                        className="calendar-nav-btn"
                        onClick={() => view === 'days' ? navigateMonth(-1) : setView('years')}
                        disabled={view === 'years'}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    
                    <div className="calendar-title">
                        {view === 'days' && (
                            <>
                                <button 
                                    className="calendar-title-btn"
                                    onClick={() => setView('months')}
                                >
                                    {MONTHS[viewDate.getMonth()]}
                                </button>
                                <button 
                                    className="calendar-title-btn"
                                    onClick={() => setView('years')}
                                >
                                    {viewDate.getFullYear()}
                                </button>
                            </>
                        )}
                        {view === 'months' && (
                            <button 
                                className="calendar-title-btn"
                                onClick={() => setView('years')}
                            >
                                {viewDate.getFullYear()}
                            </button>
                        )}
                        {view === 'years' && (
                            <span className="calendar-title-text">Select Year</span>
                        )}
                    </div>
                    
                    <button
                        className="calendar-nav-btn"
                        onClick={() => view === 'days' ? navigateMonth(1) : null}
                        disabled={view !== 'days' || !canGoNext()}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Days View */}
                {view === 'days' && (
                    <div className="calendar-body">
                        <div className="calendar-weekdays">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="calendar-weekday">{day}</div>
                            ))}
                        </div>
                        <div className="calendar-days">
                            {calendarDays.map((day, idx) => (
                                <button
                                    type="button"
                                    key={idx}
                                    className={`calendar-day ${day.isCurrentMonth ? '' : 'outside'} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''} ${day.isDisabled ? 'disabled' : ''} ${daySpendMap[getDateKey(day.date)] > 0 ? 'has-amount' : ''}`}
                                    onClick={() => !day.isDisabled && handleDateClick(day.date)}
                                    disabled={day.isDisabled}
                                    title={daySpendMap[getDateKey(day.date)] > 0 ? `Spent ${formatDayAmount(daySpendMap[getDateKey(day.date)])}` : undefined}
                                    aria-label={daySpendMap[getDateKey(day.date)] > 0 ? `${day.date.toDateString()}, spent ${formatDayAmount(daySpendMap[getDateKey(day.date)])}` : day.date.toDateString()}
                                >
                                    <span className="calendar-day-content">
                                        <span className="calendar-day-number">{day.date.getDate()}</span>
                                        {day.isCurrentMonth && !day.isDisabled && daySpendMap[getDateKey(day.date)] > 0 && (
                                            <span className="calendar-day-amount">{formatDayAmount(daySpendMap[getDateKey(day.date)])}</span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Months View */}
                {view === 'months' && (
                    <div className="calendar-grid calendar-months">
                        {MONTHS.map((month, idx) => {
                            const isDisabled = viewDate.getFullYear() === maxDate.getFullYear() && idx > maxDate.getMonth();
                            return (
                                <button
                                    key={month}
                                    className={`calendar-grid-btn ${viewDate.getMonth() === idx ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                    onClick={() => !isDisabled && handleMonthSelect(idx)}
                                    disabled={isDisabled}
                                >
                                    {month.slice(0, 3)}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Years View */}
                {view === 'years' && (
                    <div className="calendar-grid calendar-years">
                        {years.map(year => (
                            <button
                                key={year}
                                className={`calendar-grid-btn ${viewDate.getFullYear() === year ? 'selected' : ''}`}
                                onClick={() => handleYearSelect(year)}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="calendar-footer">
                    <button className="calendar-today-btn" onClick={handleGoToToday}>
                        Today
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(calendarContent, document.body);
};