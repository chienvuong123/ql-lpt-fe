import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message, Modal } from "antd";
import {
  binPackStudents,
  getRemaining,
  getWeekKey,
  isHasData,
  isNoData,
  minToTime,
  timeToMin,
} from "../utils";
import { saveLichCabin, getLichCabin, updateGhiChuLichCabin, checkOnlineStatus } from "../../../../apis/cabinApi";

const DEFAULT_CONFIG = {
  duration: 150,
  startTime: "07:00",
  endTime: "19:30",
  maxPerCabin: 2,
  intervalMinutes: 15,
  b1Cabins: 2,
  b2Cabins: 3,
  businessStart: "07:00",
  businessEnd: "17:00",
  makeupThreshold: "17:00",
  acceptMakeup: false, // Global default, can be overridden by day
};

export const useCabinSchedule = (allStudents) => {
  const [globalConfig, setGlobalConfig] = useState(DEFAULT_CONFIG);
  const [weekSchedules, setWeekSchedules] = useState({});
  const [week, setWeek] = useState(new Date());
  const [loadingSync, setLoadingSync] = useState(false);
  const [priorityCourse, setPriorityCourse] = useState("all");
  const [onlineStudents, setOnlineStudents] = useState({});
  const [activeSlotKey, setActiveSlotKey] = useState(null);
  const [serverStudents, setServerStudents] = useState({}); // Cache HV từ server (lịch sử)
  const queryClient = useQueryClient();


  // ── Week key & current week data ──────────────────────────────────────────
  const weekKey = useMemo(() => getWeekKey(week), [week]);

  const currentWeekData = useMemo(
    () =>
      weekSchedules[weekKey] || {
        assignedMaDks: new Set(),
        schedule: {},
        dayConfigs: {},
        cabinConfigs: {},
        lockedCabins: {},
        slotNotes: {},
        slotRecordIds: {},
      },
    [weekSchedules, weekKey],
  );

  const assignedMaDks = currentWeekData.assignedMaDks;
  const schedule = currentWeekData.schedule;
  const dayConfigs = currentWeekData.dayConfigs || {};
  const cabinConfigs = currentWeekData.cabinConfigs || {};
  const lockedCabins = currentWeekData.lockedCabins || {};
  const slotNotes = currentWeekData.slotNotes || {};
  const slotRecordIds = currentWeekData.slotRecordIds || {};

  // ── Update helpers ────────────────────────────────────────────────────────
  const updateCurrentWeek = useCallback(
    (updater) => {
      setWeekSchedules((prev) => {
        const old = prev[weekKey] || {
          assignedMaDks: new Set(),
          schedule: {},
          dayConfigs: {},
          cabinConfigs: {},
          lockedCabins: {},
          slotNotes: {},
          slotRecordIds: {},
        };
        const updated = typeof updater === "function" ? updater(old) : updater;
        return { ...prev, [weekKey]: { ...old, ...updated } };
      });
    },
    [weekKey],
  );

  const toggleLock = useCallback(
    (slotKey) => {
      updateCurrentWeek((old) => {
        const locks = old.lockedCabins || {};
        const isNowLocked = !locks[slotKey];
        const updates = {
          lockedCabins: { ...locks, [slotKey]: isNowLocked },
        };

        // Nếu mới khóa, tự động dọn dẹp các học viên đang có trong slot đó
        if (isNowLocked) {
          const [di, sn, cn] = slotKey.split("-");
          const key = `${di}-${sn}`;
          const currentMaDks = old.schedule[key]?.cabins[cn] || [];

          if (currentMaDks.length > 0) {
            const newSchedule = JSON.parse(JSON.stringify(old.schedule));
            newSchedule[key].cabins[cn] = [];
            updates.schedule = newSchedule;

            const newAssigned = new Set(old.assignedMaDks);
            currentMaDks.forEach((maDk) => newAssigned.delete(maDk));
            updates.assignedMaDks = newAssigned;
          }
        }

        return updates;
      });
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

  const setCabinConfigs = useCallback(
    (newConfigsOrUpdater) => {
      updateCurrentWeek((old) => ({
        ...old,
        cabinConfigs:
          typeof newConfigsOrUpdater === "function"
            ? newConfigsOrUpdater(old.cabinConfigs || {})
            : newConfigsOrUpdater,
      }));
    },
    [updateCurrentWeek],
  );

  // ── Sessions ──────────────────────────────────────────────────────────────
  const getDayConfig = useCallback(
    (di) => {
      // Chuyển di (0: T2, ..., 6: CN) sang dayIdx (1: T2, ..., 0: CN)
      const dayIdx = (di + 1) % 7;
      const override = dayConfigs[dayIdx];
      if (override?.noSessions) return { noSessions: true };
      return {
        start: override?.start ?? globalConfig.startTime,
        end: override?.end ?? globalConfig.endTime,
        b1Cabins: override?.b1Cabins ?? globalConfig.b1Cabins,
        acceptMakeup: override?.acceptMakeup ?? globalConfig.acceptMakeup,
        noSessions: false,
      };
    },
    [dayConfigs, globalConfig],
  );

  const isMakeupSlot = useCallback(
    (di, session) => {
      const dCfg = getDayConfig(di);
      if (!dCfg.acceptMakeup) return false;
      // Theo yêu cầu: ca từ 17h trở đi là ca học bù
      return session.startMin >= timeToMin(globalConfig.makeupThreshold || "17:00");
    },
    [getDayConfig, globalConfig.makeupThreshold],
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
    (di) => {
      const cfg = getDayConfig(di);
      if (cfg.noSessions) return globalSessions.map(() => null);
      const dayStartMin = timeToMin(cfg.start);
      const dayEndMin = timeToMin(cfg.end);
      return globalSessions.map((gSess) =>
        gSess.startMin >= dayStartMin && gSess.endMin <= dayEndMin
          ? gSess
          : null,
      );
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
      getSessions(di).forEach((sess) => {
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

  const studentsMap = useMemo(() => {
    const map = new Map();
    allStudents.forEach((s) => map.set(s.ma_dk, s));
    return map;
  }, [allStudents]);

  const getStudentByMaDk = useCallback(
    (maDk) => {
      // 1. Tìm trong pool chính (HV đang chờ chia)
      const student = studentsMap.get(maDk);
      if (student) return student;

      // 2. Tìm trong cache từ server (HV đã chia từ trước)
      const srvStudent = serverStudents[maDk];
      if (srvStudent) {
        const maKhoa = srvStudent.ma_khoa || "";
        let inferredHang = srvStudent.hang_xe || null;

        if (!inferredHang) {
          if (maKhoa.includes("B2")) inferredHang = "B2";
          else if (maKhoa.includes("B1") || maKhoa.includes("B01")) inferredHang = "B1";
          else if (maKhoa.includes("B")) inferredHang = "B2";
        }

        return {
          ...srvStudent,
          ho_ten: srvStudent.ho_ten || srvStudent.ma_dk,
          khoa_hoc: maKhoa || "N/A",
          hang_xe: inferredHang,
          is_server_data: true,
        };
      }

      return null;
    },
    [studentsMap, serverStudents],
  );

  // ── Global assigned (all weeks) ───────────────────────────────────────────
  const allAssignedMaDks = useMemo(() => {
    const all = new Set();
    Object.values(weekSchedules).forEach((wd) =>
      wd.assignedMaDks.forEach((id) => all.add(id)),
    );
    return all;
  }, [weekSchedules]);

  // ── Slot stats ────────────────────────────────────────────────────────────
  const totalEmptySlots = useMemo(() => {
    let count = 0;
    Object.values(fullSchedule).forEach((slot) =>
      [1, 2, 3, 4, 5].forEach((cn) => {
        if (slot.cabins[cn].length === 0) count++;
      }),
    );
    return count;
  }, [fullSchedule]);

  const totalSlots = Object.keys(fullSchedule).length * 5;
  const assignedSlots = Object.values(fullSchedule).reduce(
    (sum, s) =>
      sum +
      Object.values(s.cabins).reduce((cs, c) => cs + (c.length > 0 ? 1 : 0), 0),
    0,
  );

  // ── Cabin time calculation ────────────────────────────────────────────────
  const calcCabinTime = useCallback(
    (students) => {
      if (students.length === 0) return 0;
      const hasDataStudents = students.filter(isHasData);
      if (hasDataStudents.length === 0) return 0;
      const totalNeeded = hasDataStudents.reduce(
        (sum, s) => sum + getRemaining(s, globalConfig.duration),
        0,
      );
      const n = students.length;
      const intervals = n > 1 ? (n - 1) * globalConfig.intervalMinutes : 0;
      return totalNeeded + intervals;
    },
    [globalConfig.duration, globalConfig.intervalMinutes],
  );

  // ── Drop validation ───────────────────────────────────────────────────────
  const canDropIntoCabin = useCallback(
    (targetMaDkList, droppingMaDks, targetCn, slotKey) => {
      if (slotKey && lockedCabins[slotKey]) return false;

      // slotKey format: "di-sn-cn" or "di-sn"
      const parts = slotKey.split("-");
      const di = parseInt(parts[0]);
      const sn = parseInt(parts[1]);

      const dCfg = getDayConfig(di);
      const b1Count = dCfg.b1Cabins ?? globalConfig.b1Cabins;
      const { duration, maxPerCabin } = globalConfig;

      const targetType = Number(targetCn) > 5 - b1Count ? "B1" : "B2";
      const existingStudents = targetMaDkList
        .map(getStudentByMaDk)
        .filter(Boolean);
      const droppingStudents = droppingMaDks
        .map(getStudentByMaDk)
        .filter(Boolean);

      if (droppingStudents.some((s) => s.hang_xe !== targetType)) return false;
      
      // Ràng buộc cấu hình Cabin riêng (khóa học được phép)
      const cabinCfg = cabinConfigs[targetCn];
      if (cabinCfg && cabinCfg.courses && cabinCfg.courses.length > 0) {
        if (droppingStudents.some(s => !cabinCfg.courses.includes(s.khoa_hoc))) {
          return false;
        }
      }

      // Ràng buộc học bù
      const session = getSessions(di).find((s) => s?.num === sn);
      if (session) {
        const isMakeupZone = isMakeupSlot(di, session);
        const hasMakeupInDropping = droppingStudents.some((s) => s.is_makeup);
        const hasNormalInDropping = droppingStudents.some((s) => !s.is_makeup);

        if (isMakeupZone) {
          // Ô học bù chỉ nhận HV học bù
          if (hasNormalInDropping) return false;
        } else {
          // Ô thường không nhận HV học bù
          if (hasMakeupInDropping) return false;
        }

        // Kiểm tra hòa trộn trong cabin
        if (existingStudents.length > 0) {
          const hasMakeupInExisting = existingStudents.some((s) => s.is_makeup);
          if (isMakeupZone && !hasMakeupInExisting && existingStudents.length > 0) {
            // Trường hợp hy hữu nếu đã có học viên thường ở đây (do dữ liệu cũ)
            // thì vẫn chặn không cho thêm học bù vào hoặc ngược lại.
            // Nhưng về cơ bản isMakeupZone đã kiểm tra loại học viên rồi.
          }
        }
      }

      if (existingStudents.some(isNoData)) return false;
      if (droppingStudents.some(isNoData)) return existingStudents.length === 0;

      const allInCabin = [...existingStudents, ...droppingStudents];
      if (allInCabin.length > maxPerCabin) return false;
      return calcCabinTime(allInCabin) < duration;
    },
    [globalConfig, getStudentByMaDk, calcCabinTime, lockedCabins, getDayConfig, getSessions, isMakeupSlot],
  );

  // ── Shift logic ───────────────────────────────────────────────────────────
  const shiftOneStudent = useCallback(
    (maDk, fromDateIdx, fromSessionNum, fromCabinNum, currentSchedule) => {
      const student = getStudentByMaDk(maDk);
      if (!student) return currentSchedule;

      // Tìm tất cả các ô từ thời điểm hiện tại trở đi
      const allKeys = Object.keys(initSchedule).sort((a, b) => {
        const [diA, snA] = a.split("-").map(Number);
        const [diB, snB] = b.split("-").map(Number);
        if (diA !== diB) return diA - diB;
        return snA - snB;
      });

      const startIndex = allKeys.indexOf(`${fromDateIdx}-${fromSessionNum}`);
      if (startIndex === -1) return currentSchedule;

      for (let i = startIndex; i < allKeys.length; i++) {
        const key = allKeys[i];
        const [di, sn] = key.split("-").map(Number);
        const sessions = getSessions(di);
        const session = sessions.find((s) => s?.num === sn);
        if (!session) continue;

        // Ưu tiên cùng ca học (các cabin khác)
        // Sau đó mới đến ca tiếp theo
        const startCabin = (key === `${fromDateIdx}-${fromSessionNum}`) ? fromCabinNum + 1 : 1;

        for (let cn = 1; cn <= 5; cn++) {
          // Bỏ qua ô hiện tại
          if (key === `${fromDateIdx}-${fromSessionNum}` && cn === fromCabinNum) continue;

          const slotKey = `${key}-${cn}`;
          const existingIds = currentSchedule[key]?.cabins[cn] || [];

          if (canDropIntoCabin(existingIds, [maDk], cn, slotKey)) {
            const nextSchedule = JSON.parse(JSON.stringify(currentSchedule));
            if (!nextSchedule[key]) {
              nextSchedule[key] = { time: session.time, cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] } };
            }
            nextSchedule[key].cabins[cn].push(maDk);
            return nextSchedule;
          }
        }
      }

      // Nếu không tìm được chỗ trống, trả về null để báo hiệu cần đưa về danh sách chờ
      return null;
    },
    [getStudentByMaDk, initSchedule, getSessions, canDropIntoCabin],
  );

  const handlePriorityInsert = useCallback(
    (maDks, di, sn, cn) => {
      const targetKey = `${di}-${sn}`;
      const targetSlotKey = `${di}-${sn}-${cn}`;
      const existingInTarget = fullSchedule[targetKey]?.cabins[cn] || [];

      let currentSchedule = JSON.parse(JSON.stringify(fullSchedule));
      const newAssigned = new Set(assignedMaDks);
      maDks.forEach((id) => newAssigned.add(id));

      // 1. Gỡ học viên cũ ra
      currentSchedule[targetKey].cabins[cn] = [];

      // 2. Chèn học viên mới vào
      currentSchedule[targetKey].cabins[cn] = maDks;

      // 3. Tìm chỗ mới cho từng học viên bị đẩy đi
      let finalSchedule = currentSchedule;
      let kickedCount = 0;

      for (const oldMaDk of existingInTarget) {
        const shifted = shiftOneStudent(oldMaDk, di, sn, cn, finalSchedule);
        if (shifted) {
          finalSchedule = shifted;
        } else {
          // Không tìm được chỗ trống trong tuần -> trả về danh sách chờ
          newAssigned.delete(oldMaDk);
          kickedCount++;
        }
      }

      updateCurrentWeek(() => ({
        schedule: finalSchedule,
        assignedMaDks: newAssigned,
      }));

      if (kickedCount > 0) {
        message.warning(`Đã đẩy ${existingInTarget.length} HV. Trong đó ${kickedCount} HV phải về danh sách chờ vì hết chỗ trống.`);
      } else if (existingInTarget.length > 0) {
        message.success(`Đã đẩy ${existingInTarget.length} học viên cũ sang các ca trống tiếp theo.`);
      }
    },
    [fullSchedule, assignedMaDks, shiftOneStudent, updateCurrentWeek],
  );

  // ── Remove student ────────────────────────────────────────────────────────
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
    },
    [fullSchedule, assignedMaDks, updateCurrentWeek],
  );

  // ── Auto-assign ───────────────────────────────────────────────────────────
  const handleAutoAssign = (mode = "all") => {
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
        Object.keys(newSchedule).forEach((key) => {
          [1, 2, 3, 4, 5].forEach((cn) => {
            const slotKey = `${key}-${cn}`;
            if (!lockedCabins[slotKey]) {
              (newSchedule[key].cabins[cn] || []).forEach((id) =>
                newAssignedThisWeek.delete(id),
              );
              newSchedule[key].cabins[cn] = [];
            }
          });
        });
      }

      const globalAssigned = new Set();
      Object.keys(weekSchedules).forEach((wk) => {
        if (wk !== weekKey)
          weekSchedules[wk].assignedMaDks.forEach((id) =>
            globalAssigned.add(id),
          );
      });
      newAssignedThisWeek.forEach((id) => globalAssigned.add(id));

      // 1. Lọc và Sắp xếp học viên chưa được gán
      const unassignedPool = allStudents
        .filter((s) => !globalAssigned.has(s.ma_dk))
        .sort((a, b) => {
          // Khóa ưu tiên
          if (priorityCourse !== "all") {
            const isAPriority = a.khoa_hoc === priorityCourse;
            const isBPriority = b.khoa_hoc === priorityCourse;
            if (isAPriority && !isBPriority) return -1;
            if (!isAPriority && isBPriority) return 1;
          }
          // Tên khóa
          const khoaA = a.khoa_hoc || "";
          const khoaB = b.khoa_hoc || "";
          if (khoaA !== khoaB) return khoaA.localeCompare(khoaB);
          // Ngày kết thúc
          const dateA = new Date(a.ngay_ket_thuc || 0).getTime();
          const dateB = new Date(b.ngay_ket_thuc || 0).getTime();
          return dateA - dateB;
        });

      if (unassignedPool.length === 0) {
        message.info("Không còn học viên nào chờ xếp lịch.");
        return;
      }

      // 2. Nhóm học viên theo giáo viên
      const groupByTeacher = (students) => {
        const groups = {};
        students.forEach(s => {
          const gv = s.giao_vien || "Chưa có GV";
          if (!groups[gv]) groups[gv] = [];
          groups[gv].push(s);
        });
        return groups;
      };

      const normalPool = unassignedPool.filter(s => !s.is_makeup);
      const makeupPool = unassignedPool.filter(s => s.is_makeup);

      const teachersNormal = groupByTeacher(normalPool);
      const teachersMakeup = groupByTeacher(makeupPool);

      // 3. Sắp xếp giáo viên theo độ ưu tiên (Số học viên nhìu nhất xếp trước)
      const sortTeachers = (teacherGroups) =>
        Object.keys(teacherGroups).sort((a, b) => {
          // Vẫn giữ ưu tiên Khóa ưu tiên ở cấp độ thầy
          if (priorityCourse !== "all") {
            const aHasPri = teacherGroups[a].some(s => s.khoa_hoc === priorityCourse);
            const bHasPri = teacherGroups[b].some(s => s.khoa_hoc === priorityCourse);
            if (aHasPri && !bHasPri) return -1;
            if (!aHasPri && bHasPri) return 1;
          }
          return teacherGroups[b].length - teacherGroups[a].length;
        });

      const sortedNormalTeachers = sortTeachers(teachersNormal);
      const sortedMakeupTeachers = sortTeachers(teachersMakeup);

      // 4. Lấy danh sách ô trống
      const getEmptySlots = (isMakeupZone) => {
        const slots = [];
        Object.keys(initSchedule)
          .sort((a, b) => {
            const [diA, snA] = a.split("-").map(Number);
            const [diB, snB] = b.split("-").map(Number);
            if (diA !== diB) return diA - diB;
            return snA - snB;
          })
          .forEach((key) => {
            const [di, sn] = key.split("-").map(Number);
            const session = getSessions(di).find((s) => s?.num === sn);
            if (!session) return;
            if (isMakeupSlot(di, session) !== isMakeupZone) return;

            const dCfg = getDayConfig(di);
            const b1Count = dCfg.b1Cabins ?? globalConfig.b1Cabins;

            [1, 2, 3, 4, 5].forEach((cn) => {
              const slotKey = `${key}-${cn}`;
              if (lockedCabins[slotKey]) return;
              if (newSchedule[key]?.cabins[cn]?.length > 0) return;
              slots.push({ key, di, sn, cn, isB1: Number(cn) > 5 - b1Count });
            });
          });
        return slots;
      };

      const normalEmptySlots = getEmptySlots(false);
      const makeupEmptySlots = getEmptySlots(true);

      // 5. Điền lịch và kiểm tra ràng buộc thầy
      const busyTeachers = {}; // di-sn -> Set()
      const fillGroups = (sortedTeachers, teacherGroups, emptySlots) => {
        const newlyAssigned = new Set();
        let currentEmptySlots = [...emptySlots];

        for (const teacherName of sortedTeachers) {
          const students = teacherGroups[teacherName];
          for (const student of students) {
            const isB1Needed = student.hang_xe === "B1";

            let foundIdx = -1;
            for (let i = 0; i < currentEmptySlots.length; i++) {
              const slot = currentEmptySlots[i];
              if (slot.isB1 !== isB1Needed) continue;

              const sessionKey = `${slot.di}-${slot.sn}`;
              if (!busyTeachers[sessionKey]) busyTeachers[sessionKey] = new Set();

              // RÀNG BUỘC: 1 thầy 1 ca
              if (busyTeachers[sessionKey].has(teacherName)) continue;

              foundIdx = i;
              break;
            }

            if (foundIdx !== -1) {
              const slot = currentEmptySlots[foundIdx];
              const sessionKey = `${slot.di}-${slot.sn}`;

              if (!newSchedule[slot.key]) {
                newSchedule[slot.key] = { cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] } };
              }
              newSchedule[slot.key].cabins[slot.cn] = [student.ma_dk];

              busyTeachers[sessionKey].add(teacherName);
              newlyAssigned.add(student.ma_dk);
              currentEmptySlots.splice(foundIdx, 1);
            }
          }
        }
        return newlyAssigned;
      };

      const assignedNormal = fillGroups(sortedNormalTeachers, teachersNormal, normalEmptySlots);
      const assignedMakeup = fillGroups(sortedMakeupTeachers, teachersMakeup, makeupEmptySlots);

      const totalNewlyAssigned = new Set([...assignedNormal, ...assignedMakeup]);

      updateCurrentWeek(() => ({
        schedule: newSchedule,
        assignedMaDks: new Set([...newAssignedThisWeek, ...totalNewlyAssigned]),
      }));

      message.success(`Đã tự động chia xong ${totalNewlyAssigned.size} học viên.`, 5);
    } catch (err) {
      console.error("Auto-assign error:", err);
      message.error("Xảy ra lỗi khi tự động chia lịch. Vui lòng thử lại.");
    }
  };

  const doConfigBasedAutoAssign = (cabinNums) => {
    try {
      if (!cabinNums || cabinNums.length === 0) return;

      const newSchedule = JSON.parse(JSON.stringify(fullSchedule));
      const totalAssignedThisRun = new Set();
      const currentAssignedMaDks = new Set(assignedMaDks);

      let cabinsProcessed = 0;
      let studentsAssignedCount = 0;

      for (const cabinNum of cabinNums) {
        const config = cabinConfigs[cabinNum];
        if (!config || !config.courses || config.courses.length === 0) continue;

        cabinsProcessed++;

        // Tìm các ô trống của cabin này
        const emptySlots = [];
        Object.keys(initSchedule)
          .sort((a, b) => {
            const [diA, snA] = a.split("-").map(Number);
            const [diB, snB] = b.split("-").map(Number);
            if (diA !== diB) return diA - diB;
            return snA - snB;
          })
          .forEach((key) => {
            const slotKey = `${key}-${cabinNum}`;
            if (!lockedCabins[slotKey] && (newSchedule[key]?.cabins[cabinNum] || []).length === 0) {
              emptySlots.push({ key });
            }
          });

        if (emptySlots.length === 0) continue;

        // Lọc học viên chưa có lịch phù hợp với danh sách khóa của cabin
        const globalAssigned = new Set();
        Object.keys(weekSchedules).forEach((wk) => {
          if (wk !== weekKey) weekSchedules[wk].assignedMaDks.forEach((id) => globalAssigned.add(id));
        });
        currentAssignedMaDks.forEach((id) => globalAssigned.add(id));
        totalAssignedThisRun.forEach((id) => globalAssigned.add(id));

        const pool = allStudents.filter(
          (s) => !globalAssigned.has(s.ma_dk) && config.courses.includes(s.khoa_hoc)
        );

        if (pool.length === 0) continue;

        // Bước 1: Sắp xếp học viên trong pool theo giáo viên cho từng khóa
        const poolsByCourse = {};
        config.courses.forEach(c => {
          // Lọc học viên của khóa và sắp xếp theo tên giáo viên
          poolsByCourse[c] = pool
            .filter(s => s.khoa_hoc === c)
            .sort((a, b) => (a.giao_vien || "").localeCompare(b.giao_vien || ""));
        });

        // Bước 2: Tính toán hạn mức ô học (Quota) cho từng khóa dựa trên tỷ lệ % và số ô trống
        const totalEmptyForCabin = emptySlots.length;
        const ratios = config.ratios || {};
        const totalWeight = Object.values(ratios).reduce((a, b) => a + b, 0) || config.courses.length;

        // Tính số lượng ô cần điền cho mỗi khóa
        const quotas = {};
        let allocatedCount = 0;
        config.courses.forEach((c, idx) => {
          if (idx === config.courses.length - 1) {
            // Khóa cuối cùng lấy phần còn lại để đảm bảo khớp tổng số ô trống
            quotas[c] = totalEmptyForCabin - allocatedCount;
          } else {
            const ratio = ratios[c] || 0;
            const q = Math.round((ratio / totalWeight) * totalEmptyForCabin);
            quotas[c] = q;
            allocatedCount += q;
          }
        });

        // Bước 3: Điền lịch tuần tự theo khối khóa học (tính từ Thứ 2)
        let slotIdx = 0;
        for (const courseName of config.courses) {
          const quota = quotas[courseName];
          let filledForThisCourse = 0;

          // Điền cho đến khi hết quota hoặc hết học viên trong pool của khóa đó
          while (filledForThisCourse < quota && poolsByCourse[courseName].length > 0 && slotIdx < emptySlots.length) {
            const student = poolsByCourse[courseName].shift();
            const { key } = emptySlots[slotIdx++];

            if (!newSchedule[key]) newSchedule[key] = { cabins: {} };
            newSchedule[key].cabins[cabinNum] = [student.ma_dk];
            totalAssignedThisRun.add(student.ma_dk);
            studentsAssignedCount++;
            filledForThisCourse++;
          }
        }
      }

      if (studentsAssignedCount === 0) {
        message.info("Không có học viên nào được chia thêm dựa trên cấu hình.");
        return;
      }

      updateCurrentWeek(() => ({
        schedule: newSchedule,
        assignedMaDks: new Set([...currentAssignedMaDks, ...totalAssignedThisRun]),
      }));

      message.success(`Đã chia xong ${studentsAssignedCount} học viên cho ${cabinsProcessed} máy dựa trên cấu hình.`);
    } catch (err) {
      console.error("Config Based Auto Assign Error:", err);
      message.error("Lỗi khi chia lịch theo cấu hình.");
    }
  };

  // ── Settings handlers ─────────────────────────────────────────────────────
  const handleSaveGlobalConfig = (newConfig) => {
    const oldDuration = globalConfig.duration;
    const resolvedConfig =
      typeof newConfig === "function" ? newConfig(globalConfig) : newConfig;
    const newDuration = resolvedConfig.duration;

    setGlobalConfig(resolvedConfig);

    if (newDuration && newDuration !== oldDuration) {
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
          nextSchedules[wk] = {
            ...weekData,
            schedule: newSchedule,
            assignedMaDks: newAssigned,
          };
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
  };

  const handleSaveCabinLimit = (tempLimit, setWeekSchedules) => {
    const newMax = tempLimit.maxPerCabin;
    const newInterval = tempLimit.intervalMinutes;
    const newDuration = globalConfig.duration;
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
        nextSchedules[wk] = {
          ...weekData,
          schedule: newSchedule,
          assignedMaDks: newAssigned,
        };
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
  };

  const handleSaveScheduleToServer = useCallback(async () => {
    try {
      setLoadingSync(true);
      const assignments = [];
      const monday = weekDates[0];
      const week_key = monday.toISOString().split("T")[0];

      Object.keys(fullSchedule).forEach((key) => {
        const [di, sn] = key.split("-").map(Number);
        const slot = fullSchedule[key];
        Object.keys(slot.cabins).forEach((cn) => {
          const maDks = slot.cabins[cn];
          const isLocked = !!lockedCabins[`${key}-${cn}`];

          if (maDks && maDks.length > 0) {
            maDks.forEach((maDk) => {
              const student = getStudentByMaDk(maDk);
              if (student) {
                assignments.push({
                  ma_dk: student.ma_dk,
                  ngay: weekDates[di].toISOString().split("T")[0],
                  ca_hoc: sn,
                  cabin_so: Number(cn),
                  gio_bat_dau: slot.time.split("-")[0],
                  gio_ket_thuc: slot.time.split("-")[1],
                  ghi_chu: slotNotes[`${di}-${sn}-${cn}`] || "",
                  ma_khoa: student.khoa_hoc,
                  giao_vien: student.giao_vien,
                  is_locked: isLocked,
                  is_makeup: false,
                  is_thieu_gio: maDks.length > 1,
                  thoi_gian_hoc: globalConfig.duration,
                  thoi_gian_tong: globalConfig.duration,
                });
              }
            });
          } else if (isLocked) {
            // Khi cabin bị khóa nhưng chưa có học viên, vẫn gửi để giữ trạng thái khóa
            assignments.push({
              ma_dk: "",
              ngay: weekDates[di].toISOString().split("T")[0],
              ca_hoc: sn,
              cabin_so: Number(cn),
              gio_bat_dau: slot.time.split("-")[0],
              gio_ket_thuc: slot.time.split("-")[1],
              ghi_chu: "",
              ma_khoa: "",
              giao_vien: "",
              is_locked: true,
              is_makeup: false,
              is_thieu_gio: false,
              thoi_gian_hoc: globalConfig.duration,
              thoi_gian_tong: globalConfig.duration,
            });
          }
        });
      });

      await saveLichCabin({ week_key, assignments });
      queryClient.invalidateQueries({ queryKey: ["cabinSchedule"] });
      message.success("Đã lưu lịch lên hệ thống thành công!");
    } catch (error) {
      console.error("Save schedule error:", error);
      message.error("Lỗi khi lưu lịch: " + (error.response?.data?.message || error.message));
    } finally {
      setLoadingSync(false);
    }
  }, [fullSchedule, weekDates, lockedCabins, getStudentByMaDk]);

  const monday = weekDates[0];
  const week_key_str = monday.toISOString().split("T")[0];

  const {
    data: serverData,
    isFetching: isFetchingSchedule,
    refetch,
  } = useQuery({
    queryKey: ["cabinSchedule", weekKey],
    queryFn: () => getLichCabin({ week_key: week_key_str }),
    enabled: allStudents.length > 0,
    staleTime: 5 * 60 * 1000, // 5 mins cache
  });

  // Sync server data to local state
  useEffect(() => {
    if (serverData?.data) {
      const data = serverData.data;
      const newSchedule = JSON.parse(JSON.stringify(initSchedule));
      const newLocked = {};
      const newAssigned = new Set();
      const newNotes = {};
      const newRecordIds = {};
      const newServerStudents = {};

      data.forEach((item) => {
        const itemDate = new Date(item.ngay);
        const di = Math.round(
          (itemDate.getTime() - monday.getTime()) / 86400000,
        );
        if (di >= 0 && di < 7) {
          const key = `${di}-${item.ca_hoc}`;
          if (newSchedule[key]) {
            if (!newSchedule[key].cabins[item.cabin_so]) {
              newSchedule[key].cabins[item.cabin_so] = [];
            }
            if (item.ma_dk) {
              newSchedule[key].cabins[item.cabin_so].push(item.ma_dk);
              newAssigned.add(item.ma_dk);
            }
            if (item.is_locked) {
              newLocked[`${key}-${item.cabin_so}`] = true;
            }
            if (item.ghi_chu) {
              newNotes[`${key}-${item.cabin_so}`] = item.ghi_chu;
            }
            if (item.id) {
              newRecordIds[`${key}-${item.cabin_so}`] = item.id;
            }
            // Lưu metadata HV từ server
            if (item.ma_dk) {
              newServerStudents[item.ma_dk] = {
                ma_dk: item.ma_dk,
                ho_ten: item.ho_ten,
                giao_vien: item.giao_vien,
                ma_khoa: item.ma_khoa,
                hang_xe: item.hang_xe,
                phut_cabin: item.thoi_gian_hoc || 0,
                so_bai_hoc: item.so_bai_hoc || 0,
              };
            }
          }
        }
      });

      setServerStudents(prev => ({ ...prev, ...newServerStudents }));

      updateCurrentWeek(() => ({
        schedule: newSchedule,
        lockedCabins: newLocked,
        assignedMaDks: newAssigned,
        slotNotes: newNotes,
        slotRecordIds: newRecordIds,
      }));
    }
  }, [serverData, initSchedule, updateCurrentWeek, monday]);

  const updateSlotNoteLocal = useCallback(
    (slotKey, note) => {
      updateCurrentWeek((old) => ({
        ...old,
        slotNotes: { ...old.slotNotes, [slotKey]: note },
      }));
    },
    [updateCurrentWeek],
  );

  const handleLoadScheduleFromServer = useCallback(async () => {
    await refetch();
  }, [refetch]);


  const handleClearCurrentWeek = useCallback(() => {
    Modal.confirm({
      title: "Xác nhận xóa sạch tuần này?",
      content:
        "Tất cả học viên đã được xếp lịch trong tuần này sẽ bị xóa khỏi lịch học và quay lại danh sách chờ. Bạn có chắc chắn muốn thực hiện?",
      okText: "Xác nhận xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        updateCurrentWeek(() => ({
          schedule: {},
          assignedMaDks: new Set(),
          lockedCabins: {},
        }));
        message.success("Đã xóa sạch lịch học của tuần này.");
      },
    });
  }, [updateCurrentWeek]);

  // ── Online Status Refined ────────────────────────────────────────────────
  const refreshOnlineStatus = useCallback(async () => {
    const now = new Date();
    // 1. Chỉ check nếu đang xem tuần hiện tại
    if (getWeekKey(now) !== weekKey) {
      setActiveSlotKey(null);
      return;
    }

    // 2. Tìm ca hiện tại (Active Session)

    const currentMin = now.getHours() * 60 + now.getMinutes();
    const currentSess = globalSessions.find(
      (s) => currentMin >= s.startMin && currentMin <= s.endMin
    );

    if (!currentSess) {
      setOnlineStudents({});
      setActiveSlotKey(null);
      return;
    }


    // 3. Lấy tất cả các giáo viên được gán vào bất kỳ cabin nào trong ca này
    const di = (now.getDay() + 6) % 7; // T2: 0, ..., CN: 6
    const key = `${di}-${currentSess.num}`;
    setActiveSlotKey(key);
    const cabins = fullSchedule[key]?.cabins || {};


    const assignedMaDksInSession = Object.values(cabins).flat().filter(Boolean);
    const assignedStudents = assignedMaDksInSession.map(getStudentByMaDk).filter(Boolean);
    const uniqueTeachers = new Set(assignedStudents.map((s) => s.giao_vien).filter(Boolean));

    if (uniqueTeachers.size === 0) {
      // Không reset nếu data có thể chưa load xong (allStudents rỗng)
      if (allStudents.length > 0) {
        setOnlineStudents({});
      }
      return;
    }

    // 4. Lấy TẤT CẢ mã học viên của các thầy giáo này (từ allStudents pool)
    const targetMaDks = allStudents
      .filter((s) => uniqueTeachers.has(s.giao_vien))
      .map((s) => s.ma_dk);

    if (targetMaDks.length === 0) {
      setOnlineStudents({});
      return;
    }

    // 5. Tính toán startTime/endTime chuẩn theo khung giờ ca hiện tại (GIỜ LOCAL)
    const padZ = (n) => String(n).padStart(2, "0");
    const formatLocalISO = (d) => {
      return `${d.getFullYear()}-${padZ(d.getMonth() + 1)}-${padZ(d.getDate())}T${padZ(d.getHours())}:${padZ(d.getMinutes())}:${padZ(d.getSeconds())}Z`;
    };

    const startLocal = new Date(now);
    startLocal.setHours(Math.floor(currentSess.startMin / 60), currentSess.startMin % 60, 0, 0);
    const endLocal = new Date(now);
    endLocal.setHours(Math.floor(currentSess.endMin / 60), currentSess.endMin % 60, 0, 0);

    const startTimeStr = formatLocalISO(startLocal);
    const endTimeStr = formatLocalISO(endLocal);

    try {
      const res = await checkOnlineStatus({
        maDkList: targetMaDks,
        startTime: startTimeStr,
        endTime: endTimeStr,
      });

      // Chỗ set onlineStudents sau khi gọi API
      if (res?.success && res?.data) {
        const statusMap = {};
        res.data.forEach((item) => {
          const key = item.maDk || item.ma_dk;
          if (key) statusMap[key] = item.status;
        });
        setOnlineStudents(statusMap);
      }
    } catch (err) {
      console.error("Lỗi check online status:", err);
    }
  }, [weekKey, globalSessions, fullSchedule, allStudents, getStudentByMaDk]);

  useEffect(() => {
    // Delay lần đầu để đợi data (allStudents, fullSchedule) load xong
    const initTimer = setTimeout(refreshOnlineStatus, 500);
    const intervalTimer = setInterval(refreshOnlineStatus, 60000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(intervalTimer);
    };
  }, [refreshOnlineStatus]);

  // Re-check khi allStudents load xong lần đầu
  const allStudentsLoadedRef = useRef(false);
  useEffect(() => {
    if (allStudents.length > 0 && !allStudentsLoadedRef.current) {
      allStudentsLoadedRef.current = true;
      refreshOnlineStatus();
    }
  }, [allStudents, refreshOnlineStatus]);

  return {
    // state
    globalConfig,
    weekSchedules,
    setWeekSchedules,
    week,
    setWeek,
    weekKey,
    weekDates,
    assignedMaDks,
    schedule,
    dayConfigs,
    cabinConfigs,
    lockedCabins,
    fullSchedule,
    initSchedule,
    globalSessions,
    allAssignedMaDks,
    totalSlots,
    assignedSlots,
    totalEmptySlots,
    loadingSync,
    isFetchingSchedule,
    priorityCourse,
    slotNotes,
    slotRecordIds,
    // helpers
    getStudentByMaDk,
    calcCabinTime,
    canDropIntoCabin,
    getSessions,
    getDayConfig,
    isMakeupSlot,
    // actions
    setPriorityCourse,
    updateCurrentWeek,
    toggleLock,
    setSchedule,
    setDayConfigs,
    setCabinConfigs,
    handleRemoveStudent,
    handleAutoAssign,
    handlePriorityInsert,
    doConfigBasedAutoAssign,
    updateSlotNoteLocal,
    handleSaveGlobalConfig,
    handleSaveCabinLimit,
    handleSaveScheduleToServer,
    handleLoadScheduleFromServer,
    handleClearCurrentWeek,
    onlineStudents,
    refreshOnlineStatus,
    activeSlotKey,
  };
};

