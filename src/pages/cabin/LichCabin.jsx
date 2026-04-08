import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Row, Col } from "antd";
import { formatMinutesToHM } from "../../util/helper";
import { getDanhSachHocVienChiaCabin } from "../../apis/cabinApi";

import { useCabinSchedule } from "./chia-cabin/hooks/useCabinSchedule";
import { useDragDrop } from "./chia-cabin/hooks/useDragDrop";

import ScheduleHeader from "./chia-cabin/ScheduleHeader";
import WaitingStudentList from "./chia-cabin/WaitingStudentList";
import SettingsModal from "./chia-cabin/SettingsModal";
import StudentDetailModal from "./chia-cabin/StudentDetailModal";
import CabinLimitModal from "./chia-cabin/CabinLimitModal";
import { isHasData, isNoData } from "./chia-cabin/utils";
import CabinTable from "./chia-cabin/Cabintable";
import { exportCabinExcel } from "./chia-cabin/exportCabinExcel";

const LichCabin = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const res = await getDanhSachHocVienChiaCabin();
        if (res && res.data) {
          setAllStudents(res.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách học viên", error);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

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
    handleAutoAssign,
    handleSaveGlobalConfig,
    handleSaveCabinLimit,
    handleSaveScheduleToServer,
    handleLoadScheduleFromServer,
    loadingSync,
  } = schedule;

  useEffect(() => {
    if (allStudents.length > 0) {
      handleLoadScheduleFromServer();
    }
  }, [week, allStudents.length, handleLoadScheduleFromServer]);

  const dragDrop = useDragDrop({
    fullSchedule,
    assignedMaDks,
    lockedCabins,
    globalConfig,
    getStudentByMaDk,
    calcCabinTime,
    canDropIntoCabin,
    updateCurrentWeek,
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

  // ── UI state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
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

  // ── Derived data ──────────────────────────────────────────────────────────
  const uniqueKhoaHoc = useMemo(() => {
    const list = [
      ...new Set(allStudents.map((s) => s.khoa_hoc).filter(Boolean)),
    ];
    return list.sort();
  }, [allStudents]);

  const availableStudents = useMemo(
    () =>
      allStudents.filter((s) => {
        if (allAssignedMaDks.has(s.ma_dk)) return false;
        if (filterKhoa !== "all" && s.khoa_hoc !== filterKhoa) return false;
        if (filterStatus === "noData" && !isNoData(s)) return false;
        if (filterStatus === "hasData" && !isHasData(s)) return false;
        return (
          s.ho_ten.toLowerCase().includes(search.toLowerCase()) ||
          s.ma_dk.includes(search) ||
          s.giao_vien.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [allStudents, allAssignedMaDks, search, filterKhoa, filterStatus],
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
  const cabinSlotProps = {
    fullSchedule,
    weekDates,
    globalConfig,
    lockedCabins,
    dragOverSlot,
    dragState,
    openPopover,
    getStudentByMaDk,
    calcCabinTime,
    canSwap,
    canDropIntoCabin,
    toggleLock,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragStartAll,
    handleDragStartOne,
    handleDragEnd,
    handleRemoveStudent,
    setStudentDetail: (s) => {
      setStudentDetail(s);
      setOpenPopover(null);
    },
    setOpenPopover,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
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
        onAutoAssign={handleAutoAssign}
        onOpenLimitModal={handleOpenLimitModal}
        onOpenSettings={() => setSettingsModal(true)}
        onExport={handleExport}
        onSave={handleSaveScheduleToServer}
        loadingSync={loadingSync}
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
          <WaitingStudentList
            loading={loadingStudents}
            globalConfig={globalConfig}
            availableStudents={availableStudents}
            allStudents={allStudents}
            filterKhoa={filterKhoa}
            setFilterKhoa={setFilterKhoa}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            search={search}
            setSearch={setSearch}
            uniqueKhoaHoc={uniqueKhoaHoc}
            listDropOver={listDropOver}
            setListDropOver={setListDropOver}
            dragState={dragState}
            setDragState={setDragState}
            fullSchedule={fullSchedule}
            assignedMaDks={assignedMaDks}
            updateCurrentWeek={updateCurrentWeek}
            getStudentByMaDk={getStudentByMaDk}
            isHasData={isHasData}
            handleDragStartFromList={handleDragStartFromList}
            handleDragEnd={handleDragEnd}
            setStudentDetail={setStudentDetail}
            formatMinutesToHM={formatMinutesToHM}
          />
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
        setSchedule={setSchedule}
      />

      <StudentDetailModal
        studentDetail={studentDetail}
        setStudentDetail={setStudentDetail}
      />
    </div>
  );
};

export default LichCabin;
