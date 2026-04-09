import { useMemo } from "react";
import { Table } from "antd";
import CabinSlot from "./CabinSlot";
import { dateStr } from "./utils";

const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const CabinTable = ({
  globalSessions,
  weekDates,
  getSessions,
  filterCabin,
  // CabinSlot props (passed through)
  fullSchedule,
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
  setStudentDetail,
  setOpenPopover,
  getDayConfig,
  isMakeupSlot,
}) => {
  const columns = useMemo(
    () => [
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
      ...DAYS.map((day, i) => ({
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
          const sessions = getSessions(i);
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
                <div key={cn}>
                  <CabinSlot
                    dateIndex={i}
                    sessionNum={session.num}
                    cabinNum={cn}
                    fullSchedule={fullSchedule}
                    weekDates={weekDates}
                    globalConfig={globalConfig}
                    lockedCabins={lockedCabins}
                    dragOverSlot={dragOverSlot}
                    dragState={dragState}
                    openPopover={openPopover}
                    getStudentByMaDk={getStudentByMaDk}
                    calcCabinTime={calcCabinTime}
                    canSwap={canSwap}
                    canDropIntoCabin={canDropIntoCabin}
                    toggleLock={toggleLock}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                    handleDragStartAll={handleDragStartAll}
                    handleDragStartOne={handleDragStartOne}
                    handleDragEnd={handleDragEnd}
                    handleRemoveStudent={handleRemoveStudent}
                    setStudentDetail={setStudentDetail}
                    setOpenPopover={setOpenPopover}
                    getDayConfig={getDayConfig}
                    isMakeupSlot={isMakeupSlot}
                    getSessions={getSessions}
                  />
                </div>
              ))}
            </div>
          );
        },
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      weekDates,
      getSessions,
      filterCabin,
      fullSchedule,
      globalConfig,
      lockedCabins,
      dragOverSlot,
      dragState,
      openPopover,
    ],
  );

  const dataSource = useMemo(
    () =>
      globalSessions.map((gSess, si) => ({
        key: si,
        sessionIndex: si,
        time: gSess.time,
      })),
    [globalSessions],
  );

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      size="small"
      bordered
      scroll={{ x: "max-content" }}
    />
  );
};

export default CabinTable;
