import { useState, useCallback } from "react";
import { message } from "antd";
import { isHasData, isNoData } from "../utils";

export const useDragDrop = ({
  fullSchedule,
  assignedMaDks,
  lockedCabins,
  globalConfig,
  getStudentByMaDk,
  calcCabinTime,
  canDropIntoCabin,
  updateCurrentWeek,
}) => {
  const [dragState, setDragState] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [listDropOver, setListDropOver] = useState(false);

  // ── Drag start ────────────────────────────────────────────────────────────
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

  // ── Drag over / leave ─────────────────────────────────────────────────────
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

  // ── Swap check ────────────────────────────────────────────────────────────
  const canSwap = useCallback(
    (targetMaDkList, droppingMaDks, targetCn) => {
      if (droppingMaDks.length !== 1 || targetMaDkList.length !== 1)
        return false;
      const droppingStudent = getStudentByMaDk(droppingMaDks[0]);
      const targetStudent = getStudentByMaDk(targetMaDkList[0]);
      if (!droppingStudent || !targetStudent) return false;
      const targetType =
        Number(targetCn) > 5 - globalConfig.b1Cabins ? "B1" : "B2";
      if (droppingStudent.hang_xe !== targetType) return false;
      return isNoData(droppingStudent) && isNoData(targetStudent);
    },
    [getStudentByMaDk, globalConfig.b1Cabins],
  );

  // ── Drop ──────────────────────────────────────────────────────────────────
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

      // Same slot
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

      const shouldSwap = canSwap(existingInTarget, maDks, targetCn);

      if (shouldSwap) {
        const swappedId = existingInTarget[0];
        const nameA = getStudentByMaDk(maDks[0])?.ho_ten || maDks[0];
        const nameB = getStudentByMaDk(swappedId)?.ho_ten || swappedId;

        newSchedule[targetKey].cabins[targetCn] = [maDks[0]];

        if (source?.type === "cabin" || source?.type === "cabin-all") {
          const sourceKey = `${source.di}-${source.sn}`;
          if (newSchedule[sourceKey]) {
            newSchedule[sourceKey].cabins[source.cn] = [swappedId];
          }
          updateCurrentWeek((old) => ({ ...old, schedule: newSchedule }));
        } else {
          const newAssigned = new Set(assignedMaDks);
          newAssigned.add(maDks[0]);
          newAssigned.delete(swappedId);
          updateCurrentWeek(() => ({
            schedule: newSchedule,
            assignedMaDks: newAssigned,
          }));
        }

        setDragState(null);
        message.success(`Đã hoán đổi: ${nameA} ↔ ${nameB}`, 3);
        return;
      }

      if (!canDropIntoCabin(existingInTarget, maDks, targetCn, targetSlotKey)) {
        const existingStudents = existingInTarget
          .map(getStudentByMaDk)
          .filter(Boolean);
        const droppingStudents = maDks.map(getStudentByMaDk).filter(Boolean);

        if (droppingStudents.some(isNoData) && existingStudents.length > 0) {
          if (existingStudents.some(isHasData)) {
            message.error(
              "Học viên chưa học Cabin không thể ghép với học viên đã có dữ liệu!",
            );
          } else {
            message.error(
              "Học viên chưa học Cabin phải ở riêng 1 cabin, không thể ghép nhóm!",
            );
          }
        } else if (
          droppingStudents.some(
            (s) =>
              s.hang_xe !==
              (Number(targetCn) > 5 - globalConfig.b1Cabins ? "B1" : "B2"),
          )
        ) {
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

      // Remove from source
      if (source?.type === "cabin" || source?.type === "cabin-all") {
        const sourceKey = `${source.di}-${source.sn}`;
        if (newSchedule[sourceKey]) {
          newSchedule[sourceKey].cabins[source.cn] = newSchedule[
            sourceKey
          ].cabins[source.cn].filter((id) => !maDks.includes(id));
        }
      }

      // Add to target
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
      lockedCabins,
    ],
  );

  return {
    dragState,
    dragOverSlot,
    listDropOver,
    setListDropOver,
    setDragState,
    canSwap,
    handleDragStartFromList,
    handleDragStartOne,
    handleDragStartAll,
    handleDragOver,
    handleDragLeave,
    handleDragEnd,
    handleDrop,
  };
};
