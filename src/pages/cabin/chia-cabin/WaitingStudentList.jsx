import { Card, Select, Input, Tag, Empty, Spin } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";
import { message } from "antd";

const WaitingStudentList = ({
  loading,
  globalConfig,
  availableStudents,
  allStudents,
  filterKhoa,
  setFilterKhoa,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  search,
  setSearch,
  uniqueKhoaHoc,
  listDropOver,
  setListDropOver,
  dragState,
  setDragState,
  fullSchedule,
  assignedMaDks,
  allAssignedMaDks,
  updateCurrentWeek,
  getStudentByMaDk,
  isHasData,
  handleDragStartFromList,
  handleDragEnd,
  setStudentDetail,
  formatMinutesToHM,
}) => {
  const handleDrop = (e) => {
    e.preventDefault();
    setListDropOver(false);
    if (!dragState?.source) return;
    const { maDks, source } = dragState;
    if (!maDks?.length) return;

    updateCurrentWeek((old) => {
      const nextSchedule = JSON.parse(JSON.stringify(old.schedule));
      const sourceKey = `${source.di}-${source.sn}`;
      if (nextSchedule[sourceKey]) {
        nextSchedule[sourceKey].cabins[source.cn] = (
          nextSchedule[sourceKey].cabins[source.cn] || []
        ).filter((id) => !maDks.includes(id));
      }

      const nextAssigned = new Set(old.assignedMaDks);
      maDks.forEach((id) => {
        const stillExists = Object.keys(nextSchedule).some((k) =>
          Object.values(nextSchedule[k].cabins || {}).some((c) =>
            Array.isArray(c) && c.includes(id)
          )
        );
        if (!stillExists) nextAssigned.delete(id);
      });

      return {
        schedule: nextSchedule,
        assignedMaDks: nextAssigned,
      };
    });
    setDragState(null);
    const label =
      maDks.length > 1
        ? `${maDks.length} học viên`
        : getStudentByMaDk(maDks[0])?.giao_vien || "Giáo viên";
    message.success(`Đã trả ${label} về danh sách chờ`);
  };

  return (
    <Card
      bodyStyle={{ padding: 8, height: "100%", display: "flex", flexDirection: "column" }}
      className="h-[86vh]"
    >
      <div className="font-semibold text-sm flex items-center gap-1.5 mb-2">
        <UserOutlined />
        Chờ xếp ({availableStudents.length}/{allStudents.length})
      </div>

      <div className="flex gap-2 mb-2">
        <Select
          value={filterKhoa}
          onChange={setFilterKhoa}
          size="small"
          className="flex-1"
          options={[
            { value: "all", label: "Tất cả khóa" },
            ...uniqueKhoaHoc.map((k) => ({ value: k, label: k })),
          ]}
        />
        <Select
          value={filterType}
          onChange={setFilterType}
          size="small"
          className="flex-1"
          options={[
            { value: "all", label: "Lọc theo loại HV" },
            { value: "normal", label: "Học viên chính khóa" },
            { value: "makeup", label: "Học viên học bù" },
          ]}
        />
      </div>

      <div className="flex gap-2 mb-2">
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          size="small"
          className="w-full"
          options={[
            { value: "all", label: "Tất cả trạng thái / Lần chia" },
            { value: "noData", label: "Chưa học Cabin" },
            { value: "hasData", label: "Đã học / Thiếu giờ" },
            { value: "previouslyAssigned", label: "Đã từng được chia cabin" },
          ]}
        />
      </div>

      <Input
        placeholder="Tìm tên, mã ĐK, GV..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        className="mb-2"
      />

      <div
        className={[
          "flex flex-col gap-1.5 flex-1 min-h-[0px] overflow-y-auto pr-1 rounded-lg transition-all",
          listDropOver ? "ring-2 ring-orange-400 bg-orange-50" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onDragOver={(e) => {
          if (dragState?.source) {
            e.preventDefault();
            setListDropOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget))
            setListDropOver(false);
        }}
        onDrop={handleDrop}
      >
        {listDropOver && dragState?.source && (
          <div className="text-center text-xs text-orange-600 font-medium py-2 border-2 border-dashed border-orange-400 rounded-lg mb-1">
            ↓ Thả để trả về danh sách chờ
          </div>
        )}

        {availableStudents.length > 0 ? (
          availableStudents.map((student) => {
            const hasData = isHasData(student);
            const isChiaLan2 = student.so_lan_chia === 2 && !student.is_makeup;
            const isDraggingThis = dragState?.maDks?.includes(student.ma_dk);

            return (
              <div
                key={student.ma_dk}
                draggable
                onDragStart={(e) => handleDragStartFromList(e, student.ma_dk)}
                onDragEnd={handleDragEnd}
                onClick={() => setStudentDetail(student)}
                className={[
                  "px-2 py-1.5 rounded-xl border bg-white",
                  "hover:border-blue-400 hover:shadow-md",
                  "transition-all cursor-grab active:cursor-grabbing",
                  hasData ? "border-blue-200" : "border-gray-200",
                  isDraggingThis ? "opacity-40" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {!hasData ? (
                  // Simplified view for "No Data" students
                  <>
                    <div className={`font-medium text-gray-900 text-xs mb-1 ${isChiaLan2 ? "" : "truncate"}`}>
                      Giáo viên: {student.giao_vien || "Chưa gán"}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Tag
                        color={student.hang_xe === "B1" ? "magenta" : "geekblue"}
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        Hạng {student.hang_xe}
                      </Tag>
                      <Tag
                        color="default"
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        {student.khoa_hoc}
                      </Tag>
                      <Tag className="!text-[10px] !px-1 !py-0 !m-0 bg-gray-100 text-gray-500 border-none">
                        Chưa có dữ liệu
                      </Tag>
                      {isChiaLan2 && (
                        <Tag color="red" className="!text-[10px] !px-1 !py-0 !m-0 font-bold">
                          chia lần 2
                        </Tag>
                      )}
                    </div>
                  </>
                ) : (
                  // Detailed view for students with training data
                  <>
                    <div className={`font-medium text-gray-900 text-xs ${isChiaLan2 ? "" : "truncate"}`}>
                      Họ tên: {student.ho_ten}
                    </div>
                    <div className="text-[11px] text-gray-500 mb-1">
                      Mã: {student.ma_dk}
                    </div>
                    <div className="flex gap-1 mb-1.5 flex-wrap">
                      <Tag
                        color={student.hang_xe === "B1" ? "magenta" : "geekblue"}
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        Hạng {student.hang_xe}
                      </Tag>
                      <Tag
                        color="default"
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        {student.khoa_hoc}
                      </Tag>
                      <Tag
                        color="blue"
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        Bài {student.so_bai_hoc || 0}
                      </Tag>
                      {isChiaLan2 && (
                        <Tag color="red" className="!text-[10px] !px-1 !py-0 !m-0 font-bold">
                          chia lần 2
                        </Tag>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap mb-1">
                      <Tag
                        color="cyan"
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        Đã học: {formatMinutesToHM(student.phut_cabin || 0)}
                      </Tag>
                      <Tag
                        color="orange"
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        Thiếu: {formatMinutesToHM(Math.max(0, globalConfig.duration - (student.phut_cabin || 0)))}
                      </Tag>
                    </div>
                    <div className={`text-[11px] text-gray-400 mt-1 ${isChiaLan2 ? "" : "truncate"}`}>
                      GV: {student.giao_vien}
                    </div>
                  </>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12">
            <Empty description="Không còn học viên chờ" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default WaitingStudentList;
