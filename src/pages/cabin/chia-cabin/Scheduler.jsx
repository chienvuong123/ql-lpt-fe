import { CABINS, ALL_SLOTS } from "../data/mockData";
import dayjs from "dayjs";

/**
 * Tự động phân bổ học viên vào cabin/ca/ngày
 * @param {Array} students - danh sách học viên cần xếp
 * @param {Object} config - cấu hình ngày (activeSlotsCount, cutoffSlot)
 * @param {string} startDate - ngày bắt đầu xếp (YYYY-MM-DD)
 * @returns {Object} schedule map: { 'YYYY-MM-DD': { slotId: { cabinId: [students] } } }
 */
export function autoSchedule(students, config, startDate) {
  const { activeSlotsCount, cutoffSlot } = config;
  const activeSlots = ALL_SLOTS.slice(0, activeSlotsCount);
  const effectiveSlots = ALL_SLOTS.slice(0, cutoffSlot); // chỉ xếp đến ca cutoff

  const schedule = {};
  let datePointer = dayjs(startDate);
  let slotIndex = 0;
  let cabinIndex = 0;
  let studentQueue = [...students];

  const STUDENTS_PER_SLOT_CABIN = 8; // mỗi cabin mỗi ca tối đa 8 học viên

  const getOrCreate = (date, slotId, cabinId) => {
    const dateKey = date.format("YYYY-MM-DD");
    if (!schedule[dateKey]) schedule[dateKey] = {};
    if (!schedule[dateKey][slotId]) schedule[dateKey][slotId] = {};
    if (!schedule[dateKey][slotId][cabinId])
      schedule[dateKey][slotId][cabinId] = [];
    return schedule[dateKey][slotId][cabinId];
  };

  while (studentQueue.length > 0) {
    const dateKey = datePointer.format("YYYY-MM-DD");
    const currentSlot = effectiveSlots[slotIndex];
    if (!currentSlot) {
      // Đã hết slot trong ngày (vượt cutoff) → đẩy sang ngày mai
      datePointer = datePointer.add(1, "day");
      slotIndex = 0;
      cabinIndex = 0;
      continue;
    }

    const cabin = CABINS[cabinIndex];
    const bucket = getOrCreate(datePointer, currentSlot.id, cabin.id);

    if (bucket.length < STUDENTS_PER_SLOT_CABIN) {
      const student = studentQueue.shift();
      bucket.push({ ...student, status: "scheduled" });
    } else {
      // cabin đầy → cabin tiếp theo
      cabinIndex++;
      if (cabinIndex >= CABINS.length) {
        // tất cả cabin đầy trong ca này → chuyển ca tiếp theo
        cabinIndex = 0;
        slotIndex++;
        if (slotIndex >= effectiveSlots.length) {
          // vượt cutoff → sang ngày mai
          datePointer = datePointer.add(1, "day");
          slotIndex = 0;
        }
      }
    }
  }

  return schedule;
}

/**
 * Tính tổng số học viên đã xếp cho một ngày
 */
export function getDayStats(schedule, date) {
  const dateKey = typeof date === "string" ? date : date.format("YYYY-MM-DD");
  const dayData = schedule[dateKey];
  if (!dayData) return { total: 0, bySlot: {}, byCabin: {} };

  let total = 0;
  const bySlot = {};
  const byCabin = {};

  Object.entries(dayData).forEach(([slotId, cabins]) => {
    bySlot[slotId] = 0;
    Object.entries(cabins).forEach(([cabinId, students]) => {
      bySlot[slotId] = (bySlot[slotId] || 0) + students.length;
      byCabin[cabinId] = (byCabin[cabinId] || 0) + students.length;
      total += students.length;
    });
  });

  return { total, bySlot, byCabin };
}

export function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => dayjs(weekStart).add(i, "day"));
}
