/**
 * Slot Generation and Interval Overlap Detection Utility
 * Enforces Section 15 and Section 16 mathematical rules:
 * Conflict exists when: newStart < existingEnd AND newEnd > existingStart
 */

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Checks if two time intervals overlap:
 * newStart < existingEnd AND newEnd > existingStart
 */
const isIntervalOverlapping = (startA, endA, startB, endB) => {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return aStart < bEnd && aEnd > bStart;
};

/**
 * Generates discrete time slots from doctor schedule and flags conflicts against existing appointments
 */
const generateSlotsForSchedule = (schedule, bookedAppointments = []) => {
  const slots = [];
  const scheduleStart = timeToMinutes(schedule.startTime);
  const scheduleEnd = timeToMinutes(schedule.endTime);
  const duration = schedule.slotDuration || 30;

  let currentStart = scheduleStart;

  while (currentStart + duration <= scheduleEnd) {
    const slotStartStr = minutesToTime(currentStart);
    const slotEndStr = minutesToTime(currentStart + duration);

    // Check if slot overlaps with any active booked appointment
    const hasConflict = bookedAppointments.some((apt) => {
      // Exclude cancelled appointments from conflict consideration
      if (apt.status === 'CANCELLED') return false;

      return isIntervalOverlapping(
        slotStartStr,
        slotEndStr,
        apt.startTime,
        apt.endTime
      );
    });

    slots.push({
      startTime: slotStartStr,
      endTime: slotEndStr,
      available: !hasConflict,
    });

    currentStart += duration;
  }

  return slots;
};

/**
 * Maps a Date object or YYYY-MM-DD string to our DayOfWeek enum
 */
const getDayOfWeekFromDate = (dateInput) => {
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dateObj = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00Z`) : dateInput;
  return dayNames[dateObj.getUTCDay()];
};

module.exports = {
  timeToMinutes,
  minutesToTime,
  isIntervalOverlapping,
  generateSlotsForSchedule,
  getDayOfWeekFromDate,
};
