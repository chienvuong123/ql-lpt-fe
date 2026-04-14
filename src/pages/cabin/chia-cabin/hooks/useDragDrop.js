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
  priorityCourse,
  handlePriorityInsert,
  getDayConfig,
  getSessions,
  isMakeupSlot,
  onAddNote,
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

      const targetSlotKey = `${targetDi}-${targetSn}-${targetCn}`;
      const existingInTarget = newSchedule[targetKey].cabins[targetCn];
      
      const droppingStudents = maDks.map(getStudentByMaDk).filter(Boolean);
      const targetStudents = existingInTarget.map(getStudentByMaDk).filter(Boolean);

      const dCfg = getDayConfig(targetDi);
      const b1Count = dCfg.b1Cabins ?? globalConfig.b1Cabins;
      const targetCabinType = Number(targetCn) > 5 - b1Count ? "B1" : "B2";

      // Check for different teacher or different car class
      const needsNote = droppingStudents.some(s => {
        // Different teacher from what's currently there (if any)
        const diffTeacher = targetStudents.length > 0 && 
                           s.giao_vien && targetStudents[0]?.giao_vien &&
                           s.giao_vien !== targetStudents[0].giao_vien;
        // Different rank from the cabin's rank (case-insensitive)
        const sRank = (s.hang_xe || "").toUpperCase();
        const tRank = (targetCabinType || "").toUpperCase();
        const diffRank = sRank !== tRank;

        return diffTeacher || diffRank;
      });

      const executeFinalMove = () => {
        const resultSchedule = JSON.parse(JSON.stringify(fullSchedule));
        if (!resultSchedule[targetKey]) {
          resultSchedule[targetKey] = {
            time: "",
            cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
          };
        }
        
        const shouldSwap = canSwap(existingInTarget, maDks, targetCn);
        
        if (shouldSwap) {
          const swappedId = existingInTarget[0];
          resultSchedule[targetKey].cabins[targetCn] = [maDks[0]];
          if (source?.di !== undefined) {
             const sourceKey = `${source.di}-${source.sn}`;
             if (resultSchedule[sourceKey]) {
                resultSchedule[sourceKey].cabins[source.cn] = [swappedId];
             }
          }
          updateCurrentWeek((old) => ({ ...old, schedule: resultSchedule }));
          const teacherA = droppingStudents[0]?.giao_vien || "Chưa gán GV";
          const teacherB = targetStudents[0]?.giao_vien || "Chưa gán GV";
          message.success(`Đã hoán đổi slot GV ${teacherA} ↔ GV ${teacherB} thành công`);
        } else {
          // Regular move
          // 1. Remove from source if it came from another cabin slot
          if (source?.di !== undefined) {
             const sourceKey = `${source.di}-${source.sn}`;
             if (resultSchedule[sourceKey]) {
                resultSchedule[sourceKey].cabins[source.cn] = resultSchedule[sourceKey].cabins[source.cn].filter(
                   id => !maDks.includes(id)
                );
             }
          }

          // 2. Add to target
          const toAdd = maDks.filter(id => !resultSchedule[targetKey].cabins[targetCn].includes(id));
          resultSchedule[targetKey].cabins[targetCn] = [...resultSchedule[targetKey].cabins[targetCn], ...toAdd];
          
          const newAssigned = new Set(assignedMaDks);
          maDks.forEach(id => newAssigned.add(id));
          
          updateCurrentWeek(() => ({
            schedule: resultSchedule,
            assignedMaDks: newAssigned,
          }));
          message.success(`Đã chuyển học viên vào Cabin ${targetCn}`);
        }
        setDragState(null);
      };

      if (needsNote) {
        onAddNote(targetSlotKey, "", executeFinalMove);
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

      const isPriority = priorityCourse !== "all" && droppingStudents.some(s => s.khoa_hoc === priorityCourse);

      if (!canDropIntoCabin(existingInTarget, maDks, targetCn, targetSlotKey)) {
        // Nếu là khóa ưu tiên, xem xét việc đẩy lịch thay vì chặn
        if (isPriority) {
          // Kiểm tra hạng xe và vùng học bù trước (ràng buộc cứng)
          const dCfg = getDayConfig(targetDi);
          const b1Count = dCfg.b1Cabins ?? globalConfig.b1Cabins;
          
          // Re-validate basic rules: Hang xe
          const targetType = Number(targetCn) > 5 - b1Count ? "B1" : "B2";
          if (droppingStudents.some(s => s.hang_xe !== targetType)) {
             message.error("Học viên ưu tiên cũng phải đúng Hạng xe với Cabin!");
             setDragState(null);
             return;
          }

          // Kiểm tra vùng học bù (ràng buộc cứng cho cả khóa ưu tiên)
          const session = getSessions(targetDi).find((s) => s?.num === targetSn);
          if (session) {
            const isMakeupZone = isMakeupSlot(targetDi, session);
            const hasMakeup = droppingStudents.some(s => s.is_makeup);
            if (isMakeupZone && !hasMakeup) {
              message.error("Ô học bù chỉ dành cho học viên học bù!");
              setDragState(null);
              return;
            }
            if (!isMakeupZone && hasMakeup) {
              message.error("Học viên học bù không thể xếp vào ca chính khóa!");
              setDragState(null);
              return;
            }
          }
          
          // Trigger Priority Insert
          handlePriorityInsert(maDks, targetDi, targetSn, targetCn);
          setDragState(null);
          return;
        }

        const existingStudents = existingInTarget

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
      priorityCourse,
      handlePriorityInsert,
      getDayConfig,
      getSessions,
      isMakeupSlot,
      onAddNote,
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
