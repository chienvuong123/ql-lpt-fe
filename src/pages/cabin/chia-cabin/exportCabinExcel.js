import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_CABIN_MINUTES = 150;

const COURSE_BG_PALETTE = [
  "FFD6E7",
  "D6EAF8",
  "D5F5E3",
  "FEF9E7",
  "F5EEF8",
  "FDEBD0",
  "D0ECE7",
  "FDEDEC",
  "E8F8F5",
  "FDF2E9",
];

const META_BG = "FFF2CC";
const RED_ARGB = "FFFF0000";
const WHITE_ARGB = "FFFFFFFF";
const BLACK_ARGB = "FF000000";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getFill = (hex) => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF" + (hex ? hex.replace("#", "") : "FFFFFF") },
});

const doubleBorder = {
  top: { style: "double" },
  left: { style: "double" },
  bottom: { style: "double" },
  right: { style: "double" },
};

function toTitleCase(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (ch) => ch.toUpperCase());
}

/**
 * Format số phút bù giờ thành chuỗi dễ đọc.
 *   0   → ""  (không cần hiển thị)
 *   30  → "30 phút"
 *   60  → "1h"
 *   90  → "1h30 phút"
 */
function fmtMinutes(mins) {
  if (!mins || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h}h`;
  return `${h}h${m} phút`;
}

/**
 * Tính số phút bù giờ của 1 học viên.
 * phut_cabin: số phút đã học (0-150)
 * → 150 - phut_cabin = phút còn thiếu
 */
function remainingMinutes(student) {
  if (student.phut_cabin == null) return null;
  return Math.max(0, TOTAL_CABIN_MINUTES - student.phut_cabin);
}

// ─── Build header merge groups ────────────────────────────────────────────────
function buildHeaderGroups(dayCourses) {
  const groups = [];
  let groupStart = 0;
  let groupCourses = new Set(dayCourses[0]);

  for (let di = 1; di < 7; di++) {
    const cur = dayCourses[di];
    const hasShared = [...cur].some((k) => groupCourses.has(k));
    if (hasShared) {
      cur.forEach((k) => groupCourses.add(k));
    } else {
      groups.push({
        startDi: groupStart,
        endDi: di - 1,
        courses: new Set(groupCourses),
      });
      groupStart = di;
      groupCourses = new Set(cur);
    }
  }
  groups.push({
    startDi: groupStart,
    endDi: 6,
    courses: new Set(groupCourses),
  });
  return groups;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function exportCabinExcel({
  fullSchedule,
  weekDates,
  globalSessions,
  lockedCabins,
  getStudentByMaDk,
  getSessions,
  weekLabel,
}) {
  const workbook = new ExcelJS.Workbook();

  for (let cn = 1; cn <= 5; cn++) {
    const sheet = workbook.addWorksheet(`Cabin ${cn}`);

    const dayCourses = Array.from({ length: 7 }, () => new Set());
    const courseStudents = {};
    const dataCells = [];

    // ── 1. Thu thập dữ liệu ───────────────────────────────────────────────────
    for (let si = 0; si < globalSessions.length; si++) {
      dataCells[si] = [];
      for (let di = 0; di < 7; di++) {
        const dayIdx = (di + 1) % 7;
        const sessions = getSessions(dayIdx);
        const sessForDay = sessions[si];
        const slotKey = `${di}-${globalSessions[si].num}`;
        const lockKey = `${slotKey}-${cn}`;

        if (sessForDay === null) {
          dataCells[si][di] = { noSession: true };
          continue;
        }
        if (lockedCabins[lockKey] === true) {
          dataCells[si][di] = { locked: true };
          continue;
        }

        const slot = fullSchedule[slotKey];
        const maDks = slot?.cabins?.[cn] ?? [];
        const students = maDks.map(getStudentByMaDk).filter(Boolean);

        if (students.length === 0) {
          dataCells[si][di] = { empty: true };
          continue;
        }

        const khoas = [
          ...new Set(students.map((s) => s.khoa_hoc).filter(Boolean)),
        ];
        khoas.forEach((k) => {
          dayCourses[di].add(k);
          if (!courseStudents[k]) courseStudents[k] = [];
          students
            .filter((s) => s.khoa_hoc === k)
            .forEach((s) => courseStudents[k].push(s));
        });
        dataCells[si][di] = { students, khoas };
      }
    }

    // ── 2. Expiry dates ───────────────────────────────────────────────────────
    const courseExpiry = {};
    Object.entries(courseStudents).forEach(([khoa, stList]) => {
      const dates = stList
        .map((s) => s.ngay_ket_thuc)
        .filter(Boolean)
        .map((d) => new Date(d))
        .filter((d) => !isNaN(d.getTime()))
        .sort((a, b) => a - b);
      if (dates.length > 0) {
        const d = dates[0];
        courseExpiry[khoa] =
          `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
    });

    // ── 3. Màu khoá ───────────────────────────────────────────────────────────
    const allCourses = new Set();
    dayCourses.forEach((s) => s.forEach((k) => allCourses.add(k)));
    const courseColor = {};
    let colorIdx = 0;
    allCourses.forEach((k) => {
      courseColor[k] = COURSE_BG_PALETTE[colorIdx % COURSE_BG_PALETTE.length];
      colorIdx++;
    });

    const getCellBg = (di, cellKhoas) => {
      const ks = cellKhoas?.length > 0 ? cellKhoas : [...dayCourses[di]].sort();
      return ks.length > 0 && courseColor[ks[0]]
        ? courseColor[ks[0]]
        : "FFFFFF";
    };

    // ── 4. Row 1: Header cabin + khoá học ────────────────────────────────────
    // Col A: Cabin label
    const cellA1 = sheet.getCell("A1");
    cellA1.value = `Cabin ${cn}`;
    cellA1.fill = getFill("C0392B");
    cellA1.font = {
      name: "Times New Roman",
      bold: true,
      color: { argb: WHITE_ARGB },
      size: 12,
    };
    cellA1.alignment = { horizontal: "center", vertical: "middle" };
    cellA1.border = doubleBorder;

    // Col B..H: tên khoá + hết hạn (rich text)
    const headerGroups = buildHeaderGroups(dayCourses);
    headerGroups.forEach((grp) => {
      const startCol = grp.startDi + 2;
      const endCol = grp.endDi + 2;
      const khoas = [...grp.courses].sort();
      const bg =
        khoas[0] && courseColor[khoas[0]] ? courseColor[khoas[0]] : "EBF5FB";

      const targetCell = sheet.getCell(1, startCol);
      targetCell.fill = getFill(bg);
      targetCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      targetCell.border = doubleBorder;

      // Rich text: tên khoá (bold) + hết hạn (italic) trong cùng 1 ô
      const richText = [];
      khoas.forEach((k, i) => {
        if (i > 0)
          richText.push({
            text: "\n",
            font: { name: "Times New Roman", size: 12 },
          });

        richText.push({
          text: k,
          font: {
            name: "Times New Roman",
            bold: true,
            italic: false,
            color: { argb: RED_ARGB },
            size: 12,
          },
        });

        const exp = courseExpiry[k];
        if (exp) {
          richText.push({
            text: `\n(Hết hạn ${exp})`,
            font: {
              name: "Times New Roman",
              bold: false,
              italic: true,
              color: { argb: RED_ARGB },
              size: 11,
            },
          });
        }
      });

      targetCell.value = { richText };

      if (startCol !== endCol) {
        sheet.mergeCells(1, startCol, 1, endCol);
        for (let c = startCol + 1; c <= endCol; c++) {
          sheet.getCell(1, c).fill = getFill(bg);
          sheet.getCell(1, c).border = doubleBorder;
        }
      }
    });

    // ── 5. Row 2 & 3: Thứ và Ngày ────────────────────────────────────────────
    sheet.mergeCells("A2:A3");
    const cellTimeLabel = sheet.getCell("A2");
    cellTimeLabel.value = "Thời gian";
    cellTimeLabel.fill = getFill(META_BG);
    cellTimeLabel.font = { name: "Times New Roman", bold: true };
    cellTimeLabel.alignment = { horizontal: "center", vertical: "middle" };
    cellTimeLabel.border = doubleBorder;

    const daysVn = [
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
      "Chủ Nhật",
    ];
    for (let i = 0; i < 7; i++) {
      const col = i + 2;

      const cellDay = sheet.getCell(2, col);
      cellDay.value = daysVn[i];
      cellDay.fill = getFill(META_BG);
      cellDay.font = { name: "Times New Roman", bold: true };
      cellDay.alignment = { horizontal: "center", vertical: "middle" };
      cellDay.border = doubleBorder;

      const d = weekDates[i];
      const cellDate = sheet.getCell(3, col);
      cellDate.value = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      cellDate.fill = getFill(META_BG);
      cellDate.font = { name: "Times New Roman" };
      cellDate.alignment = { horizontal: "center", vertical: "middle" };
      cellDate.border = doubleBorder;
    }

    // ── 6. Row 4+: Data ───────────────────────────────────────────────────────
    globalSessions.forEach((sess, si) => {
      const rowIdx = si + 4;

      const cellTime = sheet.getCell(rowIdx, 1);
      cellTime.value = sess.time;
      cellTime.fill = getFill(META_BG);
      cellTime.font = { name: "Times New Roman", bold: true };
      cellTime.alignment = { horizontal: "center", vertical: "middle" };
      cellTime.border = doubleBorder;

      for (let di = 0; di < 7; di++) {
        const colIdx = di + 2;
        const cellData = sheet.getCell(rowIdx, colIdx);
        const cell = dataCells[si]?.[di];

        cellData.border = doubleBorder;

        if (!cell || cell.noSession) continue;

        const bg = getCellBg(di, cell.khoas);
        cellData.fill = getFill(bg);

        if (cell.locked) {
          // Đường chéo X
          cellData.border = {
            ...doubleBorder,
            diagonal: {
              up: true,
              down: true,
              style: "thin",
              color: { argb: "FFAAAAAA" },
            },
          };
          continue;
        }

        if (cell.empty) continue;

        // ── Hiển thị tên học viên ± thời gian bù giờ ─────────────────────────
        const showTime = cell.students.length >= 2;

        if (showTime) {
          // Rich text: tên (đen) + thời gian bù (đỏ italic) nếu có
          const richText = [];
          cell.students.forEach((s, idx) => {
            if (idx > 0)
              richText.push({
                text: "\n",
                font: { name: "Times New Roman", size: 11 },
              });

            const name = toTitleCase(s.ho_ten);
            richText.push({
              text: name,
              font: {
                name: "Times New Roman",
                size: 11,
                bold: false,
                color: { argb: BLACK_ARGB },
              },
            });

            const rem = remainingMinutes(s);
            if (rem != null && rem > 0) {
              const label = fmtMinutes(rem);
              richText.push({
                text: ` (${label})`,
                font: {
                  name: "Times New Roman",
                  size: 11.5,
                  bold: true,
                  italic: true,
                  // color: { argb: RED_ARGB },
                },
              });
            }
          });

          cellData.value = { richText };
        } else {
          // 1 học viên: plain text, không cần thời gian bù
          cellData.value = cell.students
            .map((s) => toTitleCase(s.ho_ten))
            .join("\n");
          cellData.font = {
            name: "Times New Roman",
            size: 11,
            color: { argb: BLACK_ARGB },
          };
        }

        cellData.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      }
    });

    // ── 7. Kích thước cột / hàng ──────────────────────────────────────────────
    sheet.getColumn(1).width = 15;
    for (let i = 2; i <= 8; i++) sheet.getColumn(i).width = 30;

    sheet.getRow(1).height = 80;
    sheet.getRow(2).height = 25;
    sheet.getRow(3).height = 20;
    for (let i = 4; i <= 3 + globalSessions.length; i++)
      sheet.getRow(i).height = 65;
  }

  // ── Export file ───────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  // eslint-disable-next-line no-useless-escape
  const safeName = weekLabel.replace(/[\/\\]/g, "-").replace(/\s+/g, "_");
  saveAs(new Blob([buffer]), `Lich_Cabin_${safeName}.xlsx`);
}
