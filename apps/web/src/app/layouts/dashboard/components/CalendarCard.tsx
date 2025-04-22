import React from 'react';
import { cn } from '@/lib/util';
import ModernShiftCalendar from '@/app/features/shift/components/org-shift-calendar';

interface CalendarCardProps {
    view?: 'week' | 'month';
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarCard = ({ view }: CalendarCardProps) => {


    return (
        <ModernShiftCalendar
            onMonthChange={() => { }}
        />
    );
};

export default CalendarCard;