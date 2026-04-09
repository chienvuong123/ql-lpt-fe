import {
  CalendarOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
  BgColorsOutlined,
  UserOutlined,
  DownOutlined,
  FileExcelOutlined,
  SaveOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Button, Select, Dropdown } from "antd";
import { dateStr } from "./utils";

const ScheduleHeader = ({
  weekDates,
  assignedMaDks,
  allAssignedMaDks,
  allStudents,
  assignedSlots,
  totalSlots,
  globalConfig,
  unassignedNoData,
  unassignedHasData,
  filterCabin,
  setFilterCabin,
  setWeek,
  week,
  onAutoAssign,
  onOpenLimitModal,
  onOpenSettings,
  onExport,
  onSave,
  onClear,
  loadingSync,
  priorityCourse,
  setPriorityCourse,
  uniqueKhoaHoc,
  onConfigBasedAssign,
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full mx-auto px-6 py-3">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <CalendarOutlined style={{ fontSize: "22px", color: "white" }} />
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
                    onClick: () => onAutoAssign("all"),
                  },
                  {
                    key: "noDataOnly",
                    label: "Chỉ chia học viên chưa học Cabin",
                    icon: <UserOutlined />,
                    onClick: () => onAutoAssign("noDataOnly"),
                  },
                  { type: 'divider' },
                  {
                    key: "allConfigs",
                    label: "Chia tự động theo cấu hình các Cabin (Tất cả máy)",
                    icon: <BgColorsOutlined />,
                    className: "text-blue-600 font-semibold",
                    onClick: () => onConfigBasedAssign([1, 2, 3, 4, 5]),
                  },
                  ...(filterCabin !== "all" ? [
                    {
                      key: "specificCabin",
                      label: `Chia riêng cho Cabin ${filterCabin} (Theo cấu hình %)`,
                      icon: <BgColorsOutlined />,
                      danger: true,
                      onClick: () => onConfigBasedAssign([filterCabin]),
                    }
                  ] : []),
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
              onClick={onOpenLimitModal}
              title="Giới hạn cabin"
            >
              Giới hạn cabin
            </Button>

            <Button icon={<SettingOutlined />} onClick={onOpenSettings}>
              Cài đặt
            </Button>

            <Button
              icon={<SaveOutlined />}
              onClick={onSave}
              loading={loadingSync}
              type="primary"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Lưu lịch
            </Button>
            <Button
              icon={<DeleteOutlined />}
              onClick={onClear}
              danger
              title="Xóa hết tuần này"
              className="hover:!bg-red-50"
            >
              Xóa lịch đã chia
            </Button>

            <Button
              icon={<FileExcelOutlined />}
              onClick={onExport}
              style={{
                background: "#217346",
                borderColor: "#217346",
                color: "#fff",
              }}
            >
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Week navigation */}
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

          {/* Cabin filter */}
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
            {filterCabin !== "all" && (
              <Button 
                size="small" 
                type="dashed" 
                onClick={() => onConfigBasedAssign([filterCabin])}
                className="text-blue-600 border-blue-200 hover:text-blue-700 hover:border-blue-400"
              >
                Chia theo cấu hình Cabin
              </Button>
            )}
          </div>

          {/* Priority course */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Khóa ưu tiên (đẩy lịch):</span>
            <Select
              value={priorityCourse}
              onChange={setPriorityCourse}
              size="small"
              style={{ width: 140 }}
              options={[
                { value: "all", label: "Không có" },
                ...uniqueKhoaHoc.map((k) => ({
                  value: k,
                  label: k,
                })),
              ]}
            />
          </div>

          {/* Stats */}
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
                {globalConfig.maxPerCabin} HV / {globalConfig.intervalMinutes}ph
              </b>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleHeader;
