import React, { useState, useEffect } from 'react';

interface TimeSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
    label: string;
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
    value,
    onChange,
    disabled = false,
    error,
    label
}) => {
    const parseTime = (time24: string) => {
        if (!time24) return { hours: '12', minutes: '00', period: 'AM' };

        const [hours24, minutes] = time24.split(':');
        const hoursNum = parseInt(hours24);

        return {
            hours: hoursNum === 0 ? '12' : hoursNum > 12 ? (hoursNum - 12).toString() : hoursNum.toString(),
            minutes: minutes,
            period: hoursNum >= 12 ? 'PM' : 'AM'
        };
    };

    const { hours, minutes, period } = parseTime(value);
    const [localHours, setLocalHours] = useState(hours);
    const [localMinutes, setLocalMinutes] = useState(minutes);
    const [localPeriod, setLocalPeriod] = useState(period);

    const convertTo24Hour = (hours: string, minutes: string, period: string) => {
        let hoursNum = parseInt(hours);

        if (period === 'PM' && hoursNum !== 12) {
            hoursNum += 12;
        } else if (period === 'AM' && hoursNum === 12) {
            hoursNum = 0;
        }

        return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
    };

    useEffect(() => {
        const time24 = convertTo24Hour(localHours, localMinutes, localPeriod);
        if (time24 !== value) {
            onChange(time24);
        }
    }, [localHours, localMinutes, localPeriod]);

    useEffect(() => {
        const { hours, minutes, period } = parseTime(value);
        setLocalHours(hours);
        setLocalMinutes(minutes);
        setLocalPeriod(period);
    }, [value]);

    const selectClassName = `
        relative w-20 px-2 py-2 border rounded-lg bg-white
        appearance-none cursor-pointer
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
        ${error ? 'border-red-500' : 'border-gray-300'}
        focus:outline-none focus:ring-2 focus:ring-primary-500
        text-base leading-6
    `;

    const selectWrapperClassName = `
        relative before:pointer-events-none
        before:absolute before:inset-y-0 before:right-0
        before:flex before:items-center before:px-2
        before:bg-gray-50 before:border-l
        before:border-gray-300 before:rounded-r-lg
        before:content-['▼'] before:text-gray-400 before:text-xs
        ${disabled ? 'before:bg-gray-100' : ''}
    `;

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <div className="flex gap-2">
                {/* Hours */}
                <div className={selectWrapperClassName}>
                    <select
                        value={localHours}
                        onChange={(e) => setLocalHours(e.target.value)}
                        disabled={disabled}
                        className={selectClassName}
                        style={{ zIndex: 30 }} // Ensure proper stacking in modals
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                            <option key={hour} value={hour}>
                                {hour.toString().padStart(2, '0')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Minutes */}
                <div className={selectWrapperClassName}>
                    <select
                        value={localMinutes}
                        onChange={(e) => setLocalMinutes(e.target.value)}
                        disabled={disabled}
                        className={selectClassName}
                        style={{ zIndex: 30 }} // Ensure proper stacking in modals
                    >
                        {Array.from({ length: 60 }, (_, i) => i).map(minute => (
                            <option key={minute} value={minute.toString().padStart(2, '0')}>
                                {minute.toString().padStart(2, '0')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* AM/PM */}
                <div className={selectWrapperClassName}>
                    <select
                        value={localPeriod}
                        onChange={(e) => setLocalPeriod(e.target.value)}
                        disabled={disabled}
                        className={selectClassName}
                        style={{ zIndex: 30 }} // Ensure proper stacking in modals
                    >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};