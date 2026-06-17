/* eslint-disable no-unused-vars, no-prototype-builtins */
import React, { useState, useMemo, useCallback, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatMinutesToHM } from "../../util/helper";
import { getDanhSachHocVienChiaCabin } from "../../apis/cabinApi";
import { getDanhSachHocVienHocBuDangHocBu } from "../../apis/apiHocbu";

import { useCabinSchedule } from "./chia-cabin/hooks/useCabinSchedule";

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};
import { useDragDrop } from "./chia-cabin/hooks/useDragDrop";
import { Row, Col, Spin, message } from "antd";

import ScheduleHeader from "./chia-cabin/ScheduleHeader";
import WaitingStudentList from "./chia-cabin/WaitingStudentList";
import SettingsModal from "./chia-cabin/SettingsModal";
import StudentDetailModal from "./chia-cabin/StudentDetailModal";
import CabinLimitModal from "./chia-cabin/CabinLimitModal";
import { isHasData, isNoData } from "./chia-cabin/utils";
import CabinTable from "./chia-cabin/CabinTable";
import { exportCabinExcel } from "./chia-cabin/exportCabinExcel";
import NoteModal from "./chia-cabin/NoteModal";
import { updateGhiChuLichCabin } from "../../apis/cabinApi";
import { usePermission } from "../../util/permission";

const LichCabin = () => {
  const { canEdit } = usePermission();
  const { data: studentsData, isFetching: isFetchingStudents } = useQuery({
    queryKey: ["cabinStudents"],
    queryFn: () => getDanhSachHocVienChiaCabin(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: makeupData, isFetching: isFetchingMakeup } = useQuery({
    queryKey: ["makeupCabinStudents"],
    queryFn: () => getDanhSachHocVienHocBuDangHocBu({ trang_thai: 6, limit: 1000 }),
    staleTime: 10 * 60 * 1000,
  });

  const mappedMakeupStudents = useMemo(() => {
    const list = normalizeApiList(makeupData);
    return list
      .filter((item) => {
        const itemLoaiStr = String(item?.loai ?? item?.student?.loai ?? "").toLowerCase();
        return itemLoaiStr === "2" || itemLoaiStr === "cabin";
      })
      .map((item) => {
        const student = item?.student || item;
        const ma_dk = student.ma_dk || item.ma_dk || "";
        const ho_ten = student.ho_ten || item.ho_ten || "";
        const giao_vien = student.giao_vien || item.thay_giao || student.thay_giao || item.giao_vien || "-";
        
        let hang_xe = student.hang_xe || item.hang_xe || student.hang || item.hang || "";
        const khoa_hoc = item.ten_khoa || student.khoa_hoc || item.khoa_hoc || "";
        if (!hang_xe && khoa_hoc) {
          if (khoa_hoc.toUpperCase().includes("B2")) hang_xe = "B2";
          else if (khoa_hoc.toUpperCase().includes("B1") || khoa_hoc.toUpperCase().includes("B01")) hang_xe = "B1";
          else if (khoa_hoc.toUpperCase().startsWith("B")) hang_xe = "B2";
          else if (khoa_hoc.toUpperCase().includes("C")) hang_xe = "C";
        }
        
        return {
          ...student,
          ma_dk,
          ho_ten,
          giao_vien,
          hang_xe,
          khoa_hoc,
          is_makeup: 1,
          phut_cabin: Number(item.phut_cabin ?? student.phut_cabin ?? 0),
          so_bai_hoc: Number(item.so_bai_hoc ?? student.so_bai_hoc ?? 0),
        };
      });
  }, [makeupData]);

  const allStudents = useMemo(() => {
    const mainList = studentsData?.data || [];
    const seen = new Set();
    const result = [];
    
    mainList.forEach((s) => {
      if (s.ma_dk) {
        seen.add(s.ma_dk);
        result.push(s);
      }
    });
    
    mappedMakeupStudents.forEach((s) => {
      if (s.ma_dk && !seen.has(s.ma_dk)) {
        seen.add(s.ma_dk);
        result.push(s);
      }
    });
    
    return result;
  }, [studentsData, mappedMakeupStudents]);

  const schedule = useCabinSchedule(allStudents);
  const {
    globalConfig,
    setWeekSchedules,
    week,
    setWeek,
    weekDates,
    assignedMaDks,
    dayConfigs,
    lockedCabins,
    fullSchedule,
    globalSessions,
    allAssignedMaDks,
    totalSlots,
    assignedSlots,
    getStudentByMaDk,
    calcCabinTime,
    canDropIntoCabin,
    getSessions,
    updateCurrentWeek,
    toggleLock,
    setSchedule,
    setDayConfigs,
    handleRemoveStudent,
    handleSaveGlobalConfig,
    handleSaveCabinLimit,
    handleSaveScheduleToServer,
    handleLoadScheduleFromServer,
    handleClearCurrentWeek,
    loadingSync,
    isFetchingSchedule,
    getDayConfig,
    isMakeupSlot,
    cabinConfigs,
    setCabinConfigs,
    doConfigBasedAutoAssign,
    slotNotes,
    slotRecordIds,
    updateSlotNoteLocal,
    onlineStudents,
    activeSlotKey,
  } = schedule;


  const isGlobalLoading =
    isFetchingStudents || isFetchingMakeup || isFetchingSchedule || loadingSync;


  const [noteModal, setNoteModal] = useState({
    visible: false,
    slotKey: "",
    note: "",
    isAddMode: false,
    onSuccess: null,
  });

  const onAddNote = useCallback((slotKey, initialNote, onSuccess, isAddMode = false) => {
    setNoteModal({
      visible: true,
      slotKey,
      note: initialNote || "",
      isAddMode,
      onSuccess,
    });
  }, []);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all"); // all, normal, makeup
  const [filterCabin, setFilterCabin] = useState("all");
  const [settingsModal, setSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState("global");
  const [cabinLimitModal, setCabinLimitModal] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);
  const [openPopover, setOpenPopover] = useState(null);
  const [tempLimit, setTempLimit] = useState({
    maxPerCabin: globalConfig.maxPerCabin,
    intervalMinutes: globalConfig.intervalMinutes,
  });

  const dragDrop = useDragDrop({
    fullSchedule,
    assignedMaDks,
    lockedCabins,
    globalConfig,
    getStudentByMaDk,
    calcCabinTime,
    canDropIntoCabin,
    updateCurrentWeek,
    getDayConfig,
    getSessions,
    isMakeupSlot,
    onAddNote,
    cabinConfigs,
  });
  const {
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
  } = dragDrop;

  // ── Derived data ──────────────────────────────────────────────────────────
  const teacherOnlineStatus = useMemo(() => {
    // status[giao_vien] = "online" | "warning" | undefined
    const status = {};
    if (!onlineStudents || Object.keys(onlineStudents).length === 0) return status;

    // Nhóm học viên theo giáo viên, chỉ xét những HV có trong onlineStudents
    const teacherStudents = {};
    allStudents.forEach((s) => {
      if (!s.giao_vien || !onlineStudents.hasOwnProperty(s.ma_dk)) return;
      if (!teacherStudents[s.giao_vien]) teacherStudents[s.giao_vien] = [];
      teacherStudents[s.giao_vien].push(s.ma_dk);
    });

    Object.entries(teacherStudents).forEach(([teacher, maDks]) => {
      // Kiểm tra nếu BẤT KỲ HV nào online → thầy online (chấm xanh)
      const hasAnyOnline = maDks.some(
        (mk) => onlineStudents[mk] === "online" || onlineStudents[mk] === true
      );
      if (hasAnyOnline) {
        status[teacher] = "online";
      } else {
        // Tất cả HV đều warning → chấm đỏ
        status[teacher] = "warning";
      }
    });

    return status;
  }, [onlineStudents, allStudents]);

  const uniqueKhoaHoc = useMemo(() => {
    const list = [
      ...new Set(allStudents.map((s) => s.khoa_hoc).filter(Boolean)),
    ];
    return list.sort();
  }, [allStudents]);

  const courseRankMap = useMemo(() => {
    const map = {};
    allStudents.forEach((s) => {
      if (s.khoa_hoc && s.hang_xe) {
        map[s.khoa_hoc] = s.hang_xe;
      }
    });
    return map;
  }, [allStudents]);

  const deferredSearch = useDeferredValue(search);

  const availableStudents = useMemo(
    () =>
      allStudents.filter((s) => {
        // 1. Kiểm tra gán trong tuần hiện tại (luôn ẩn nếu đã gán trong tuần đang xem)
        if (assignedMaDks.has(s.ma_dk)) return false;

        // 2. Kiểm tra gán ở các tuần khác
        // Nếu đã gán ở tuần khác: 
        //   - Ẩn nếu so_lan_chia <= 1 (mặc định)
        //   - Hiển thị nếu so_lan_chia > 1 (học viên được phép chia nhiều lượt)
        if (allAssignedMaDks.has(s.ma_dk)) {
            if (Number(s.so_lan_chia || 0) < 1) return false;
        }

        // Lọc theo cấu hình cabin nếu đang xem 1 cabin cụ thể
        if (filterCabin && filterCabin !== "all") {
          const cfg = cabinConfigs[String(filterCabin)];
          if (cfg && cfg.courses && cfg.courses.length > 0) {
            const isStudentMakeup = s.is_makeup === 1 || s.is_makeup === true;
            if (!isStudentMakeup && !cfg.courses.includes(s.khoa_hoc)) return false;
          }
        }

        if (filterKhoa !== "all" && s.khoa_hoc !== filterKhoa) return false;
        if (filterStatus === "noData" && !isNoData(s)) return false;
        if (filterStatus === "hasData" && !isHasData(s)) return false;
        if (filterStatus === "previouslyAssigned" && Number(s.so_lan_chia || 0) < 1) return false;
        
        if (filterType === "makeup" && !s.is_makeup) return false;
        if (filterType === "normal" && s.is_makeup) return false;

        const searchLower = (deferredSearch || "").toLowerCase();
        return (
          (s.ho_ten || "").toLowerCase().includes(searchLower) ||
          (s.ma_dk || "").includes(deferredSearch || "") ||
          (s.giao_vien || "").toLowerCase().includes(searchLower)
        );
      }),
    [allStudents, assignedMaDks, allAssignedMaDks, deferredSearch, filterKhoa, filterStatus, filterType, filterCabin, cabinConfigs],
  );

  const unassignedNoData = allStudents.filter(
    (s) => !allAssignedMaDks.has(s.ma_dk) && isNoData(s),
  ).length;
  const unassignedHasData = allStudents.filter(
    (s) =>
      !allAssignedMaDks.has(s.ma_dk) &&
      isHasData(s) &&
      s.phut_cabin < globalConfig.duration,
  ).length;

  // ── Cabin limit modal ─────────────────────────────────────────────────────
  const handleOpenLimitModal = () => {
    setTempLimit({
      maxPerCabin: globalConfig.maxPerCabin,
      intervalMinutes: globalConfig.intervalMinutes,
    });
    setCabinLimitModal(true);
  };

  const handleSaveLimitModal = () => {
    handleSaveCabinLimit(tempLimit, setWeekSchedules);
    setCabinLimitModal(false);
  };

  // ── Excel export ──────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const fmt = (d) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const weekLabel = `${fmt(weekDates[0])}-${fmt(weekDates[6])}_${weekDates[6].getFullYear()}`;
    exportCabinExcel({
      fullSchedule,
      weekDates,
      globalSessions,
      lockedCabins,
      getStudentByMaDk,
      getSessions,
      weekLabel,
    });
  }, [
    fullSchedule,
    weekDates,
    globalSessions,
    lockedCabins,
    getStudentByMaDk,
    getSessions,
  ]);

  // ── Shared CabinSlot props ────────────────────────────────────────────────
  const handleSetStudentDetail = useCallback((s) => {
    setStudentDetail(s);
    setOpenPopover(null);
  }, []);

  const cabinSlotProps = useMemo(() => ({
    fullSchedule,
    weekDates,
    globalConfig,
    lockedCabins,
    dragState,
    openPopover,
    getStudentByMaDk,
    calcCabinTime,
    canSwap,
    canDropIntoCabin,
    toggleLock,
    getDayConfig,
    isMakeupZone: isMakeupSlot,
    getSessions,
    handleDrop,
    handleDragStartAll,
    handleDragStartOne,
    handleDragEnd,
    handleRemoveStudent,
    setStudentDetail: handleSetStudentDetail,
    setOpenPopover,
    slotNotes,
    onAddNote,
    teacherOnlineStatus,
    activeSlotKey,
    canEdit,
  }), [

    fullSchedule,
    weekDates,
    globalConfig,
    lockedCabins,
    dragState,
    openPopover,
    getStudentByMaDk,
    calcCabinTime,
    canSwap,
    canDropIntoCabin,
    toggleLock,
    getDayConfig,
    isMakeupSlot,
    getSessions,
    handleDrop,
    handleDragStartAll,
    handleDragStartOne,
    handleDragEnd,
    handleRemoveStudent,
    handleSetStudentDetail,
    slotNotes,
    onAddNote,
    teacherOnlineStatus,
    activeSlotKey,
    canEdit,
  ]);


  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
      {isGlobalLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
          <Spin size="large" />
          <div className="mt-4 font-medium text-blue-600 animate-pulse">
            Đang chuẩn bị dữ liệu...
          </div>
        </div>
      )}

      <ScheduleHeader
        weekDates={weekDates}
        assignedMaDks={assignedMaDks}
        allAssignedMaDks={allAssignedMaDks}
        allStudents={allStudents}
        assignedSlots={assignedSlots}
        totalSlots={totalSlots}
        globalConfig={globalConfig}
        unassignedNoData={unassignedNoData}
        unassignedHasData={unassignedHasData}
        filterCabin={filterCabin}
        setFilterCabin={setFilterCabin}
        week={week}
        setWeek={setWeek}
        onOpenLimitModal={handleOpenLimitModal}
        onOpenSettings={() => setSettingsModal(true)}
        onExport={handleExport}
        onSave={handleSaveScheduleToServer}
        onClear={handleClearCurrentWeek}
        loadingSync={loadingSync}
        uniqueKhoaHoc={uniqueKhoaHoc}
        onConfigBasedAssign={doConfigBasedAutoAssign}
        canEdit={canEdit}
      />

      <Row gutter={[12, 12]} className="!m-3 flex-1">
        <Col span={20}>
          <CabinTable
            globalSessions={globalSessions}
            weekDates={weekDates}
            getSessions={getSessions}
            filterCabin={filterCabin}
            {...cabinSlotProps}
          />
        </Col>

        <Col span={4}>
          <div className="sticky top-0">
            <WaitingStudentList
              loading={isFetchingStudents || isFetchingMakeup}
              globalConfig={globalConfig}
              availableStudents={availableStudents}
              allStudents={allStudents}
              filterKhoa={filterKhoa}
              setFilterKhoa={setFilterKhoa}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterType={filterType}
              setFilterType={setFilterType}
              search={search}
              setSearch={setSearch}
              uniqueKhoaHoc={uniqueKhoaHoc}
              listDropOver={listDropOver}
              setListDropOver={setListDropOver}
              dragState={dragState}
              setDragState={setDragState}
              fullSchedule={fullSchedule}
              assignedMaDks={assignedMaDks}
              allAssignedMaDks={allAssignedMaDks}
              updateCurrentWeek={updateCurrentWeek}
              getStudentByMaDk={getStudentByMaDk}
              isHasData={isHasData}
              handleDragStartFromList={handleDragStartFromList}
              handleDragEnd={handleDragEnd}
              setStudentDetail={setStudentDetail}
              formatMinutesToHM={formatMinutesToHM}
              canEdit={canEdit}
            />
          </div>
        </Col>
      </Row>

      <CabinLimitModal
        open={cabinLimitModal}
        onOk={handleSaveLimitModal}
        onCancel={() => setCabinLimitModal(false)}
        tempLimit={tempLimit}
        setTempLimit={setTempLimit}
        globalConfig={globalConfig}
      />

      <SettingsModal
        settingsModal={settingsModal}
        setSettingsModal={setSettingsModal}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        globalConfig={globalConfig}
        setGlobalConfig={handleSaveGlobalConfig}
        dayConfigs={dayConfigs}
        setDayConfigs={setDayConfigs}
        cabinConfigs={cabinConfigs}
        setCabinConfigs={setCabinConfigs}
        uniqueKhoaHoc={uniqueKhoaHoc}
        courseRankMap={courseRankMap}
        setSchedule={setSchedule}
      />

      <StudentDetailModal
        studentDetail={studentDetail}
        setStudentDetail={setStudentDetail}
      />

      <NoteModal
        visible={noteModal.visible}
        slotKey={noteModal.slotKey}
        initialNote={noteModal.note}
        isAddMode={noteModal.isAddMode}
        onCancel={() => setNoteModal((prev) => ({ ...prev, visible: false }))}
        onSave={async (finalNote) => {
          try {
            const recordId = slotRecordIds[noteModal.slotKey];
            if (recordId) {
              await updateGhiChuLichCabin(recordId, { ghi_chu: finalNote });
            }
            updateSlotNoteLocal(noteModal.slotKey, finalNote);
            message.success("Đã cập nhật ghi chú!");
            setNoteModal((prev) => ({ ...prev, visible: false }));
            if (noteModal.onSuccess) noteModal.onSuccess();
          } catch (error) {
            message.error("Lỗi khi lưu ghi chú");
          }
        }}
        readOnly={!canEdit}
      />
    </div>
  );
};

export default LichCabin;
