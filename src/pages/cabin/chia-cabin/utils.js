// ─── Time helpers ─────────────────────────────────────────────────────────────
export const timeToMin = (t) =>
  parseInt(t.split(":")[0]) * 60 + parseInt(t.split(":")[1]);

export const minToTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const dateStr = (d) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

// ─── Student type checks ──────────────────────────────────────────────────────
/** Học viên chưa có dữ liệu cabin */
export const isNoData = (s) => !s.bai_cabin && !s.phut_cabin;

/** Học viên có dữ liệu cabin (đã học, có thể còn thiếu giờ) */
export const isHasData = (s) => !!s.bai_cabin || !!s.phut_cabin;

// ─── Week key ─────────────────────────────────────────────────────────────────
/** Trả về key dạng "YYYY-Www" từ một ngày bất kỳ trong tuần */
export const getWeekKey = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7,
  );
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
};

// ─── Remaining minutes ────────────────────────────────────────────────────────
/** Phút HV còn thiếu so với cài đặt chung (duration) */
export const getRemaining = (student, duration) =>
  Math.max(0, duration - (student.phut_cabin || 0));

// ─── Greedy bin-packing ───────────────────────────────────────────────────────
/**
 * Gom học viên thiếu giờ vào các nhóm sao cho:
 *  - Số người <= maxPerCabin
 *  - Tổng phút THIẾU + (n-1) * intervalMinutes < sessionDuration
 */
export const binPackStudents = (
  students,
  sessionDuration,
  maxPerCabin,
  intervalMinutes,
) => {
  const bins = [];
  for (const student of students) {
    const needed = getRemaining(student, sessionDuration);
    let placed = false;
    for (const bin of bins) {
      const newCount = bin.members.length + 1;
      const newTotal = bin.totalNeeded + needed + intervalMinutes;
      if (newCount <= maxPerCabin && newTotal < sessionDuration) {
        bin.members.push(student);
        bin.totalNeeded += needed + intervalMinutes;
        placed = true;
        break;
      }
    }
    if (!placed) bins.push({ members: [student], totalNeeded: needed });
  }
  return bins.map((b) => b.members);
};
