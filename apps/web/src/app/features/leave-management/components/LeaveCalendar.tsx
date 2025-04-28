// LeaveCalendarTab.tsx
"use client";

import React from 'react';
import LeaveCalendarView from './calendar-view';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users } from "lucide-react";

interface LeaveCalendarTabProps { }

const LeaveCalendarTab: React.FC<LeaveCalendarTabProps> = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Leave Calendar</h2>
            </div>

            <Tabs defaultValue="calendar" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Calendar View
                    </TabsTrigger>
                    <TabsTrigger value="people" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        People View
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar">
                    <LeaveCalendarView />
                </TabsContent>

                <TabsContent value="people">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <h3 className="text-lg font-medium mb-2">People View</h3>
                                <p className="text-muted-foreground">
                                    View leaves organized by team members - coming soon
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default LeaveCalendarTab;