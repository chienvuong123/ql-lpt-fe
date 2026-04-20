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
  cabinConfigs,
}) => {
  const [dragState, setDragState] = useState(null);
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


  const handleDragEnd = useCallback(() => {
    setDragState(null);
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
      const targetSlotKey = `${targetDi}-${targetSn}-${targetCn}`;
      
      // We'll calculate requirements based on current derived state (props)
      // but the actual MODIFICATION will happen inside updateCurrentWeek.
      const currentSlotData = fullSchedule[targetKey]?.cabins[targetCn] || [];
      const droppingStudents = maDks.map(getStudentByMaDk).filter(Boolean);
      const targetStudents = currentSlotData.map(getStudentByMaDk).filter(Boolean);

      const dCfg = getDayConfig(targetDi);
      const b1Count = dCfg.b1Cabins ?? globalConfig.b1Cabins;
      const targetCabinType = Number(targetCn) > 5 - b1Count ? "B1" : "B2";

      const needsNote = droppingStudents.some(s => {
        const diffTeacher = targetStudents.length > 0 && 
                           s.giao_vien && targetStudents[0]?.giao_vien &&
                           s.giao_vien !== targetStudents[0].giao_vien;
        const sRank = (s.hang_xe || "").toUpperCase();
        const tRank = (targetCabinType || "").toUpperCase();
        const diffRank = sRank !== tRank;
        return diffTeacher || diffRank;
      });

      const executeFinalMove = () => {
        updateCurrentWeek((old) => {
          const nextSchedule = JSON.parse(JSON.stringify(old.schedule || {}));
          if (!nextSchedule[targetKey]) {
            nextSchedule[targetKey] = {
              time: "",
              cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
            };
          }
          
          const existingInTarget = nextSchedule[targetKey].cabins[targetCn] || [];
          const shouldSwap = canSwap(existingInTarget, maDks, targetCn);
          const nextAssigned = new Set(old.assignedMaDks);

          if (shouldSwap) {
            const swappedId = existingInTarget[0];
            nextSchedule[targetKey].cabins[targetCn] = [maDks[0]];
            if (source?.di !== undefined) {
               const sourceKey = `${source.di}-${source.sn}`;
               if (nextSchedule[sourceKey]) {
                  nextSchedule[sourceKey].cabins[source.cn] = [swappedId];
               }
            }
            nextAssigned.add(maDks[0]);
            
            const teacherA = droppingStudents[0]?.giao_vien || "Chưa gán GV";
            const teacherB = targetStudents[0]?.giao_vien || "Chưa gán GV";
            message.success(`Đã hoán đổi slot GV ${teacherA} \u2194 GV ${teacherB} thành công`);
            
            return { schedule: nextSchedule, assignedMaDks: nextAssigned };
          } else {
            if (source?.di !== undefined) {
               const sourceKey = `${source.di}-${source.sn}`;
               if (nextSchedule[sourceKey]) {
                  nextSchedule[sourceKey].cabins[source.cn] = nextSchedule[sourceKey].cabins[source.cn].filter(
                     id => !maDks.includes(id)
                  );
               }
            }

            const currentTargetList = nextSchedule[targetKey].cabins[targetCn] || [];
            const toAdd = maDks.filter(id => !currentTargetList.includes(id));
            nextSchedule[targetKey].cabins[targetCn] = [...currentTargetList, ...toAdd];
            
            maDks.forEach(id => nextAssigned.add(id));
            
            message.success(`\u0110\u00e3 chuy\u1ec3n h\u1ecdc vi\u00ean v\u00e0o Cabin ${targetCn}`);
            return { schedule: nextSchedule, assignedMaDks: nextAssigned };
          }
        });
        setDragState(null);
      };

      if (needsNote) {
        onAddNote(targetSlotKey, "", executeFinalMove);
        return;
      }

      const shouldSwap = canSwap(currentSlotData, maDks, targetCn);

      if (shouldSwap) {
        const swappedId = currentSlotData[0];
        const nameA = getStudentByMaDk(maDks[0])?.ho_ten || maDks[0];
        const nameB = getStudentByMaDk(swappedId)?.ho_ten || swappedId;

        updateCurrentWeek((old) => {
          const nextSchedule = JSON.parse(JSON.stringify(old.schedule || {}));
          if (!nextSchedule[targetKey]) {
             nextSchedule[targetKey] = { time: "", cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] } };
          }
          nextSchedule[targetKey].cabins[targetCn] = [maDks[0]];

          const nextAssigned = new Set(old.assignedMaDks);
          if (source?.type === "cabin" || source?.type === "cabin-all") {
            const sourceKey = `${source.di}-${source.sn}`;
            if (nextSchedule[sourceKey]) {
              nextSchedule[sourceKey].cabins[source.cn] = [swappedId];
            }
          } else {
            nextAssigned.add(maDks[0]);
            nextAssigned.delete(swappedId);
          }
          return { schedule: nextSchedule, assignedMaDks: nextAssigned };
        });

        setDragState(null);
        message.success(`\u0110\u00e3 ho\u00e1n \u0111\u1ed5i: ${nameA} \u2194 ${nameB}`, 3);
        return;
      }

      const isPriority = priorityCourse !== "all" && droppingStudents.some(s => s.khoa_hoc === priorityCourse);

      if (!canDropIntoCabin(currentSlotData, maDks, targetCn, targetSlotKey)) {
        if (isPriority) {
          const b1Count = dCfg.b1Cabins ?? globalConfig.b1Cabins;
          const targetType = Number(targetCn) > 5 - b1Count ? "B1" : "B2";
          if (droppingStudents.some(s => s.hang_xe !== targetType)) {
             message.error("H\u1ecdc vi\u00ean \u01b0u ti\u00ean c\u0169ng ph\u1ea3i \u0111\u00fang H\u1ea1ng xe v\u1edbi Cabin!");
             setDragState(null);
             return;
          }

          const session = getSessions(targetDi).find((s) => s?.num === targetSn);
          if (session) {
            const isMakeupZone = isMakeupSlot(targetDi, session);
            const hasMakeup = droppingStudents.some(s => s.is_makeup);
            if (isMakeupZone && !hasMakeup) {
              message.error("\u00d4 h\u1ecdc b\u00f9 ch\u1ec9 d\u00e0nh cho h\u1ecdc vi\u00ean h\u1ecdc b\u00f9!");
              setDragState(null);
              return;
            }
            if (!isMakeupZone && hasMakeup) {
              message.error("H\u1ecdc vi\u00ean h\u1ecdc b\u00f9 kh\u00f4ng th\u1ec3 x\u1ebfp v\u00e0o ca ch\u00ednh kh\u00f3a!");
              setDragState(null);
              return;
            }
          }
          
          handlePriorityInsert(maDks, targetDi, targetSn, targetCn);
          setDragState(null);
          return;
        }

        if (lockedCabins[targetSlotKey]) {
          message.error("Cabin n\u00e0y \u0111ang b\u1ecb kh\u00f3a, kh\u00f4ng th\u1ec3 th\u00eam h\u1ecdc vi\u00ean!");
        } else if (droppingStudents.some(isNoData) && currentSlotData.length > 0) {
          message.error("H\u1ecdc vi\u00ean ch\u01b0a h\u1ecdc Cabin ph\u1ea3i \u1edf ri\u00eang!");
        } else if (droppingStudents.some(s => s.hang_xe !== (Number(targetCn) > 5 - globalConfig.b1Cabins ? "B1" : "B2"))) {
          message.error("H\u1ecdc vi\u00ean kh\u00f4ng kh\u1edbp H\u1ea1ng Xe v\u1edbi Cabin n\u00e0y!");
        } else if (cabinConfigs?.[targetCn]?.courses?.length > 0 && droppingStudents.some(s => !cabinConfigs[targetCn].courses.includes(s.khoa_hoc))) {
          message.error(`Cabin ${targetCn} ch\u1ec9 d\u00e0nh cho c\u00e1c kh\u00f3a: ${cabinConfigs[targetCn].courses.join(", ")}`);
        } else if ([...currentSlotData, ...droppingStudents].length > globalConfig.maxPerCabin) {
          message.error(`Cabin n\u00e0y \u0111\u00e3 \u0111\u1ea1t gi\u1edbi h\u1ea1n h\u1ecdc vi\u00ean!`);
        }
        setDragState(null);
        return;
      }

      updateCurrentWeek((old) => {
        const nextSchedule = JSON.parse(JSON.stringify(old.schedule || {}));
        if (!nextSchedule[targetKey]) {
          nextSchedule[targetKey] = {
            time: "",
            cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
          };
        }
        const currentTargetList = nextSchedule[targetKey].cabins[targetCn] || [];
        const toAdd = maDks.filter(id => !currentTargetList.includes(id));
        nextSchedule[targetKey].cabins[targetCn] = [...currentTargetList, ...toAdd];

        const nextAssigned = new Set(old.assignedMaDks);
        maDks.forEach((id) => nextAssigned.add(id));
        
        return { schedule: nextSchedule, assignedMaDks: nextAssigned };
      });

      setDragState(null);
      const label = maDks.length > 1 ? `${maDks.length} h\u1ecdc vi\u00ean` : getStudentByMaDk(maDks[0])?.giao_vien || "Gi\u00e1o vi\u00ean";
      message.success(`\u0110\u00e3 chuy\u1ec3n ${label} sang Cabin ${targetCn}`);
    },
    [dragState, fullSchedule, canDropIntoCabin, canSwap, getStudentByMaDk, globalConfig, updateCurrentWeek, lockedCabins, priorityCourse, handlePriorityInsert, getDayConfig, getSessions, isMakeupSlot, onAddNote, cabinConfigs]
  );

  return {
    dragState,
    setDragState,
    listDropOver,
    setListDropOver,
    setDragStatus: setDragState,
    canSwap,
    handleDragStartFromList,
    handleDragStartOne,
    handleDragStartAll,
    handleDragEnd,
    handleDrop,
  };
};
