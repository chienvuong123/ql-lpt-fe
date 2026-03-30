import { useState, useMemo, useCallback } from "react";
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

const DEFAULT_CONFIG = {
  duration: 150,
  startTime: "07:00",
  endTime: "19:30",
  maxPerCabin: 2,
  intervalMinutes: 15,
  b1Cabins: 2,
  b2Cabins: 3,
};

export const useCabinSchedule = (allStudents) => {
  const [globalConfig, setGlobalConfig] = useState(DEFAULT_CONFIG);
  const [weekSchedules, setWeekSchedules] = useState({});
  const [week, setWeek] = useState(new Date("2026-03-23"));

  // ── Week key & current week data ──────────────────────────────────────────
  const weekKey = useMemo(() => getWeekKey(week), [week]);

  const currentWeekData = useMemo(
    () =>
      weekSchedules[weekKey] || {
        assignedMaDks: new Set(),
        schedule: {},
        dayConfigs: {},
        lockedCabins: {},
      },
    [weekSchedules, weekKey],
  );

  const assignedMaDks = currentWeekData.assignedMaDks;
  const schedule = currentWeekData.schedule;
  const dayConfigs = currentWeekData.dayConfigs || {};
  const lockedCabins = currentWeekData.lockedCabins || {};

  // ── Update helpers ────────────────────────────────────────────────────────
  const updateCurrentWeek = useCallback(
    (updater) => {
      setWeekSchedules((prev) => {
        const old = prev[weekKey] || {
          assignedMaDks: new Set(),
          schedule: {},
          dayConfigs: {},
          lockedCabins: {},
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
        return { lockedCabins: { ...locks, [slotKey]: !locks[slotKey] } };
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

  // ── Sessions ──────────────────────────────────────────────────────────────
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
      const { duration, maxPerCabin, b1Cabins } = globalConfig;
      const targetType = Number(targetCn) > 5 - b1Cabins ? "B1" : "B2";
      const existingStudents = targetMaDkList
        .map(getStudentByMaDk)
        .filter(Boolean);
      const droppingStudents = droppingMaDks
        .map(getStudentByMaDk)
        .filter(Boolean);

      if (droppingStudents.some((s) => s.hang_xe !== targetType)) return false;
      if (existingStudents.some(isNoData)) return false;
      if (droppingStudents.some(isNoData)) return existingStudents.length === 0;

      const allInCabin = [...existingStudents, ...droppingStudents];
      if (allInCabin.length > maxPerCabin) return false;
      return calcCabinTime(allInCabin) < duration;
    },
    [globalConfig, getStudentByMaDk, calcCabinTime, lockedCabins],
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

      const newAssigned = new Set();

      const unassigned = allStudents
        .filter((s) => !globalAssigned.has(s.ma_dk))
        .sort((a, b) => {
          const dateA = new Date(a.ngay_ket_thuc || 0).getTime();
          const dateB = new Date(b.ngay_ket_thuc || 0).getTime();
          if (dateA !== dateB) return dateA - dateB;
          return (a.giao_vien || "").localeCompare(b.giao_vien || "");
        });

      const groupA = unassigned.filter(isNoData);
      const groupA_B1 = groupA.filter((s) => s.hang_xe === "B1");
      const groupA_B2 = groupA.filter((s) => s.hang_xe === "B2");

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

      const binsB_B1 =
        mode === "all"
          ? binPackStudents(
              groupB_B1,
              globalConfig.duration,
              globalConfig.maxPerCabin,
              globalConfig.intervalMinutes,
            )
          : [];
      const binsB_B2 =
        mode === "all"
          ? binPackStudents(
              groupB_B2,
              globalConfig.duration,
              globalConfig.maxPerCabin,
              globalConfig.intervalMinutes,
            )
          : [];

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
            if (newSchedule[key] && newSchedule[key].cabins[cn]?.length === 0) {
              const slotKey = `${key}-${cn}`;
              if (!lockedCabins[slotKey]) {
                if (Number(cn) > 5 - globalConfig.b1Cabins)
                  emptySlotsB1.push({ key, cn });
                else emptySlotsB2.push({ key, cn });
              }
            }
          });
        });

      const fillSlots = (studentsOrBins, isBin, emptySlots) => {
        let slotIdx = 0;
        for (const item of studentsOrBins) {
          if (slotIdx >= emptySlots.length) break;
          const { key, cn } = emptySlots[slotIdx++];
          if (!newSchedule[key]) {
            newSchedule[key] = {
              time: initSchedule[key].time,
              cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
            };
          }
          const maDksToAssign = isBin ? item.map((s) => s.ma_dk) : [item.ma_dk];
          newSchedule[key].cabins[cn] = maDksToAssign;
          maDksToAssign.forEach((id) => newAssigned.add(id));
        }
        return emptySlots.slice(slotIdx);
      };

      let remainB1 = fillSlots(groupA_B1, false, emptySlotsB1);
      if (mode === "all") fillSlots(binsB_B1, true, remainB1);
      let remainB2 = fillSlots(groupA_B2, false, emptySlotsB2);
      if (mode === "all") fillSlots(binsB_B2, true, remainB2);

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
      if (skipped > 0)
        msg += `. Còn ${skipped} học viên chưa được xếp (hết slot).`;
      message.success(msg, 5);
    } catch (err) {
      console.error("Auto-assign error:", err);
      message.error("Xảy ra lỗi khi tự động chia lịch. Vui lòng thử lại.");
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
    lockedCabins,
    fullSchedule,
    initSchedule,
    globalSessions,
    allAssignedMaDks,
    totalSlots,
    assignedSlots,
    totalEmptySlots,
    // helpers
    getStudentByMaDk,
    calcCabinTime,
    canDropIntoCabin,
    getSessions,
    getDayConfig,
    // actions
    updateCurrentWeek,
    toggleLock,
    setSchedule,
    setDayConfigs,
    handleRemoveStudent,
    handleAutoAssign,
    handleSaveGlobalConfig,
    handleSaveCabinLimit,
  };
};
