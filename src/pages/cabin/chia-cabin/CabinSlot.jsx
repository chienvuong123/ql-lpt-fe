import React, { useMemo } from "react";
import { Tag, Popover } from "antd";
import {
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  DragOutlined,
} from "@ant-design/icons";
import StudentMiniCard from "./StudentMiniCard";

// ── Bảng màu cho khóa học ─────────────────────────────────────────────────────
const KHOA_COLORS = [
  { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700" },
  { bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-700" },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
  },
  { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
  { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700" },
  {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-300",
    text: "text-fuchsia-700",
  },
  { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-700" },
  { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" },
  { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-700" },
  { bg: "bg-lime-50", border: "border-lime-300", text: "text-lime-700" },
];

// Cache toàn cục — nhất quán màu giữa tất cả cabin/tuần
const khoaColorCache = new Map();
let colorIndex = 0;

// eslint-disable-next-line react-refresh/only-export-components
export const getKhoaColor = (khoa) => {
  if (!khoa) return null;
  if (!khoaColorCache.has(khoa)) {
    khoaColorCache.set(khoa, KHOA_COLORS[colorIndex % KHOA_COLORS.length]);
    colorIndex++;
  }
  return khoaColorCache.get(khoa);
};

// ─────────────────────────────────────────────────────────────────────────────

const CabinSlot = ({
  dateIndex,
  sessionNum,
  cabinNum,
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
  getSessions,
}) => {
  const key = `${dateIndex}-${sessionNum}`;
  const maDkList = fullSchedule[key]?.cabins[cabinNum] || [];
  const students = maDkList.map(getStudentByMaDk).filter(Boolean);
  const isEmpty = students.length === 0;
  const hasMultiple = students.length > 1;

  const dCfg = getDayConfig(dateIndex);
  const b1Count = dCfg.b1Cabins ?? globalConfig.b1Cabins;
  const cType = Number(cabinNum) > 5 - b1Count ? "B1" : "B2";

  const session = getSessions(dateIndex).find((s) => s?.num === sessionNum);
  const isMakeupZone = session ? isMakeupSlot(dateIndex, session) : false;

  const slotKey = `${dateIndex}-${sessionNum}-${cabinNum}`;
  const isLocked = lockedCabins[slotKey] || false;
  const isDragOver = dragOverSlot === slotKey;
  const isPopoverOpen = openPopover === slotKey;

  const totalTime = calcCabinTime(students);
  const minuteOverflow = totalTime >= globalConfig.duration;
  const countOverflow = students.length > globalConfig.maxPerCabin;
  const hasError = minuteOverflow || countOverflow;

  const draggingMaDks = dragState?.maDks ?? [];

  const willSwap =
    !isLocked &&
    !isEmpty &&
    draggingMaDks.length > 0 &&
    canSwap(maDkList, draggingMaDks);

  const dropAllowed = isLocked
    ? false
    : willSwap
      ? true
      : canDropIntoCabin(maDkList, draggingMaDks, cabinNum, slotKey);

  // ── Màu theo khóa học ────────────────────────────────────────────────────
  const dominantKhoa = students[0]?.khoa_hoc ?? null;
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const khoaColor = useMemo(() => getKhoaColor(dominantKhoa), [dominantKhoa]);

  const baseColorClass = useMemo(() => {
    if (isEmpty) return "bg-white border-gray-200 hover:border-blue-300";
    if (hasError) return "bg-red-50 border-red-200";
    if (khoaColor) return `${khoaColor.bg} ${khoaColor.border}`;
    return "bg-blue-50 border-blue-200";
  }, [isEmpty, hasError, khoaColor]);

  // ── Popover content ──────────────────────────────────────────────────────
  const popoverContent = (
    <div className="w-64 space-y-2 max-h-80 overflow-y-auto">
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <span className="font-semibold text-sm text-gray-700">
          {/* Cabin {cabinNum} ({cType}) — {students.length}/
          {globalConfig.maxPerCabin} HV */}
        </span>
        {totalTime > 0 && (
          <Tag color={hasError ? "red" : "green"}>
            Cần {totalTime}/{globalConfig.duration} ph
          </Tag>
        )}
        {isMakeupZone && (
          <Tag color="volcano" className="font-bold">Ô HỌC BÙ</Tag>
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
            handleRemoveStudent(dateIndex, sessionNum, cabinNum, student.ma_dk)
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
        baseColorClass,
        isDragOver && willSwap
          ? "!ring-2 !ring-yellow-400 !border-yellow-400 !bg-yellow-50 scale-[1.02]"
          : isDragOver && dropAllowed
            ? "!ring-2 !ring-green-400 !border-green-400 !bg-green-50 scale-[1.02]"
            : isDragOver && !dropAllowed
              ? "!ring-2 !ring-red-400 !border-red-400 !bg-red-50"
              : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 leading-none uppercase">
            Cabin {cabinNum} <span className="font-bold">({cType})</span>
          </span>
          {isMakeupZone && (
            <span className="text-[9px] bg-volcano-100 text-volcano-600 px-1 rounded shadow-sm border border-volcano-200">BÙ</span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleLock(slotKey);
            }}
            className={`p-0.5 rounded transition hover:scale-110 ${
              isLocked
                ? "bg-red-100 text-red-600"
                : "hover:bg-gray-200 text-gray-400"
            }`}
            title={isLocked ? "Mở khoá Cabin" : "Khoá Cabin"}
          >
            {isLocked ? (
              <LockOutlined style={{ fontSize: 10 }} />
            ) : (
              <UnlockOutlined style={{ fontSize: 10 }} />
            )}
          </button>
        </div>
        {/* <span
          className={[
            "text-xs",
            isEmpty
              ? "text-gray-400"
              : hasError
                ? "text-red-500"
                : khoaColor
                  ? khoaColor.text
                  : "text-blue-500",
          ].join(" ")}
        >
          (
          {isEmpty
            ? "Trống"
            : `${students.length}/${globalConfig.maxPerCabin} HV`}
          )
        </span> */}
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
          {students.slice(0, 2).map((s) => {
            const c = getKhoaColor(s.khoa_hoc);
            return (
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
                className={[
                  "text-[11px] font-medium truncate cursor-grab active:cursor-grabbing leading-4 px-1 rounded",
                  dragState?.maDks?.includes(s.ma_dk) ? "opacity-40" : "",
                  c ? `${c.bg} ${c.text}` : "text-gray-800",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={s.ho_ten}
              >
                {s.ho_ten}
              </div>
            );
          })}
          {students.length > 2 && (
            <div className="text-[10px] text-blue-500 font-semibold">
              +{students.length - 2} khác…
            </div>
          )}
          {totalTime > 0 && (
            <div
              className={`text-[10px] font-semibold ${
                hasError ? "text-red-500" : "text-green-600"
              }`}
            >
              Cần {totalTime}/{globalConfig.duration} ph
            </div>
          )}
          {isDragOver && (
            <div
              className={`text-[10px] font-medium ${
                willSwap
                  ? "text-yellow-600"
                  : dropAllowed
                    ? "text-green-600"
                    : "text-red-500"
              }`}
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
          className={`relative flex justify-between items-center gap-1 cursor-grab active:cursor-grabbing ${
            dragState?.maDks?.includes(students[0].ma_dk) ? "opacity-40" : ""
          }`}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setStudentDetail(students[0]);
            }}
            className="flex flex-col text-[11px] font-medium text-gray-800 hover:underline cursor-pointer truncate"
            title={students[0].ho_ten}
          >
            <span>
              {students[0].ho_ten}{" "}
              <span
                className={`text-[11px] rounded w-fit mt-0.5 font-semibold ${
                  khoaColor
                    ? `${khoaColor.bg} ${khoaColor.text}`
                    : "text-gray-500"
                }`}
              >
                ({students[0].khoa_hoc})
              </span>
            </span>
            <span className="text-[11px] text-gray-500 font-normal">
              GV: {students[0].giao_vien}
            </span>
          </div>
          {isDragOver && (
            <span
              className={`text-[10px] font-medium absolute -top-1 left-0 right-0 text-center ${
                willSwap
                  ? "text-yellow-600"
                  : dropAllowed
                    ? "text-green-600"
                    : "text-red-500"
              }`}
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
            <DeleteOutlined style={{ fontSize: 11, color: "red" }} />
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

export default CabinSlot;
