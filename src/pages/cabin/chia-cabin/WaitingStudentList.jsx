import { Card, Select, Input, Tag, Empty } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";
import { message } from "antd";

const WaitingStudentList = ({
  globalConfig,
  availableStudents,
  allStudents,
  filterKhoa,
  setFilterKhoa,
  filterStatus,
  setFilterStatus,
  search,
  setSearch,
  uniqueKhoaHoc,
  listDropOver,
  setListDropOver,
  dragState,
  setDragState,
  fullSchedule,
  assignedMaDks,
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

    const newSchedule = JSON.parse(JSON.stringify(fullSchedule));
    const sourceKey = `${source.di}-${source.sn}`;
    if (newSchedule[sourceKey]) {
      newSchedule[sourceKey].cabins[source.cn] = newSchedule[sourceKey].cabins[
        source.cn
      ].filter((id) => !maDks.includes(id));
    }
    const newAssigned = new Set(assignedMaDks);
    maDks.forEach((id) => {
      const stillExists = Object.keys(newSchedule).some((k) =>
        Object.values(newSchedule[k].cabins).some((c) => c.includes(id)),
      );
      if (!stillExists) newAssigned.delete(id);
    });
    updateCurrentWeek(() => ({
      schedule: newSchedule,
      assignedMaDks: newAssigned,
    }));
    setDragState(null);
    const label =
      maDks.length > 1
        ? `${maDks.length} học viên`
        : getStudentByMaDk(maDks[0])?.ho_ten || "Học viên";
    message.success(`Đã trả ${label} về danh sách chờ`);
  };

  return (
    <Card bodyStyle={{ padding: 8 }} className="sticky">
      {/* <div className="text-xs space-y-2 mb-4">
        <div>
          🔵 <b>Nhóm A</b> (chưa học Cabin): 1 người/cabin riêng, ưu tiên trước.
        </div>
        <div>
          🟢 <b>Nhóm B</b> (thiếu giờ): gom nhóm sao cho tổng phút còn thiếu +
          khoảng cách &le; {globalConfig.duration} ph/ca.
        </div>
        <div>
          🔄 <b>Hoán đổi</b>: kéo HV chưa có DL vào cabin HV chưa có DL khác →
          tự động hoán đổi.
        </div>
        <div>
          ↩ <b>Trả về</b>: kéo HV từ cabin thả vào vùng này để đưa về danh sách
          chờ.
        </div>
        <div>
          ⏱ <b>Giới hạn cabin</b>: tối đa {globalConfig.maxPerCabin} HV, cách
          nhau {globalConfig.intervalMinutes} phút.
        </div>
      </div> */}

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
          value={filterStatus}
          onChange={setFilterStatus}
          size="small"
          className="flex-1"
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "noData", label: "Chưa học Cabin" },
            { value: "hasData", label: "Đã học / Thiếu giờ" },
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

      <div className="flex gap-1 mb-2 flex-wrap">
        <Tag color="default" className="!text-[10px] !m-0">
          Chưa học Cabin
        </Tag>
        <Tag color="blue" className="!text-[10px] !m-0">
          Thiếu giờ Cabin
        </Tag>
      </div>

      <div
        className={[
          "flex flex-col gap-1.5 h-[66vh] overflow-y-auto pr-1 rounded-lg transition-all",
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
                <div className="font-medium text-gray-900 text-xs truncate">
                  Họ tên: {student.ho_ten}
                </div>
                <div className="text-[11px] text-gray-500">
                  Mã: {student.ma_dk}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {student.hang_xe && (
                    <Tag
                      color={student.hang_xe === "B1" ? "magenta" : "geekblue"}
                      className="!text-[10px] !px-1 !py-0 !m-0"
                    >
                      Hạng {student.hang_xe}
                    </Tag>
                  )}
                  {student.khoa_hoc && (
                    <Tag
                      color="default"
                      className="!text-[10px] !px-1 !py-0 !m-0"
                    >
                      {student.khoa_hoc}
                    </Tag>
                  )}
                  {hasData ? (
                    <>
                      <Tag
                        color="blue"
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        Bài {student.bai_cabin}
                      </Tag>
                      <Tag
                        color="cyan"
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        Đã học: {formatMinutesToHM(student.phut_cabin)}
                      </Tag>
                      <Tag
                        color="orange"
                        className="!text-[10px] !px-1 !py-0 !m-0"
                      >
                        Còn thiếu:{" "}
                        {formatMinutesToHM(
                          Math.max(
                            0,
                            globalConfig.duration - student.phut_cabin,
                          ),
                        )}
                      </Tag>
                    </>
                  ) : (
                    <Tag className="!text-[10px] !px-1 !py-0 !m-0">
                      Chưa có DL
                    </Tag>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  GV: {student.giao_vien}
                </div>
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
