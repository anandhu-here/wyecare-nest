import moment from 'moment';

/**
 * Calculate total hours from a shift pattern timing with billable hours and breaks
 * @param {Object} shiftPattern - The shift pattern object
 * @param {string} homeId - The home ID to find relevant timing
 * @returns {Object} - Hours object with total, billable, and break hours
 */
export const calculateShiftHours = (shiftPattern, homeId) => {
  if (!shiftPattern?.timings || shiftPattern.timings.length === 0) {
    return {
      total: 0,
      billable: 0,
      break: 0,
    };
  }

  // Find the timing for this home
  const timing =
    shiftPattern.timings.find((t) => t.careHomeId === homeId) ||
    shiftPattern.timings[0]; // Fallback to first timing

  if (!timing.startTime || !timing.endTime) {
    return {
      total: 0,
      billable: 0,
      break: 0,
    };
  }

  const startTime = new Date(`2000-01-01T${timing.startTime}:00`);
  const endTime = new Date(`2000-01-01T${timing.endTime}:00`);

  // Handle cases where end time is on the next day
  let totalHours = (endTime - startTime) / (1000 * 60 * 60);
  if (totalHours < 0) totalHours += 24;

  // Use billable hours if defined
  const breakHours = timing.breakHours || 0;
  const billableHours =
    timing.billableHours !== undefined
      ? timing.billableHours
      : Math.max(0, totalHours - breakHours);

  return {
    total: parseFloat(totalHours.toFixed(1)),
    billable: parseFloat(billableHours.toFixed(1)),
    break: parseFloat(breakHours.toFixed(1)),
  };
};

/**
 * Calculate hourly pay rate for a timesheet
 * @param {Object} timesheet - The timesheet record
 * @returns {number} - Hourly pay rate
 */
export const calculateHourlyRate = (timesheet) => {
  const carerRole = timesheet?.carer?.role?.toLowerCase();
  const isWeekend = moment(timesheet?.shift_?.date).isoWeekday() > 5;
  const isEmergency = timesheet?.shift_?.isEmergency;

  const userRateObj = timesheet?.shift_?.shiftPattern?.userTypeRates?.find(
    (rate) => rate.userType?.toLowerCase() === carerRole
  );

  if (!userRateObj) return 0;

  if (isEmergency) {
    return isWeekend
      ? userRateObj.emergencyWeekendRate
      : userRateObj.emergencyWeekdayRate;
  } else {
    return isWeekend ? userRateObj.weekendRate : userRateObj.weekdayRate;
  }
};

/**
 * Generate complete summary statistics from timesheet records
 * @param {Array} timesheets - Array of timesheet records
 * @param {Object} dateRange - The date range for the summary
 * @returns {Object} - Summary statistics
 */
export const generateTimesheetSummary = (timesheets, dateRange) => {
  if (!timesheets || timesheets.length === 0) {
    return {
      totalHours: 0,
      totalBillableHours: 0,
      totalBreakHours: 0,
      totalPay: 0,
      totalShifts: 0,
      avgHoursPerShift: 0,
      avgPayPerShift: 0,
      avgHourlyRate: 0,
      organizations: {},
      topOrganization: null,
      leastOrganization: null,
      dateRange: dateRange,
    };
  }

  let totalHours = 0;
  let totalBillableHours = 0;
  let totalBreakHours = 0;
  let totalPay = 0;
  let regularHours = 0;
  let weekendHours = 0;
  let holidayHours = 0;
  let emergencyHours = 0;
  const organizations = {};
  const staffMembers = {};

  // Process each timesheet
  timesheets.forEach((timesheet) => {
    // Use only the 'home' property as requested
    const org = timesheet.home;
    const orgId = org?._id;
    const orgName = org?.name || 'Unknown Organization';

    // Track staff info
    const staffId = timesheet.carer?._id;
    const staffName =
      `${timesheet.carer?.firstName || ''} ${
        timesheet.carer?.lastName || ''
      }`.trim() || 'Unknown Staff';

    if (!staffId) return;
    if (!orgId) return;

    // Calculate hours and pay using enhanced function
    const hours = calculateShiftHours(
      timesheet.shift_?.shiftPattern,
      timesheet.shift_?.homeId
    );

    const hourlyRate = calculateHourlyRate(timesheet);
    const pay = hours.billable * hourlyRate;

    // Add to totals
    totalHours += hours.total;
    totalBillableHours += hours.billable;
    totalBreakHours += hours.break;
    totalPay += pay;

    // Track by organization
    if (!organizations[orgId]) {
      organizations[orgId] = {
        name: orgName,
        totalHours: 0,
        totalBillableHours: 0,
        totalBreakHours: 0,
        totalPay: 0,
        shifts: 0,
      };
    }

    organizations[orgId].totalHours += hours.total;
    organizations[orgId].totalBillableHours += hours.billable;
    organizations[orgId].totalBreakHours += hours.break;
    organizations[orgId].totalPay += pay;
    organizations[orgId].shifts += 1;

    // Track by staff member
    if (!staffMembers[staffId]) {
      staffMembers[staffId] = {
        id: staffId,
        name: staffName,
        role: timesheet.carer?.role || 'Unknown',
        totalHours: 0,
        totalBillableHours: 0,
        totalBreakHours: 0,
        totalPay: 0,
        shifts: 0,
      };
    }

    staffMembers[staffId].totalHours += hours.total;
    staffMembers[staffId].totalBillableHours += hours.billable;
    staffMembers[staffId].totalBreakHours += hours.break;
    staffMembers[staffId].totalPay += pay;
    staffMembers[staffId].shifts += 1;

    // Categorize hours
    const isWeekend = moment(timesheet?.shift_?.date).isoWeekday() > 5;
    const isEmergency = timesheet?.shift_?.isEmergency;
    const isHoliday = timesheet?.isHoliday;

    if (isHoliday) {
      holidayHours += hours.billable;
    } else if (isEmergency) {
      emergencyHours += hours.billable;
    } else if (isWeekend) {
      weekendHours += hours.billable;
    } else {
      regularHours += hours.billable;
    }
  });

  // Calculate averages
  const totalShifts = timesheets.length;
  const avgHoursPerShift =
    totalShifts > 0 ? totalBillableHours / totalShifts : 0;
  const avgPayPerShift = totalShifts > 0 ? totalPay / totalShifts : 0;
  const avgHourlyRate =
    totalBillableHours > 0 ? totalPay / totalBillableHours : 0;

  // Find top and least organizations based on billable hours
  let topOrgId = null;
  let leastOrgId = null;
  let maxHours = -1;
  let minHours = Number.MAX_VALUE;

  Object.entries(organizations).forEach(([id, org]) => {
    if (org.totalBillableHours > maxHours) {
      maxHours = org.totalBillableHours;
      topOrgId = id;
    }

    if (org.totalBillableHours < minHours) {
      minHours = org.totalBillableHours;
      leastOrgId = id;
    }
  });

  // Find top and least staff members
  let topStaffId = null;
  let leastStaffId = null;
  maxHours = -1;
  minHours = Number.MAX_VALUE;

  Object.entries(staffMembers).forEach(([id, staff]) => {
    if (staff.totalBillableHours > maxHours) {
      maxHours = staff.totalBillableHours;
      topStaffId = id;
    }

    if (staff.totalBillableHours < minHours) {
      minHours = staff.totalBillableHours;
      leastStaffId = id;
    }
  });

  // Create summary object
  const summary = {
    totalHours,
    totalBillableHours,
    totalBreakHours,
    totalPay,
    totalShifts,
    regularHours,
    weekendHours,
    holidayHours,
    emergencyHours,
    avgHoursPerShift,
    avgPayPerShift,
    avgHourlyRate,
    organizations,
    staffMembers,
    dateRange,
  };

  // Add top and least organizations
  if (topOrgId) {
    summary.topOrganization = {
      name: organizations[topOrgId].name,
      hours: organizations[topOrgId].totalBillableHours,
      percentage:
        (organizations[topOrgId].totalBillableHours / totalBillableHours) * 100,
    };
  }

  if (leastOrgId && Object.keys(organizations).length > 1) {
    summary.leastOrganization = {
      name: organizations[leastOrgId].name,
      hours: organizations[leastOrgId].totalBillableHours,
      percentage:
        (organizations[leastOrgId].totalBillableHours / totalBillableHours) *
        100,
    };
  }

  // Add top and least staff members
  if (topStaffId) {
    summary.topStaff = {
      name: staffMembers[topStaffId].name,
      role: staffMembers[topStaffId].role,
      hours: staffMembers[topStaffId].totalBillableHours,
      percentage:
        (staffMembers[topStaffId].totalBillableHours / totalBillableHours) *
        100,
    };
  }

  if (leastStaffId && Object.keys(staffMembers).length > 1) {
    summary.leastStaff = {
      name: staffMembers[leastStaffId].name,
      role: staffMembers[leastStaffId].role,
      hours: staffMembers[leastStaffId].totalBillableHours,
      percentage:
        (staffMembers[leastStaffId].totalBillableHours / totalBillableHours) *
        100,
    };
  }

  return summary;
};
