import React, { useState, useMemo, useCallback } from "react";
import {
  CalendarOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  SearchOutlined,
  BgColorsOutlined,
  UserOutlined,
  DragOutlined,
  DownOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  Input,
  Button,
  Empty,
  message,
  Select,
  Row,
  Col,
  Card,
  Table,
  Popover,
  Tag,
  Tooltip,
  Dropdown,
  Modal,
  Form,
  InputNumber,
  Tabs,
  Switch,
  TimePicker,
} from "antd";
import SettingsModal from "./chia-cabin/SettingsModal";
import StudentDetailDrawer from "./chia-cabin/StudentDetailDrawer";
import { generateStudents } from "./chia-cabin/mockData";
import { formatMinutesToHM } from "../../util/helper";
import dayjs from "dayjs";

// ─── Mini card trong popover ─────────────────────────────────────────────────
const StudentMiniCard = ({ student, onRemove, onViewDetail, isDragging }) => (
  <div
    className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${
      isDragging
        ? "opacity-40 border-blue-300 bg-blue-50"
        : "border-gray-100 bg-white hover:border-blue-200"
    }`}
  >
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-gray-800 text-xs truncate">
        {student.ho_ten}
      </div>
      <div className="text-[11px] text-gray-500">Mã: {student.ma_dk}</div>
      <div className="flex gap-1 mt-1 flex-wrap">
        {student.bai_cabin !== null && (
          <Tag color="blue" className="!text-[10px] !px-1 !py-0 !m-0">
            Bài {student.bai_cabin}
          </Tag>
        )}
        {student.hang_xe && (
          <Tag
            color={student.hang_xe === "B1" ? "magenta" : "geekblue"}
            className="!text-[10px] !px-1 !py-0 !m-0"
          >
            Hạng {student.hang_xe}
          </Tag>
        )}
        {student.khoa_hoc && (
          <Tag color="default" className="!text-[10px] !px-1 !py-0 !m-0">
            {student.khoa_hoc}
          </Tag>
        )}
        {student.phut_cabin !== null && (
          <Tag color="cyan" className="!text-[10px] !px-1 !py-0 !m-0">
            {student.phut_cabin} ph
          </Tag>
        )}
        {student.loai_ly_thuyet && (
          <Tag color="purple" className="!text-[10px] !px-1 !py-0 !m-0">
            LT
          </Tag>
        )}
        {student.loai_het_mon && (
          <Tag color="gold" className="!text-[10px] !px-1 !py-0 !m-0">
            HM
          </Tag>
        )}
      </div>
      <div className="text-[11px] text-gray-400 mt-0.5 truncate">
        GV: {student.giao_vien}
      </div>
    </div>
    <div className="flex flex-col gap-1 items-end flex-shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewDetail(student);
        }}
        className="text-blue-500 hover:text-blue-700 text-[11px] underline whitespace-nowrap"
      >
        Chi tiết
      </button>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-red-400 hover:text-red-600"
        >
          <DeleteOutlined style={{ fontSize: 11 }} />
        </button>
      )}
    </div>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeToMin = (t) =>
  parseInt(t.split(":")[0]) * 60 + parseInt(t.split(":")[1]);
const minToTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// Kiểm tra học viên chưa có dữ liệu cabin
const isNoData = (s) => s.bai_cabin === null && s.phut_cabin === null;

// Kiểm tra học viên có dữ liệu nhưng chưa đủ giờ
const isHasData = (s) => s.phut_cabin !== null;

// Lấy key tuần (YYYY-Www)
const getWeekKey = (date) => {
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

// ─── Helper: tính số phút HV còn THIẾU so với cài đặt chung ────────────────
// VD: duration=150, phut_cabin=120 → còn thiếu 30 phút
const getRemaining = (student, duration) =>
  Math.max(0, duration - (student.phut_cabin || 0));

// ─── Greedy bin-packing với giới hạn cabin ───────────────────────────────────
/**
 * Gom học viên thiếu giờ vào các nhóm sao cho:
 * - Số người <= maxPerCabin
 * - Tổng phút THIẾU + (n-1) * intervalMinutes <= sessionDuration
 *   (mỗi HV chỉ cần học phần còn thiếu của mình trong ca này)
 */
const binPackStudents = (
  students,
  sessionDuration,
  maxPerCabin,
  intervalMinutes,
) => {
  const bins = []; // mỗi bin = { members: [], totalNeeded: number }
  for (const student of students) {
    const needed = getRemaining(student, sessionDuration);
    let placed = false;
    for (const bin of bins) {
      const newCount = bin.members.length + 1;
      // Tổng = phút thiếu của tất cả HV + khoảng cách giữa các HV
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

// ─── Component chính ─────────────────────────────────────────────────────────
const LichCabin = () => {
  const [allStudents] = useState(() => generateStudents(300));

  const [globalConfig, setGlobalConfig] = useState({
    duration: 150,
    startTime: "07:00",
    endTime: "19:30",
    maxPerCabin: 4, // Giới hạn số người tối đa trong 1 cabin
    intervalMinutes: 10, // Khoảng cách giữa các học viên (phút)
    b1Cabins: 2,
    b2Cabins: 3,
  });

  // weekSchedules: { [weekKey]: { assignedMaDks: Set, schedule: {} } }
  const [weekSchedules, setWeekSchedules] = useState({});

  const [search, setSearch] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [settingsModal, setSettingsModal] = useState(false);
  const [cabinLimitModal, setCabinLimitModal] = useState(false);
  const [week, setWeek] = useState(new Date("2026-03-23"));
  const [studentDetail, setStudentDetail] = useState(null);
  const [settingsTab, setSettingsTab] = useState("global");
  const [filterCabin, setFilterCabin] = useState("all");
  const [openPopover, setOpenPopover] = useState(null);

  // drag: { maDks: string[], source: null | { type:"cabin"|"cabin-all", di, sn, cn } }
  const [dragState, setDragState] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [listDropOver, setListDropOver] = useState(false);

  // Lấy weekKey hiện tại
  const weekKey = useMemo(() => getWeekKey(week), [week]);

  // Lấy data của tuần hiện tại
  const currentWeekData = useMemo(
    () => weekSchedules[weekKey] || { assignedMaDks: new Set(), schedule: {}, dayConfigs: {} },
    [weekSchedules, weekKey],
  );

  const assignedMaDks = currentWeekData.assignedMaDks;
  const schedule = currentWeekData.schedule;
  const dayConfigs = currentWeekData.dayConfigs || {};
  const lockedCabins = currentWeekData.lockedCabins || {};

  // Helper để update tuần hiện tại
  const updateCurrentWeek = useCallback(
    (updater) => {
      setWeekSchedules((prev) => {
        const old = prev[weekKey] || { assignedMaDks: new Set(), schedule: {}, dayConfigs: {} };
        const updated = typeof updater === "function" ? updater(old) : updater;
        return { ...prev, [weekKey]: { ...old, ...updated } };
      });
    },
    [weekKey],
  );

  const toggleLock = useCallback((slotKey) => {
    updateCurrentWeek((old) => {
      const locks = old.lockedCabins || {};
      return {
        lockedCabins: {
          ...locks,
          [slotKey]: !locks[slotKey]
        }
      };
    });
  }, [updateCurrentWeek]);

  const setAssignedMaDks = useCallback(
    (newSet) => {
      updateCurrentWeek((old) => ({ ...old, assignedMaDks: newSet }));
    },
    [updateCurrentWeek],
  );

  const setSchedule = useCallback(
    (newScheduleOrUpdater) => {
      updateCurrentWeek((old) => ({
        ...old,
        schedule:
          typeof newScheduleOrUpdater === "function"
            ? newScheduleOrUpdater(old.schedule)
            : newScheduleOrUpdater,
      }));
    },
    [updateCurrentWeek],
  );

  const setDayConfigs = useCallback(
    (newConfigsOrUpdater) => {
      updateCurrentWeek((old) => ({
        ...old,
        dayConfigs:
          typeof newConfigsOrUpdater === "function"
            ? newConfigsOrUpdater(old.dayConfigs || {})
            : newConfigsOrUpdater,
      }));
    },
    [updateCurrentWeek],
  );

  // ── Schedule helpers ──
  const getDayConfig = useCallback(
    (dayIdx) => {
      const override = dayConfigs[dayIdx];
      if (override?.noSessions) return { noSessions: true };
      return {
        start: override?.start ?? globalConfig.startTime,
        end: override?.end ?? globalConfig.endTime,
        noSessions: false,
      };
    },
    [dayConfigs, globalConfig],
  );

  const globalSessions = useMemo(() => {
    const arr = [];
    let start = timeToMin(globalConfig.startTime);
    const endMin = timeToMin(globalConfig.endTime);
    let i = 1;
    while (start + globalConfig.duration <= endMin) {
      arr.push({
        num: i,
        startMin: start,
        endMin: start + globalConfig.duration,
        time: `${minToTime(start)}-${minToTime(start + globalConfig.duration)}`,
      });
      start += globalConfig.duration;
      i++;
    }
    return arr;
  }, [globalConfig.startTime, globalConfig.endTime, globalConfig.duration]);

  const getSessions = useCallback(
    (dayIdx) => {
      const cfg = getDayConfig(dayIdx);
      if (cfg.noSessions) return globalSessions.map(() => null);
      
      const dayStartMin = timeToMin(cfg.start);
      const dayEndMin = timeToMin(cfg.end);

      return globalSessions.map(gSess => {
        if (gSess.startMin >= dayStartMin && gSess.endMin <= dayEndMin) {
          return gSess;
        }
        return null;
      });
    },
    [getDayConfig, globalSessions],
  );

  const weekDates = useMemo(() => {
    const w = new Date(week);
    const day = w.getDay();
    w.setDate(w.getDate() - day + (day === 0 ? -6 : 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(w);
      d.setDate(w.getDate() + i);
      return d;
    });
  }, [week]);

  const initSchedule = useMemo(() => {
    const s = {};
    weekDates.forEach((_, di) => {
      const dayIdx = (di + 1) % 7;
      getSessions(dayIdx).forEach((sess) => {
        if (sess) {
          s[`${di}-${sess.num}`] = {
            time: sess.time,
            cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
          };
        }
      });
    });
    return s;
  }, [weekDates, getSessions]);

  const fullSchedule = useMemo(
    () => ({ ...initSchedule, ...schedule }),
    [initSchedule, schedule],
  );

  const getStudentByMaDk = useCallback(
    (maDk) => allStudents.find((s) => s.ma_dk === maDk),
    [allStudents],
  );

  // Tổng học viên đã được chia ở TẤT CẢ các tuần
  const allAssignedMaDks = useMemo(() => {
    const all = new Set();
    Object.values(weekSchedules).forEach((wd) => {
      wd.assignedMaDks.forEach((id) => all.add(id));
    });
    return all;
  }, [weekSchedules]);

  // ── Tổng số slot trống của tuần ──
  const totalEmptySlots = useMemo(() => {
    let count = 0;
    Object.values(fullSchedule).forEach((slot) => {
      [1, 2, 3, 4, 5].forEach((cn) => {
        if (slot.cabins[cn].length === 0) count++;
      });
    });
    return count;
  }, [fullSchedule]);

  // ─── Tính tổng thời gian CẦN DÙNG của cabin ────────────────────────────────
  /**
   * Mỗi HV chỉ cần học phần CÒN THIẾU trong ca này:
   *   phut_thieu = duration - phut_cabin  (VD: 150 - 120 = 30 phút)
   *
   * Tổng ca = Σ(phut_thieu) + (n-1) × intervalMinutes
   *
   * Nếu toàn bộ là noData → chỉ kiểm tra số lượng (không tính phút)
   */
  const calcCabinTime = useCallback(
    (students) => {
      if (students.length === 0) return 0;
      const hasDataStudents = students.filter(isHasData);
      if (hasDataStudents.length === 0) return 0;
      // Phút còn thiếu của từng HV (chỉ tính HV có dữ liệu)
      const totalNeeded = hasDataStudents.reduce(
        (sum, s) => sum + getRemaining(s, globalConfig.duration),
        0,
      );
      // Khoảng cách chỉ tính khi có >= 2 HV trong cabin
      const n = students.length;
      const intervals = n > 1 ? (n - 1) * globalConfig.intervalMinutes : 0;
      return totalNeeded + intervals;
    },
    [globalConfig.duration, globalConfig.intervalMinutes],
  );

  // ────────────────────────────────────────────────────────────────────────────
  // canDropIntoCabin - quy tắc rõ ràng:
  //  • noData luôn phải ở RIÊNG 1 cabin (không ghép với bất kỳ ai)
  //  • Cabin đang có noData → chỉ được swap (xử lý riêng ở handleDrop), không thêm
  //  • HV kéo là noData → chỉ vào cabin TRỐNG (hoặc swap — xử lý riêng)
  //  • Ghép nhiều người chỉ dành cho hasData, tuân theo maxPerCabin & thời gian
  // ────────────────────────────────────────────────────────────────────────────
  const canDropIntoCabin = useCallback(
    (targetMaDkList, droppingMaDks, targetCn, slotKey) => {
      if (slotKey && lockedCabins[slotKey]) return false;
      const { duration, maxPerCabin, b1Cabins } = globalConfig;
      const targetType = Number(targetCn) > 5 - b1Cabins ? "B1" : "B2";

      const existingStudents = targetMaDkList
        .map(getStudentByMaDk)
        .filter(Boolean);
      const droppingStudents = droppingMaDks
        .map(getStudentByMaDk)
        .filter(Boolean);

      // KHÔNG cho phép thả nếu sai hạng xe
      if (droppingStudents.some((s) => s.hang_xe !== targetType)) {
        return false;
      }

      // ── Cabin đang có noData → không cho thêm vào (chỉ swap, xử lý riêng)
      if (existingStudents.some(isNoData)) return false;

      // ── HV kéo vào có noData → chỉ vào cabin TRỐNG (không có ai)
      if (droppingStudents.some(isNoData)) {
        return existingStudents.length === 0;
      }

      // ── Từ đây: cả 2 bên đều là hasData ──
      const allInCabin = [...existingStudents, ...droppingStudents];

      // Kiểm tra số lượng tối đa
      if (allInCabin.length > maxPerCabin) return false;

      // Kiểm tra tổng thời gian
      const totalTime = calcCabinTime(allInCabin);
      return totalTime < duration;
    },
    [globalConfig, getStudentByMaDk, calcCabinTime, lockedCabins],
  );

  // ────────────────────────────────────────────────────────────────────────────
  // AUTO-ASSIGN
  // ────────────────────────────────────────────────────────────────────────────
  const handleAutoAssign = (mode = "all") => {
    // Kiểm tra xem có slot nào đã có người xếp nhưng chưa bị khoá không
    let hasUnlockedNonEmpty = false;
    Object.keys(fullSchedule).forEach((key) => {
      [1, 2, 3, 4, 5].forEach((cn) => {
        const slotKey = `${key}-${cn}`;
        if (
          !lockedCabins[slotKey] &&
          fullSchedule[key]?.cabins[cn]?.length > 0
        ) {
          hasUnlockedNonEmpty = true;
        }
      });
    });

    if (hasUnlockedNonEmpty) {
      Modal.confirm({
        title: "Xác nhận Tự động chia",
        content:
          "Tuần này đã có sẵn học viên trên Lịch. Bạn muốn XOÁ TRỐNG các suất chưa bị khoá để chia lại từ đầu, hay GIỮ NGUYÊN và chỉ chia tiếp vào các suất còn trống?",
        okText: "Xoá và Chia lại",
        okType: "danger",
        cancelText: "Chỉ điền suất trống",
        onOk: () => doAutoAssign(mode, true),
        onCancel: () => doAutoAssign(mode, false),
      });
    } else {
      doAutoAssign(mode, false);
    }
  };

  const doAutoAssign = (mode = "all", resetUnlocked = false) => {
    try {
      const newSchedule = JSON.parse(JSON.stringify(fullSchedule));
      const newAssignedThisWeek = new Set(assignedMaDks);

      if (resetUnlocked) {
        // Step 1: CLEAR unlocked slots for the current week
        Object.keys(newSchedule).forEach((key) => {
          [1, 2, 3, 4, 5].forEach((cn) => {
            const slotKey = `${key}-${cn}`;
            if (!lockedCabins[slotKey]) {
              const studentsInSlot = newSchedule[key].cabins[cn] || [];
              studentsInSlot.forEach((id) => newAssignedThisWeek.delete(id));
              newSchedule[key].cabins[cn] = [];
            }
          });
        });
      }

      // Step 2: Tính toán lại global unassigned dựa trên danh sách vừa reset
      const globalAssigned = new Set();
      Object.keys(weekSchedules).forEach((wk) => {
        if (wk !== weekKey) {
          weekSchedules[wk].assignedMaDks.forEach((id) =>
            globalAssigned.add(id),
          );
        }
      });
      newAssignedThisWeek.forEach((id) => globalAssigned.add(id));

      const newAssigned = new Set();

      // Học viên chưa được chia (xét theo global tuần cộng dồn)
      const unassigned = allStudents.filter(
        (s) => !globalAssigned.has(s.ma_dk),
      ).sort((a, b) => {
        const dateA = new Date(a.ngay_ket_thuc || 0).getTime();
        const dateB = new Date(b.ngay_ket_thuc || 0).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.giao_vien || "").localeCompare(b.giao_vien || "");
      });

      const groupA = unassigned.filter(isNoData);
      const groupA_B1 = groupA.filter((s) => s.hang_xe === "B1");
      const groupA_B2 = groupA.filter((s) => s.hang_xe === "B2");

      // Nhóm B: HV có dữ liệu và còn thiếu giờ (phut_thieu > 0)
      const groupB =
        mode === "all"
          ? unassigned.filter((s) => {
              if (!isHasData(s)) return false;
              const remaining = getRemaining(s, globalConfig.duration);
              return remaining > 0 && remaining <= globalConfig.duration;
            })
          : [];

      const groupB_B1 = groupB.filter((s) => s.hang_xe === "B1");
      const groupB_B2 = groupB.filter((s) => s.hang_xe === "B2");

      const binsB_B1 = mode === "all" ? binPackStudents(groupB_B1, globalConfig.duration, globalConfig.maxPerCabin, globalConfig.intervalMinutes) : [];
      const binsB_B2 = mode === "all" ? binPackStudents(groupB_B2, globalConfig.duration, globalConfig.maxPerCabin, globalConfig.intervalMinutes) : [];

      // Dùng initSchedule để LOẠI BỎ ghost keys
      const emptySlotsB1 = [];
      const emptySlotsB2 = [];
      Object.keys(initSchedule)
        .sort((a, b) => {
          const [diA, snA] = a.split("-").map(Number);
          const [diB, snB] = b.split("-").map(Number);
          if (diA !== diB) return diA - diB;
          return snA - snB;
        })
        .forEach((key) => {
          [1, 2, 3, 4, 5].forEach((cn) => {
            // Đảm bảo không ghi đè nếu đã có người gán
            if (newSchedule[key] && newSchedule[key].cabins[cn]?.length === 0) {
              const slotKey = `${key}-${cn}`;
              if (!lockedCabins[slotKey]) {
                if (Number(cn) > 5 - globalConfig.b1Cabins) {
                  emptySlotsB1.push({ key, cn });
                } else {
                  emptySlotsB2.push({ key, cn });
                }
              }
            }
          });
        });

      // Helper phân bổ
      const fillSlots = (studentsOrBins, isBin, emptySlots) => {
        let slotIdx = 0;
        for (const item of studentsOrBins) {
          if (slotIdx >= emptySlots.length) break;
          const { key, cn } = emptySlots[slotIdx++];
          
          if (!newSchedule[key]) {
             newSchedule[key] = { time: initSchedule[key].time, cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] } };
          }
          
          const maDksToAssign = isBin ? item.map((s) => s.ma_dk) : [item.ma_dk];
          newSchedule[key].cabins[cn] = maDksToAssign;
          maDksToAssign.forEach((id) => newAssigned.add(id));
        }
        // Trả về số slot còn trống
        return emptySlots.slice(slotIdx);
      };

      // Xếp B1
      let remainB1 = fillSlots(groupA_B1, false, emptySlotsB1);
      if (mode === "all") fillSlots(binsB_B1, true, remainB1);

      // Xếp B2
      let remainB2 = fillSlots(groupA_B2, false, emptySlotsB2);
      if (mode === "all") fillSlots(binsB_B2, true, remainB2);

      // Cập nhật state
      updateCurrentWeek(() => ({
        schedule: newSchedule,
        assignedMaDks: new Set([...newAssignedThisWeek, ...newAssigned]),
      }));

      const cntA = groupA.filter((s) => newAssigned.has(s.ma_dk)).length;
      const cntB =
        mode === "all"
          ? groupB.filter((s) => newAssigned.has(s.ma_dk)).length
          : 0;

      const skipped = unassigned.length - newAssigned.size;

      let msg = `Đã chia ${newAssigned.size} học viên (${cntA} chưa có dữ liệu`;
      if (cntB > 0) msg += `, ${cntB} có dữ liệu cabin`;
      msg += `)`;

      if (skipped > 0) {
        msg += `. Còn ${skipped} học viên chưa được xếp (hết slot).`;
      }

      message.success(msg, 5);
    } catch (err) {
      console.error("Auto-assign error:", err);
      message.error("Xảy ra lỗi khi tự động chia lịch. Vui lòng thử lại.");
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // REMOVE
  // ────────────────────────────────────────────────────────────────────────────
  const handleRemoveStudent = useCallback(
    (di, sn, cn, maDk) => {
      const key = `${di}-${sn}`;
      const newSchedule = JSON.parse(JSON.stringify(fullSchedule));
      newSchedule[key].cabins[cn] = newSchedule[key].cabins[cn].filter(
        (id) => id !== maDk,
      );
      const stillExists = Object.keys(newSchedule).some((k) =>
        Object.values(newSchedule[k].cabins).some((c) => c.includes(maDk)),
      );
      const newAssigned = new Set(assignedMaDks);
      if (!stillExists) newAssigned.delete(maDk);

      updateCurrentWeek(() => ({
        schedule: newSchedule,
        assignedMaDks: newAssigned,
      }));
      setOpenPopover(null);
    },
    [fullSchedule, assignedMaDks, updateCurrentWeek],
  );

  // ────────────────────────────────────────────────────────────────────────────
  // DRAG & DROP (với swap logic)
  // ────────────────────────────────────────────────────────────────────────────

  const handleDragStartFromList = (e, maDk) => {
    const ds = { maDks: [maDk], source: null };
    setDragState(ds);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("drag", JSON.stringify(ds));
  };

  const handleDragStartOne = (e, maDk, di, sn, cn) => {
    const ds = { maDks: [maDk], source: { type: "cabin", di, sn, cn } };
    setDragState(ds);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("drag", JSON.stringify(ds));
  };

  const handleDragStartAll = (e, maDkList, di, sn, cn) => {
    const ds = { maDks: maDkList, source: { type: "cabin-all", di, sn, cn } };
    setDragState(ds);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("drag", JSON.stringify(ds));
  };

  const handleDragOver = useCallback(
    (e, di, sn, cn) => {
      e.preventDefault();
      const slotKey = `${di}-${sn}-${cn}`;
      if (dragOverSlot !== slotKey) setDragOverSlot(slotKey);
    },
    [dragOverSlot],
  );

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverSlot(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState(null);
    setDragOverSlot(null);
    setListDropOver(false);
  }, []);

  // Kiểm tra xem có thể swap không:
  // Điều kiện: HV kéo là noData (1 người) VÀ cabin đích đang có đúng 1 noData
  // Áp dụng cả khi kéo từ list lẫn từ cabin khác
  const canSwap = useCallback(
    (targetMaDkList, droppingMaDks, targetCn) => {
      if (droppingMaDks.length !== 1 || targetMaDkList.length !== 1)
        return false;
      const droppingStudent = getStudentByMaDk(droppingMaDks[0]);
      const targetStudent = getStudentByMaDk(targetMaDkList[0]);
      if (!droppingStudent || !targetStudent) return false;
      
      const targetType = Number(targetCn) > 5 - globalConfig.b1Cabins ? "B1" : "B2";
      if (droppingStudent.hang_xe !== targetType) return false;

      // Chỉ swap khi HV kéo là noData VÀ HV đích là noData
      return isNoData(droppingStudent) && isNoData(targetStudent);
    },
    [getStudentByMaDk, globalConfig.b1Cabins],
  );

  const handleDrop = useCallback(
    (e, targetDi, targetSn, targetCn) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverSlot(null);

      let ds = dragState;
      if (!ds) {
        try {
          ds = JSON.parse(e.dataTransfer.getData("drag"));
        } catch {
          return;
        }
      }
      if (!ds || !ds.maDks?.length) return;

      const { maDks, source } = ds;

      if (
        source?.di === targetDi &&
        source?.sn === targetSn &&
        source?.cn === targetCn
      ) {
        setDragState(null);
        return;
      }

      const targetKey = `${targetDi}-${targetSn}`;
      const newSchedule = JSON.parse(JSON.stringify(fullSchedule));

      if (!newSchedule[targetKey]) {
        newSchedule[targetKey] = {
          time: "",
          cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
        };
      }

      const existingInTarget = newSchedule[targetKey].cabins[targetCn];
      const targetSlotKey = `${targetDi}-${targetSn}-${targetCn}`;
      if (lockedCabins[targetSlotKey]) {
        message.error("Cabin này đã bị khoá, không thể nhận thêm học viên!");
        return;
      }

      // ── Kiểm tra swap ──
      // Swap xảy ra khi: HV kéo là noData, cabin đích có đúng 1 noData
      const shouldSwap = canSwap(existingInTarget, maDks, targetCn);

      if (shouldSwap) {
        const swappedId = existingInTarget[0];
        const nameA = getStudentByMaDk(maDks[0])?.ho_ten || maDks[0];
        const nameB = getStudentByMaDk(swappedId)?.ho_ten || swappedId;

        // Target nhận HV kéo
        newSchedule[targetKey].cabins[targetCn] = [maDks[0]];

        if (source?.type === "cabin" || source?.type === "cabin-all") {
          // Kéo từ cabin khác → cabin nguồn nhận HV bị thay thế
          const sourceKey = `${source.di}-${source.sn}`;
          if (newSchedule[sourceKey]) {
            newSchedule[sourceKey].cabins[source.cn] = [swappedId];
          }
          // assignedMaDks không đổi (cả 2 vẫn được assigned)
          updateCurrentWeek((old) => ({ ...old, schedule: newSchedule }));
        } else {
          // Kéo từ list → HV kéo vào cabin, HV cũ trả về list (xóa khỏi assigned)
          const newAssigned = new Set(assignedMaDks);
          newAssigned.add(maDks[0]);
          newAssigned.delete(swappedId); // HV cũ về list
          updateCurrentWeek(() => ({
            schedule: newSchedule,
            assignedMaDks: newAssigned,
          }));
        }

        setDragState(null);
        message.success(`Đã hoán đổi: ${nameA} ↔ ${nameB}`, 3);
        return;
      }

      // ── Kiểm tra overflow / invalid drop ──
      if (!canDropIntoCabin(existingInTarget, maDks, targetCn, targetSlotKey)) {
        const existingStudents = existingInTarget
          .map(getStudentByMaDk)
          .filter(Boolean);
        const droppingStudents = maDks.map(getStudentByMaDk).filter(Boolean);

        if (droppingStudents.some(isNoData) && existingStudents.length > 0) {
          // noData kéo vào cabin đã có người → chỉ swap được (đã xử lý ở trên)
          // Nếu đến đây thì cabin có >1 người hoặc cabin có hasData
          if (existingStudents.some(isHasData)) {
            message.error(
              "Học viên chưa học Cabin không thể ghép với học viên đã có dữ liệu!",
            );
          } else {
            message.error(
              "Học viên chưa học Cabin phải ở riêng 1 cabin, không thể ghép nhóm!",
            );
          }
        } else if (droppingStudents.some(s => s.hang_xe !== (Number(targetCn) > 5 - globalConfig.b1Cabins ? "B1" : "B2"))) {
          message.error("Học viên không khớp Hạng Xe với Cabin này!");
        } else if (existingStudents.some(isNoData)) {
          message.error(
            "Cabin này đang có học viên chưa học Cabin (phải ở riêng), không thể thêm vào!",
          );
        } else if (
          [...existingStudents, ...droppingStudents].length >
          globalConfig.maxPerCabin
        ) {
          message.error(
            `Cabin này đã đạt giới hạn ${globalConfig.maxPerCabin} học viên!`,
          );
        } else {
          const allInCabin = [...existingStudents, ...droppingStudents];
          const totalAfter = calcCabinTime(allInCabin);
          message.error(
            `Tổng thời gian cần dùng vượt quá ca! ` +
              `(Cần ${totalAfter} phút, ca chỉ có ${globalConfig.duration} phút. ` +
              `Đã tính phút còn thiếu của mỗi HV + ${globalConfig.intervalMinutes} phút cách nhau)`,
          );
        }
        setDragState(null);
        return;
      }

      // ── Xóa khỏi nguồn ──
      if (source?.type === "cabin" || source?.type === "cabin-all") {
        const sourceKey = `${source.di}-${source.sn}`;
        if (newSchedule[sourceKey]) {
          newSchedule[sourceKey].cabins[source.cn] = newSchedule[
            sourceKey
          ].cabins[source.cn].filter((id) => !maDks.includes(id));
        }
      }

      // ── Thêm vào đích ──
      const toAdd = maDks.filter(
        (id) => !newSchedule[targetKey].cabins[targetCn].includes(id),
      );
      newSchedule[targetKey].cabins[targetCn] = [
        ...newSchedule[targetKey].cabins[targetCn],
        ...toAdd,
      ];

      const newAssigned = new Set(assignedMaDks);
      maDks.forEach((id) => newAssigned.add(id));

      updateCurrentWeek(() => ({
        schedule: newSchedule,
        assignedMaDks: newAssigned,
      }));
      setDragState(null);

      const label =
        maDks.length > 1
          ? `${maDks.length} học viên`
          : getStudentByMaDk(maDks[0])?.ho_ten || "Học viên";
      message.success(`Đã chuyển ${label} sang Cabin ${targetCn}`);
    },
    [
      dragState,
      fullSchedule,
      canDropIntoCabin,
      canSwap,
      assignedMaDks,
      getStudentByMaDk,
      globalConfig,
      calcCabinTime,
      updateCurrentWeek,
    ],
  );

  // ── Filter list ──
  // Danh sách chờ: chưa được chia ở bất kỳ tuần nào
  const uniqueKhoaHoc = useMemo(() => {
    const list = [...new Set(allStudents.map(s => s.khoa_hoc).filter(Boolean))];
    return list.sort();
  }, [allStudents]);

  const availableStudents = useMemo(
    () =>
      allStudents.filter(
        (s) => {
          if (allAssignedMaDks.has(s.ma_dk)) return false;
          if (filterKhoa !== "all" && s.khoa_hoc !== filterKhoa) return false;
          if (filterStatus === "noData" && !isNoData(s)) return false;
          if (filterStatus === "hasData" && !isHasData(s)) return false;
          
          return (s.ho_ten.toLowerCase().includes(search.toLowerCase()) ||
            s.ma_dk.includes(search) ||
            s.giao_vien.toLowerCase().includes(search.toLowerCase()));
        }
      ),
    [allStudents, allAssignedMaDks, search, filterKhoa, filterStatus],
  );

  const dateStr = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const totalSlots = Object.keys(fullSchedule).length * 5;
  const assignedSlots = Object.values(fullSchedule).reduce(
    (sum, s) =>
      sum +
      Object.values(s.cabins).reduce((cs, c) => cs + (c.length > 0 ? 1 : 0), 0),
    0,
  );

  // Thống kê học viên còn lại (chưa chia ở bất kỳ tuần nào)
  const unassignedNoData = allStudents.filter(
    (s) => !allAssignedMaDks.has(s.ma_dk) && isNoData(s),
  ).length;
  const unassignedHasData = allStudents.filter(
    (s) =>
      !allAssignedMaDks.has(s.ma_dk) &&
      isHasData(s) &&
      s.phut_cabin < globalConfig.duration,
  ).length;

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER CABIN SLOT
  // ────────────────────────────────────────────────────────────────────────────
  const renderCabinSlot = (dateIndex, sessionNum, cabinNum) => {
    const key = `${dateIndex}-${sessionNum}`;
    const maDkList = fullSchedule[key]?.cabins[cabinNum] || [];
    const students = maDkList.map(getStudentByMaDk).filter(Boolean);
    const isEmpty = students.length === 0;
    const hasMultiple = students.length > 1;
    const cType = Number(cabinNum) > 5 - globalConfig.b1Cabins ? "B1" : "B2";

    const slotKey = `${dateIndex}-${sessionNum}-${cabinNum}`;
    const isLocked = lockedCabins[slotKey] || false;
    const isDragOver = dragOverSlot === slotKey;
    const isPopoverOpen = openPopover === slotKey;

    const currentViewDate = weekDates[0] || new Date();
    const hasExpiringStudent = students.some(s => {
      if (!s.ngay_ket_thuc) return false;
      const endD = new Date(s.ngay_ket_thuc);
      const diffDays = (endD.getTime() - currentViewDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 14 && diffDays >= -30;
    });

    const totalTime = calcCabinTime(students);
    const minuteOverflow = totalTime >= globalConfig.duration;
    const countOverflow = students.length > globalConfig.maxPerCabin;
    const hasError = minuteOverflow || countOverflow;

    const draggingMaDks = dragState?.maDks ?? [];

    // Check swap trước: noData kéo vào cabin đang có đúng 1 noData → hoán đổi
    const willSwap =
      !isLocked && !isEmpty && draggingMaDks.length > 0 && canSwap(maDkList, draggingMaDks);

    // dropAllowed: true nếu thêm được bình thường HOẶC sẽ swap
    const dropAllowed = isLocked
      ? false
      : willSwap
        ? true
        : canDropIntoCabin(maDkList, draggingMaDks, cabinNum, slotKey);

    // ── Popover content ──
    const popoverContent = (
      <div className="w-64 space-y-2 max-h-80 overflow-y-auto">
        <div className="flex items-center justify-between pb-1 border-b border-gray-100">
          <span className="font-semibold text-sm text-gray-700">
            Cabin {cabinNum} ({cType}) — {students.length}/{globalConfig.maxPerCabin} HV
          </span>
          {totalTime > 0 && (
            <Tag color={hasError ? "red" : "green"}>
              Cần {totalTime}/{globalConfig.duration} ph
            </Tag>
          )}
        </div>

        {hasMultiple && (
          <div
            draggable
            onDragStart={(e) =>
              handleDragStartAll(e, maDkList, dateIndex, sessionNum, cabinNum)
            }
            onDragEnd={handleDragEnd}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 border border-blue-200 cursor-grab active:cursor-grabbing text-xs text-blue-700 font-medium select-none"
          >
            <DragOutlined />
            Kéo toàn bộ {students.length} học viên
          </div>
        )}

        {students.map((student) => (
          <StudentMiniCard
            key={student.ma_dk}
            student={student}
            isDragging={dragState?.maDks?.includes(student.ma_dk)}
            onViewDetail={(s) => {
              setStudentDetail(s);
              setOpenPopover(null);
            }}
            onRemove={() =>
              handleRemoveStudent(
                dateIndex,
                sessionNum,
                cabinNum,
                student.ma_dk,
              )
            }
          />
        ))}
      </div>
    );

    const slotDiv = (
      <div
        onDragOver={(e) => handleDragOver(e, dateIndex, sessionNum, cabinNum)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, dateIndex, sessionNum, cabinNum)}
        className={[
          "relative border rounded-md px-1 py-1 flex flex-col transition-all duration-100 group min-h-[52px]",
          hasExpiringStudent ? "ring-[1.5px] ring-orange-300 border-orange-400 bg-orange-50" : "",
          !hasExpiringStudent && isEmpty
            ? "bg-white border-gray-200 cursor-pointer hover:border-blue-300"
            : (!hasExpiringStudent && hasError)
              ? "bg-red-50 border-red-200"
              : (!hasExpiringStudent) ? "bg-blue-50 border-blue-200" : "",
          isDragOver && willSwap
            ? "ring-2 ring-yellow-400 border-yellow-400 bg-yellow-50 scale-[1.02]"
            : isDragOver && dropAllowed
              ? "ring-2 ring-green-400 border-green-400 bg-green-50 scale-[1.02]"
              : isDragOver && !dropAllowed
                ? "ring-2 ring-red-400 border-red-400 bg-red-50"
                : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-gray-500 leading-none">
              Cabin {cabinNum} <span className="font-bold">({cType})</span>
            </span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLock(slotKey); }}
              className={`p-0.5 rounded transition hover:scale-110 ${isLocked ? "bg-red-100 text-red-600" : "hover:bg-gray-200 text-gray-400"}`}
              title={isLocked ? "Mở khoá Cabin" : "Khoá Cabin"}
            >
              {isLocked ? <LockOutlined style={{ fontSize: 10 }} /> : <UnlockOutlined style={{ fontSize: 10 }} />}
            </button>
          </div>
          <span
            className={
                isEmpty
                  ? "text-gray-400"
                  : hasError
                    ? "text-red-500"
                    : "text-blue-500"
              }
            >
              (
              {isEmpty
                ? "Trống"
                : `${students.length}/${globalConfig.maxPerCabin} HV`}
              )
            </span>
          {hasMultiple && (
            <span className="bg-blue-500 text-white rounded-full text-[10px] px-1.5 font-bold leading-4 min-w-[18px] text-center">
              {students.length}
            </span>
          )}
        </div>

        {/* Body */}
        {isEmpty ? (
          <div
            className={`text-xs font-medium text-center flex-1 flex items-center justify-center ${
              isDragOver && dropAllowed
                ? "text-green-600"
                : isDragOver && !dropAllowed
                  ? "text-red-500"
                  : "text-gray-400"
            }`}
          >
            {isDragOver && dropAllowed
              ? "↓ Thả vào đây"
              : isDragOver && !dropAllowed
                ? "✕ Không hợp lệ"
                : "+ Thêm"}
          </div>
        ) : hasMultiple ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpenPopover(isPopoverOpen ? null : slotKey);
            }}
            className="cursor-pointer space-y-0.5"
          >
            {students.slice(0, 2).map((s) => (
              <div
                key={s.ma_dk}
                draggable
                onDragStart={(ev) => {
                  ev.stopPropagation();
                  handleDragStartOne(
                    ev,
                    s.ma_dk,
                    dateIndex,
                    sessionNum,
                    cabinNum,
                  );
                }}
                onDragEnd={handleDragEnd}
                className={`text-[11px] font-medium text-gray-800 truncate cursor-grab active:cursor-grabbing leading-4 ${
                  dragState?.maDks?.includes(s.ma_dk) ? "opacity-40" : ""
                }`}
                title={s.ho_ten}
              >
                {s.ho_ten}
              </div>
            ))}
            {students.length > 2 && (
              <div className="text-[10px] text-blue-500 font-semibold">
                +{students.length - 2} khác…
              </div>
            )}
            {totalTime > 0 && (
              <div
                className={`text-[10px] font-semibold ${hasError ? "text-red-500" : "text-green-600"}`}
              >
                Cần {totalTime}/{globalConfig.duration} ph
              </div>
            )}
            {isDragOver && (
              <div
                className={`text-[10px] font-medium ${willSwap ? "text-yellow-600" : dropAllowed ? "text-green-600" : "text-red-500"}`}
              >
                {willSwap
                  ? "⇄ Hoán đổi"
                  : dropAllowed
                    ? "+ Thêm vào nhóm"
                    : "✕ Vượt giới hạn"}
              </div>
            )}
          </div>
        ) : (
          <div
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              handleDragStartOne(
                e,
                students[0].ma_dk,
                dateIndex,
                sessionNum,
                cabinNum,
              );
            }}
            onDragEnd={handleDragEnd}
            className={`relative flex items-center gap-1 cursor-grab active:cursor-grabbing ${
              dragState?.maDks?.includes(students[0].ma_dk) ? "opacity-40" : ""
            }`}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setStudentDetail(students[0]);
              }}
              className="flex-1 text-[11px] font-medium text-gray-800 hover:underline cursor-pointer truncate"
              title={students[0].ho_ten}
            >
              {students[0].ho_ten}
            </div>
            {isDragOver && (
              <span
                className={`text-[10px] font-medium absolute -top-1 left-0 right-0 text-center ${willSwap ? "text-yellow-600" : dropAllowed ? "text-green-600" : "text-red-500"}`}
              >
                {willSwap ? "⇄" : dropAllowed ? "+" : "✕"}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveStudent(
                  dateIndex,
                  sessionNum,
                  cabinNum,
                  students[0].ma_dk,
                );
              }}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0"
              title="Xóa"
            >
              <DeleteOutlined style={{ fontSize: 11 }} />
            </button>
          </div>
        )}
      </div>
    );

    if (hasMultiple) {
      return (
        <Popover
          key={slotKey}
          open={isPopoverOpen}
          onOpenChange={(open) => setOpenPopover(open ? slotKey : null)}
          content={popoverContent}
          trigger="click"
          placement="rightTop"
        >
          {slotDiv}
        </Popover>
      );
    }

    return <React.Fragment key={slotKey}>{slotDiv}</React.Fragment>;
  };

  // ─── Table ────────────────────────────────────────────────────────────────
  const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const columns = [
    {
      title: "Giờ",
      dataIndex: "time",
      key: "time",
      width: 120,
      fixed: "left",
      render: (time) => (
        <div className="font-medium text-gray-700 text-xs">{time}</div>
      ),
    },
    ...days.map((day, i) => ({
      title: (
        <div className="text-center">
          <div className="font-semibold">{day}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {dateStr(weekDates[i])}
          </div>
        </div>
      ),
      dataIndex: `day_${i}`,
      key: `day_${i}`,
      render: (_, record) => {
        const dateIdx = i;
        const sessions = getSessions((dateIdx + 1) % 7);
        const session = sessions[record.sessionIndex];

        if (!session) {
          return (
            <div className="flex items-center justify-center h-24 text-xs text-gray-400 italic bg-gray-50 rounded-xl">
              Không có ca
            </div>
          );
        }

        const visibleCabins =
          filterCabin === "all" ? [1, 2, 3, 4, 5] : [Number(filterCabin)];

        return (
          <div className="space-y-1.5">
            {visibleCabins.map((cn) => (
              <div key={cn}>{renderCabinSlot(dateIdx, session.num, cn)}</div>
            ))}
          </div>
        );
      },
    })),
  ];

  const dataSource = useMemo(
    () =>
      globalSessions.map((gSess, si) => ({
        key: si,
        sessionIndex: si,
        time: gSess.time,
      })),
    [globalSessions],
  );

  // ─── Cabin Limit Settings Modal ───────────────────────────────────────────
  const [tempLimit, setTempLimit] = useState({
    maxPerCabin: globalConfig.maxPerCabin,
    intervalMinutes: globalConfig.intervalMinutes,
  });

  const handleOpenLimitModal = () => {
    setTempLimit({
      maxPerCabin: globalConfig.maxPerCabin,
      intervalMinutes: globalConfig.intervalMinutes,
    });
    setCabinLimitModal(true);
  };

  const handleSaveLimitModal = () => {
    const newMax = tempLimit.maxPerCabin;
    const newInterval = tempLimit.intervalMinutes;
    const newDuration = globalConfig.duration;

    // Quét toàn bộ schedule của TẤT CẢ các tuần, kick HV vi phạm giới hạn mới
    let kickedCount = 0;
    const nextSchedules = { ...weekSchedules };

    Object.keys(nextSchedules).forEach((wk) => {
      const weekData = nextSchedules[wk];
      const newSchedule = JSON.parse(JSON.stringify(weekData.schedule));
      const newAssigned = new Set(weekData.assignedMaDks);
      let weekChanged = false;

      Object.keys(newSchedule).forEach((key) => {
        [1, 2, 3, 4, 5].forEach((cn) => {
          const maDkList = newSchedule[key].cabins[cn];
          if (!maDkList || maDkList.length === 0) return;

          const students = maDkList
            .map((id) => allStudents.find((s) => s.ma_dk === id))
            .filter(Boolean);

          if (students.every(isNoData)) return;

          const overCount = students.length > newMax;
          const totalTime =
            students.reduce((sum, s) => sum + getRemaining(s, newDuration), 0) +
            (students.length - 1) * newInterval;
          const overTime = totalTime >= newDuration;

          if (overCount || overTime) {
            maDkList.forEach((id) => {
              newAssigned.delete(id);
              kickedCount++;
            });
            newSchedule[key].cabins[cn] = [];
            weekChanged = true;
          }
        });
      });

      if (weekChanged) {
        nextSchedules[wk] = { ...weekData, schedule: newSchedule, assignedMaDks: newAssigned };
      }
    });

    setGlobalConfig((prev) => ({
      ...prev,
      maxPerCabin: newMax,
      intervalMinutes: newInterval,
    }));

    if (kickedCount > 0) {
      setWeekSchedules(nextSchedules);
      message.warning(
        `Đã cập nhật giới hạn. ${kickedCount} học viên vi phạm đã được trả về danh sách chờ.`,
        6,
      );
    } else {
      message.success(
        `Đã cập nhật: tối đa ${newMax} HV/cabin, cách nhau ${newInterval} phút`,
      );
    }

    setCabinLimitModal(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <CalendarOutlined
                  style={{ fontSize: "22px", color: "white" }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Xếp lịch học CABIN
                </h1>
                <p className="text-xs text-gray-500">
                  Quản lý lịch học cho 5 cabin
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "all",
                      label: "Chia tất cả (Ưu tiên học viên chưa học Cabin)",
                      icon: <BgColorsOutlined />,
                      onClick: () => handleAutoAssign("all"),
                    },
                    {
                      key: "noDataOnly",
                      label: "Chỉ chia học viên chưa học Cabin",
                      icon: <UserOutlined />,
                      onClick: () => handleAutoAssign("noDataOnly"),
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <Button
                  type="primary"
                  icon={<BgColorsOutlined />}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  Tự động chia
                  <DownOutlined />
                </Button>
              </Dropdown>

              <Button
                icon={<SettingOutlined />}
                onClick={handleOpenLimitModal}
                title="Giới hạn cabin"
              >
                Giới hạn cabin
              </Button>

              <Button
                icon={<SettingOutlined />}
                onClick={() => setSettingsModal(true)}
              >
                Cài đặt
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Điều hướng tuần */}
            <div className="flex items-center gap-2">
              <Button
                size="small"
                icon={<LeftOutlined />}
                onClick={() => setWeek(new Date(week.getTime() - 7 * 86400000))}
              />
              <span className="text-sm font-semibold text-gray-700 min-w-[200px] text-center">
                Tuần: {dateStr(weekDates[0])} – {dateStr(weekDates[6])}
                {assignedMaDks.size === 0 && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    (Chưa chia)
                  </span>
                )}
              </span>
              <Button
                size="small"
                icon={<RightOutlined />}
                onClick={() => setWeek(new Date(week.getTime() + 7 * 86400000))}
              />
            </div>

            {/* Lọc cabin */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Cabin:</span>
              <Select
                value={filterCabin}
                onChange={setFilterCabin}
                size="small"
                style={{ width: 140 }}
                options={[
                  { value: "all", label: "Tất cả" },
                  ...[1, 2, 3, 4, 5].map((n) => ({
                    value: n,
                    label: `Cabin ${n}`,
                  })),
                ]}
              />
            </div>

            {/* Thống kê */}
            <div className="flex gap-3 text-xs text-gray-600 flex-wrap">
              <span>
                Slot tuần này:{" "}
                <b>
                  {assignedSlots}/{totalSlots}
                </b>
              </span>
              <span>
                HV tuần này: <b>{assignedMaDks.size}</b>
              </span>
              <span>
                Đã chia (tất cả tuần):{" "}
                <b>
                  {allAssignedMaDks.size}/{allStudents.length}
                </b>
              </span>
              <span className="text-blue-600">
                Chưa có DL chờ: <b>{unassignedNoData}</b>
              </span>
              <span className="text-green-600">
                Có DL chờ: <b>{unassignedHasData}</b>
              </span>
              <span className="text-orange-500">
                Max cabin:{" "}
                <b>
                  {globalConfig.maxPerCabin} HV / {globalConfig.intervalMinutes}
                  ph
                </b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <Row gutter={[12, 12]} className="!m-3 flex-1">
        <Col span={20}>
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="small"
            bordered
            scroll={{ x: "max-content" }}
          />
        </Col>

        {/* Side panel */}
        <Col span={4}>
          <Card bodyStyle={{ padding: 8 }} className="sticky">
            <div className="text-xs space-y-2 mb-4">
              <div>
                🔵 <b>Nhóm A</b> (chưa học Cabin): 1 người/cabin riêng, ưu tiên
                trước.
              </div>
              <div>
                🟢 <b>Nhóm B</b> (thiếu giờ): gom nhóm sao cho tổng phút còn
                thiếu + khoảng cách &le; {globalConfig.duration} ph/ca.
              </div>
              <div>
                🔄 <b>Hoán đổi</b>: kéo HV chưa có DL vào cabin HV chưa có DL
                khác → tự động hoán đổi.
              </div>
              <div>
                ↩ <b>Trả về</b>: kéo HV từ cabin thả vào vùng này để đưa về danh
                sách chờ.
              </div>
              <div>
                ⏱ <b>Giới hạn cabin</b>: tối đa {globalConfig.maxPerCabin} HV,
                cách nhau {globalConfig.intervalMinutes} phút.
              </div>
            </div>
            <div className="font-semibold text-sm flex items-center gap-1.5 mb-2">
              <UserOutlined />
              Chờ xếp ({availableStudents.length}/{allStudents.length})
            </div>

            <div className="flex gap-2 mb-2">
              <Select
                value={filterKhoa}
                onChange={setFilterKhoa}
                size="small"
                className="flex-1"
                options={[
                  { value: "all", label: "Tất cả khóa" },
                  ...uniqueKhoaHoc.map((k) => ({ value: k, label: k })),
                ]}
              />
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                size="small"
                className="flex-1"
                options={[
                  { value: "all", label: "Tất cả trạng thái" },
                  { value: "noData", label: "Chưa học Cabin" },
                  { value: "hasData", label: "Đã học / Thiếu giờ" },
                ]}
              />
            </div>

            <Input
              placeholder="Tìm tên, mã ĐK, GV..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              className="mb-2"
            />

            {/* Legend */}
            <div className="flex gap-1 mb-2 flex-wrap">
              <Tag color="default" className="!text-[10px] !m-0">
                Chưa học Cabin
              </Tag>
              <Tag color="blue" className="!text-[10px] !m-0">
                Thiếu giờ Cabin
              </Tag>
            </div>

            <div
              className={[
                "flex flex-col gap-1.5 h-[66vh] overflow-y-auto pr-1 rounded-lg transition-all",
                listDropOver ? "ring-2 ring-orange-400 bg-orange-50" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onDragOver={(e) => {
                // Chỉ cho phép drop nếu đang kéo từ cabin (có source)
                if (dragState?.source) {
                  e.preventDefault();
                  setListDropOver(true);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget))
                  setListDropOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setListDropOver(false);
                if (!dragState?.source) return; // chỉ nhận từ cabin
                const { maDks, source } = dragState;
                if (!maDks?.length) return;

                const newSchedule = JSON.parse(JSON.stringify(fullSchedule));
                const sourceKey = `${source.di}-${source.sn}`;
                if (newSchedule[sourceKey]) {
                  newSchedule[sourceKey].cabins[source.cn] = newSchedule[
                    sourceKey
                  ].cabins[source.cn].filter((id) => !maDks.includes(id));
                }
                const newAssigned = new Set(assignedMaDks);
                maDks.forEach((id) => {
                  // Chỉ xóa khỏi assigned nếu HV không còn tồn tại ở cabin nào khác
                  const stillExists = Object.keys(newSchedule).some((k) =>
                    Object.values(newSchedule[k].cabins).some((c) =>
                      c.includes(id),
                    ),
                  );
                  if (!stillExists) newAssigned.delete(id);
                });
                updateCurrentWeek(() => ({
                  schedule: newSchedule,
                  assignedMaDks: newAssigned,
                }));
                setDragState(null);
                const label =
                  maDks.length > 1
                    ? `${maDks.length} học viên`
                    : getStudentByMaDk(maDks[0])?.ho_ten || "Học viên";
                message.success(`Đã trả ${label} về danh sách chờ`);
              }}
            >
              {listDropOver && dragState?.source && (
                <div className="text-center text-xs text-orange-600 font-medium py-2 border-2 border-dashed border-orange-400 rounded-lg mb-1">
                  ↓ Thả để trả về danh sách chờ
                </div>
              )}
              {availableStudents.length > 0 ? (
                availableStudents.map((student) => {
                  const hasData = isHasData(student);
                  const isDraggingThis = dragState?.maDks?.includes(
                    student.ma_dk,
                  );
                  return (
                    <div
                      key={student.ma_dk}
                      draggable
                      onDragStart={(e) =>
                        handleDragStartFromList(e, student.ma_dk)
                      }
                      onDragEnd={handleDragEnd}
                      onClick={() => setStudentDetail(student)}
                      className={[
                        "px-2 py-1.5 rounded-xl border bg-white",
                        "hover:border-blue-400 hover:shadow-md",
                        "transition-all cursor-grab active:cursor-grabbing",
                        hasData ? "border-blue-200" : "border-gray-200",
                        isDraggingThis ? "opacity-40" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="font-medium text-gray-900 text-xs truncate">
                        Họ tên: {student.ho_ten}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Mã: {student.ma_dk}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {student.hang_xe && (
                          <Tag
                            color={student.hang_xe === "B1" ? "magenta" : "geekblue"}
                            className="!text-[10px] !px-1 !py-0 !m-0"
                          >
                            Hạng {student.hang_xe}
                          </Tag>
                        )}
                        {student.khoa_hoc && (
                          <Tag color="default" className="!text-[10px] !px-1 !py-0 !m-0">
                            {student.khoa_hoc}
                          </Tag>
                        )}
                        {hasData ? (
                          <>
                            <Tag
                              color="blue"
                              className="!text-[10px] !px-1 !py-0 !m-0"
                            >
                              Bài {student.bai_cabin}
                            </Tag>
                            <Tag
                              color="cyan"
                              className="!text-[10px] !px-1 !py-0 !m-0"
                            >
                              Đã học: {formatMinutesToHM(student.phut_cabin)}
                            </Tag>
                            <Tag
                              color="orange"
                              className="!text-[10px] !px-1 !py-0 !m-0"
                            >
                              Còn thiếu:{" "}
                              {formatMinutesToHM(
                                Math.max(
                                  0,
                                  globalConfig.duration - student.phut_cabin,
                                ),
                              )}
                            </Tag>
                          </>
                        ) : (
                          <Tag className="!text-[10px] !px-1 !py-0 !m-0">
                            Chưa có DL
                          </Tag>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        GV: {student.giao_vien}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12">
                  <Empty description="Không còn học viên chờ" />
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Modal giới hạn cabin */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <SettingOutlined />
            Cài đặt giới hạn Cabin
          </div>
        }
        open={cabinLimitModal}
        onOk={handleSaveLimitModal}
        onCancel={() => setCabinLimitModal(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={420}
      >
        <div className="py-4 space-y-6">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">
              Số học viên tối đa / cabin
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Mỗi slot cabin chỉ cho phép tối đa số học viên này (gộp nhóm hay
              xếp riêng đều không vượt quá).
            </div>
            <InputNumber
              min={1}
              max={10}
              value={tempLimit.maxPerCabin}
              onChange={(v) => setTempLimit((p) => ({ ...p, maxPerCabin: v }))}
              addonAfter="HV"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">
              Khoảng cách giữa các học viên
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Thời gian chờ giữa 2 học viên liên tiếp trong cùng 1 cabin. Công
              thức:{" "}
              <code className="bg-gray-100 px-1 rounded">
                Tổng = Σ(phút học) + (n-1) × khoảng_cách
              </code>
            </div>
            <InputNumber
              min={0}
              max={60}
              value={tempLimit.intervalMinutes}
              onChange={(v) =>
                setTempLimit((p) => ({ ...p, intervalMinutes: v }))
              }
              addonAfter="phút"
              style={{ width: "100%" }}
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
            <div className="font-semibold mb-1">
              Ví dụ: ca {globalConfig.duration} phút, mỗi HV còn thiếu 30 phút:
            </div>
            <div className="text-gray-500 mb-1 italic">
              Công thức: Σ(phút còn thiếu) + (n−1) × khoảng_cách ≤ độ dài ca
            </div>
            {[2, 3, 4]
              .filter((n) => n <= tempLimit.maxPerCabin)
              .map((n) => {
                const eachNeeded = 30; // giả sử mỗi HV còn thiếu 30 phút
                const total =
                  n * eachNeeded + (n - 1) * tempLimit.intervalMinutes;
                return (
                  <div key={n}>
                    {n} HV × 30ph thiếu + {n - 1} khoảng ×{" "}
                    {tempLimit.intervalMinutes}ph = <b>{total} phút</b>
                    {total <= globalConfig.duration ? (
                      <span className="text-green-700"> ✓ hợp lệ</span>
                    ) : (
                      <span className="text-red-600">
                        {" "}
                        ✗ vượt ca ({globalConfig.duration}ph)
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>

      <SettingsModal
        settingsModal={settingsModal}
        setSettingsModal={setSettingsModal}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        globalConfig={globalConfig}
        setGlobalConfig={(newConfig) => {
          // Nếu duration thay đổi → kick slot vi phạm
          const oldDuration = globalConfig.duration;
          const newDuration =
            typeof newConfig === "function"
              ? newConfig(globalConfig).duration
              : newConfig.duration;
          const resolvedConfig =
            typeof newConfig === "function"
              ? newConfig(globalConfig)
              : newConfig;

          setGlobalConfig(resolvedConfig);

          if (newDuration && newDuration !== oldDuration) {
            // Kick các slot có tổng phút thiếu > duration mới (Áp dụng TOÀN BỘ TUẦN)
            let kicked = 0;
            const nextSchedules = { ...weekSchedules };

            Object.keys(nextSchedules).forEach((wk) => {
              const weekData = nextSchedules[wk];
              const newSchedule = JSON.parse(JSON.stringify(weekData.schedule));
              const newAssigned = new Set(weekData.assignedMaDks);
              let weekChanged = false;

              Object.keys(newSchedule).forEach((key) => {
                [1, 2, 3, 4, 5].forEach((cn) => {
                  const list = newSchedule[key].cabins[cn];
                  if (!list || !list.length) return;
                  const students = list
                    .map((id) => allStudents.find((s) => s.ma_dk === id))
                    .filter(Boolean);
                  
                  if (students.every(isNoData)) return;
                  
                  const totalNeeded = students
                    .filter(isHasData)
                    .reduce(
                      (sum, s) =>
                        sum + Math.max(0, newDuration - (s.phut_cabin || 0)),
                      0,
                    );
                  const totalTime =
                    totalNeeded +
                    (students.length - 1) * resolvedConfig.intervalMinutes;
                    
                  if (totalTime >= newDuration) {
                    list.forEach((id) => {
                      newAssigned.delete(id);
                      kicked++;
                    });
                    newSchedule[key].cabins[cn] = [];
                    weekChanged = true;
                  }
                });
              });

              if (weekChanged) {
                nextSchedules[wk] = { ...weekData, schedule: newSchedule, assignedMaDks: newAssigned };
              }
            });

            if (kicked > 0) {
              setWeekSchedules(nextSchedules);
              message.warning(
                `Thay đổi thời lượng ca: ${kicked} học viên vi phạm đã được trả về danh sách chờ.`,
                5,
              );
            }
          }
        }}
        dayConfigs={dayConfigs}
        setDayConfigs={setDayConfigs}
        setSchedule={setSchedule}
      />

      <StudentDetailDrawer
        studentDetail={studentDetail}
        setStudentDetail={setStudentDetail}
      />
    </div>
  );
};

export default LichCabin;
