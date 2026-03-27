import React, { useState, useMemo, useCallback } from "react";
import {
  CalendarOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";
import {
  Input,
  Button,
  Modal,
  InputNumber,
  Empty,
  message,
  Drawer,
  Tabs,
  Select,
  Switch,
  Row,
  Col,
  Card,
  Table,
} from "antd";

const LichCabin = () => {
  // ============= FAKE DATA =============
  const generateStudents = () => {
    const courses = ["Java", "Python", "React", "Node.js", "Vue.js"];
    const instructors = [
      "Thầy Minh",
      "Cô Linh",
      "Thầy Hùng",
      "Cô Thúy",
      "Thầy Tuấn",
    ];

    return Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      name: `Học viên ${i + 1}`,
      code: `HV${String(i + 1).padStart(5, "0")}`,
      course: courses[i % courses.length],
      instructor: instructors[i % instructors.length],
      minutesBooked: 0,
      hoursBooked: 0,
      status: "Chưa học",
    }));
  };

  // ============= STATE =============
  const [globalConfig, setGlobalConfig] = useState({
    duration: 150,
    startTime: "07:00",
    endTime: "19:30",
  });

  // Chỉ lưu override cho ngày đặc biệt (T5 kết thúc sớm)
  const [dayConfigs, setDayConfigs] = useState({
    5: { start: "07:00", end: "19:30", noSessions: false },
  });

  const [allStudents] = useState(generateStudents());
  const [assignedStudentIds, setAssignedStudentIds] = useState(new Set());
  const [schedule, setSchedule] = useState({});
  const [search, setSearch] = useState("");
  const [settingsModal, setSettingsModal] = useState(false);
  const [week, setWeek] = useState(new Date("2026-03-23"));
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [draggedStudent, setDraggedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [settingsTab, setSettingsTab] = useState("global");
  const [filterCabin, setFilterCabin] = useState("all");

  // ============= HELPER FUNCTIONS =============
  const timeToMin = (t) =>
    parseInt(t.split(":")[0]) * 60 + parseInt(t.split(":")[1]);
  const minToTime = (m) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  // Ưu tiên override của ngày đặc biệt, nếu không có thì dùng globalConfig
  const getDayConfig = (dayIdx) => {
    const override = dayConfigs[dayIdx];
    if (override?.noSessions) {
      return { noSessions: true };
    }
    return {
      start: override?.start ?? globalConfig.startTime,
      end: override?.end ?? globalConfig.endTime,
      noSessions: false,
    };
  };

  const getSessions = useCallback(
    (dayIdx) => {
      const dayConfig = getDayConfig(dayIdx);
      if (dayConfig.noSessions) return [];

      const sessions = [];
      let start = timeToMin(dayConfig.start);
      const endMin = timeToMin(dayConfig.end);
      let i = 1;

      while (start + globalConfig.duration <= endMin) {
        sessions.push({
          num: i,
          time: `${minToTime(start)}-${minToTime(start + globalConfig.duration)}`,
        });
        start += globalConfig.duration;
        i++;
      }
      return sessions;
    },
    [globalConfig, dayConfigs],
  );

  const weekDates = useMemo(() => {
    const w = new Date(week);
    const day = w.getDay();
    w.setDate(w.getDate() - day + (day === 0 ? -6 : 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(w);
      d.setDate(w.getDate() + i);
      return d;
    });
  }, [week]);

  const initSchedule = useMemo(() => {
    const s = {};
    weekDates.forEach((_, di) => {
      const dayIdx = (di + 1) % 7;
      getSessions(dayIdx).forEach((sess) => {
        const key = `${di}-${sess.num}`;
        s[key] = {
          time: sess.time,
          cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
        };
      });
    });
    return s;
  }, [weekDates, getSessions]);

  const fullSchedule = { ...initSchedule, ...schedule };

  // ============= HANDLE FUNCTIONS =============
  const getStudentById = (id) => allStudents.find((s) => s.id === id);

  const handleAutoAssign = () => {
    const newSchedule = JSON.parse(JSON.stringify(fullSchedule));
    let studentIdx = 0;
    const assigned = new Set();

    Object.keys(newSchedule).forEach((key) => {
      [1, 2, 3, 4, 5].forEach((cabinNum) => {
        if (studentIdx < allStudents.length) {
          const sid = allStudents[studentIdx].id;
          newSchedule[key].cabins[cabinNum] = [sid];
          assigned.add(sid);
          studentIdx++;
        }
      });
    });

    setSchedule(newSchedule);
    setAssignedStudentIds(assigned);
    message.success("Đã chia tự động cho 200 học viên");
  };

  const handleAddStudent = (id) => {
    if (!selectedCabin) return;
    const [di, sn, cn] = selectedCabin.split("-");
    const key = `${di}-${sn}`;
    const newSchedule = { ...fullSchedule };

    if (!newSchedule[key]) {
      newSchedule[key] = {
        time: "",
        cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      };
    }

    if (!newSchedule[key].cabins[cn].includes(id)) {
      newSchedule[key].cabins[cn] = [id];
      setSchedule(newSchedule);
      const newAssigned = new Set(assignedStudentIds);
      newAssigned.add(id);
      setAssignedStudentIds(newAssigned);
    }
    setSelectedCabin(null);
  };

  const handleRemoveStudent = (di, sn, cn, id) => {
    const key = `${di}-${sn}`;
    const newSchedule = { ...fullSchedule };
    newSchedule[key].cabins[cn] = newSchedule[key].cabins[cn].filter(
      (s) => s !== id,
    );

    const stillExists = Object.keys(newSchedule).some((k) =>
      Object.values(newSchedule[k].cabins).some((cabin) => cabin.includes(id)),
    );

    if (!stillExists) {
      const newAssigned = new Set(assignedStudentIds);
      newAssigned.delete(id);
      setAssignedStudentIds(newAssigned);
    }
    setSchedule(newSchedule);
  };

  const handleDragStart = (e, studentId) => {
    setDraggedStudent(studentId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, di, sn, cn) => {
    e.preventDefault();
    if (!draggedStudent) return;

    const key = `${di}-${sn}`;
    const newSchedule = { ...fullSchedule };
    if (!newSchedule[key]) {
      newSchedule[key] = {
        time: "",
        cabins: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      };
    }

    if (!newSchedule[key].cabins[cn].includes(draggedStudent)) {
      newSchedule[key].cabins[cn] = [draggedStudent];
      const newAssigned = new Set(assignedStudentIds);
      newAssigned.add(draggedStudent);
      setAssignedStudentIds(newAssigned);
      setSchedule(newSchedule);
    }
    setDraggedStudent(null);
  };

  const availableStudents = allStudents.filter(
    (s) =>
      !assignedStudentIds.has(s.id) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.includes(search) ||
        s.course.toLowerCase().includes(search.toLowerCase()) ||
        s.instructor.toLowerCase().includes(search.toLowerCase())),
  );

  const dateStr = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const maxSessions = Math.max(
    ...weekDates.map((_, di) => getSessions((di + 1) % 7).length || 0),
  );

  const totalSlots = Object.keys(fullSchedule).length * 5;
  const assignedSlots = Object.values(fullSchedule).reduce(
    (sum, s) =>
      sum + Object.values(s.cabins).reduce((cs, c) => cs + c.length, 0),
    0,
  );

  // ============= RENDER CABIN SLOT =============
  const renderCabinSlot = (dateIndex, sessionNum, cabinNum) => {
    const key = `${dateIndex}-${sessionNum}`;
    const sessionData = fullSchedule[key];
    const studentIds = sessionData?.cabins[cabinNum] || [];
    const student =
      studentIds.length > 0 ? getStudentById(studentIds[0]) : null;
    const isEmpty = !student;

    return (
      <div
        key={cabinNum}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, dateIndex, sessionNum, cabinNum)}
        onClick={() =>
          isEmpty && setSelectedCabin(`${dateIndex}-${sessionNum}-${cabinNum}`)
        }
        className={`border border-gray-200 rounded-md py-1 text-center flex flex-col transition-all hover:shadow-sm group ${
          isEmpty ? "bg-white hover:bg-blue-50 cursor-pointer" : "bg-blue-50"
        }`}
      >
        <div className="text-[11.5px] text-gray-500 font-medium">
          <span className="uppercase">Cabin</span> {cabinNum} (
          {isEmpty ? "Trống" : "Đủ"})
        </div>

        {isEmpty ? (
          <span className="text-xs text-blue-600 font-medium">Thêm +</span>
        ) : (
          <div className="flex-1 flex items-center text-center justify-between">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setStudentDetail(student);
              }}
              className="font-medium text-gray-800 cursor-pointer hover:underline flex-1"
            >
              {student.name}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveStudent(
                  dateIndex,
                  sessionNum,
                  cabinNum,
                  student.id,
                );
              }}
              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1"
            >
              <DeleteOutlined />
            </button>
          </div>
        )}
      </div>
    );
  };

  const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const columns = [
    {
      title: "Giờ",
      dataIndex: "time",
      key: "time",
      width: 120,
      fixed: "left",
      render: (time) => <div className="font-medium text-gray-700">{time}</div>,
    },
    ...days.map((day, i) => ({
      title: (
        <div className="text-center">
          <div>{day}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {dateStr(weekDates[i])}
          </div>
        </div>
      ),
      dataIndex: `day_${i}`,
      key: `day_${i}`,
      render: (_, record) => {
        const dateIdx = i;
        const dayIndex = (dateIdx + 1) % 7;
        const sessions = getSessions(dayIndex);
        const session = sessions[record.sessionIndex];

        if (!session) {
          return (
            <div className="flex items-center justify-center h-24 text-sm text-gray-400 italic bg-gray-50 rounded">
              không có ca học
            </div>
          );
        }

        const visibleCabins =
          filterCabin === "all" ? [1, 2, 3, 4, 5] : [Number(filterCabin)];

        return (
          <div className="space-y-3">
            {visibleCabins.map((cabinNum) => (
              <div key={cabinNum}>
                {renderCabinSlot(dateIdx, session.num, cabinNum)}
              </div>
            ))}
          </div>
        );
      },
    })),
  ];

  const dataSource = Array.from({ length: maxSessions }, (_, si) => ({
    key: si,
    sessionIndex: si,
    time: getSessions(1)[si]?.time || "",
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <CalendarOutlined
                  style={{ fontSize: "24px", color: "white" }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Xếp lịch học CABIN
                </h1>
                <p className="text-sm text-gray-500">
                  Quản lý lịch học cho 5 cabin
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="primary"
                icon={<BgColorsOutlined />}
                onClick={handleAutoAssign}
                className="bg-green-600 hover:bg-green-700"
              >
                Tự động chia
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setSettingsModal(true)}
              >
                Cài đặt
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                icon={<LeftOutlined />}
                onClick={() => setWeek(new Date(week.getTime() - 7 * 86400000))}
              />
              <span className="text-sm font-semibold text-gray-700 min-w-[220px] text-center">
                Tuần bắt đầu: {dateStr(weekDates[0])}
              </span>
              <Button
                icon={<RightOutlined />}
                onClick={() => setWeek(new Date(week.getTime() + 7 * 86400000))}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Hiển thị:</span>
              <Select
                value={filterCabin}
                onChange={setFilterCabin}
                style={{ width: 160 }}
                options={[
                  { value: "all", label: "Tất cả cabin" },
                  { value: 1, label: "Cabin 1" },
                  { value: 2, label: "Cabin 2" },
                  { value: 3, label: "Cabin 3" },
                  { value: 4, label: "Cabin 4" },
                  { value: 5, label: "Cabin 5" },
                ]}
              />
            </div>

            <div className="text-sm text-gray-600">
              Tổng slot: {totalSlots} | Đã gán: {assignedSlots} | Tỷ lệ:{" "}
              {((assignedSlots / totalSlots) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Bảng lịch */}
      <Row gutter={[12, 12]} className="!m-3">
        <Col span={18}>
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="small"
            bordered
            scroll={{ x: "max-content" }}
          />
        </Col>
        <Col span={6}>
          <Card>
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <UserOutlined style={{ color: "#2563eb" }} />
                Học viên chờ xếp lịch ({availableStudents.length} /{" "}
                {allStudents.length})
              </h2>
              <Input
                placeholder="Tìm kiếm theo tên, mã, khóa học, giảng viên..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-80"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5 max-h-80 overflow-y-auto">
              {availableStudents.length > 0 ? (
                availableStudents.map((student) => (
                  <button
                    key={student.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, student.id)}
                    onClick={() => {
                      if (selectedCabin) handleAddStudent(student.id);
                      else setStudentDetail(student);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                      selectedCabin
                        ? "bg-blue-50 border-blue-400 hover:bg-blue-100"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {student.code}
                    </div>
                    <div className="text-xs text-gray-600">
                      {student.course}
                    </div>
                    <div className="flex justify-between text-xs mt-3">
                      <span className="text-gray-500">
                        {student.instructor}
                      </span>
                      <span className="text-blue-600 font-semibold">
                        {student.status}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <Empty description="Không còn học viên chờ" />
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
      <div className="flex-1 overflow-auto px-6 py-6"></div>

      {/* ==================== SETTINGS MODAL ==================== */}
      <Modal
        title="Cài đặt thời gian"
        open={settingsModal}
        onCancel={() => setSettingsModal(false)}
        width={720}
        footer={null}
      >
        <Tabs
          activeKey={settingsTab}
          onChange={setSettingsTab}
          items={[
            {
              key: "global",
              label: "Cài đặt chung",
              children: (
                <div className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giờ bắt đầu chung (7h30)
                      </label>
                      <Input
                        type="time"
                        value={globalConfig.startTime}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giờ kết thúc chung (22h30)
                      </label>
                      <Input
                        type="time"
                        value={globalConfig.endTime}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            endTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời lượng mỗi ca (phút)
                    </label>
                    <InputNumber
                      min={30}
                      max={240}
                      value={globalConfig.duration}
                      onChange={(v) =>
                        setGlobalConfig({ ...globalConfig, duration: v })
                      }
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Tất cả các ngày sẽ dùng giờ chung này trừ khi có cài đặt
                    riêng cho ngày đó.
                  </p>
                </div>
              ),
            },
            {
              key: "daily",
              label: "Cài đặt ngày đặc biệt",
              children: (
                <div className="space-y-6 pt-4 max-h-[520px] overflow-y-auto pr-2">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                    (day, idx) => {
                      const dayIdx = idx === 6 ? 0 : idx + 1;
                      const override = dayConfigs[dayIdx] || {};

                      return (
                        <div
                          key={day}
                          className="border rounded-2xl p-5 bg-white"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-700">
                              {day}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">
                                Không nhận ca nào
                              </span>
                              <Switch
                                checked={override.noSessions || false}
                                onChange={(checked) =>
                                  setDayConfigs({
                                    ...dayConfigs,
                                    [dayIdx]: {
                                      ...override,
                                      noSessions: checked,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>

                          {!override.noSessions && (
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Giờ bắt đầu
                                </label>
                                <Input
                                  type="time"
                                  value={
                                    override.start || globalConfig.startTime
                                  }
                                  onChange={(e) =>
                                    setDayConfigs({
                                      ...dayConfigs,
                                      [dayIdx]: {
                                        ...override,
                                        start: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Giờ kết thúc
                                </label>
                                <Input
                                  type="time"
                                  value={override.end || globalConfig.endTime}
                                  onChange={(e) =>
                                    setDayConfigs({
                                      ...dayConfigs,
                                      [dayIdx]: {
                                        ...override,
                                        end: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              ),
            },
          ]}
        />

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <Button onClick={() => setSettingsModal(false)}>Hủy</Button>
          <Button
            type="primary"
            onClick={() => {
              setSchedule({});
              setSettingsModal(false);
              message.success("Đã lưu cài đặt thời gian!");
            }}
          >
            Lưu cài đặt
          </Button>
        </div>
      </Modal>

      {/* Student Detail Drawer */}
      <Drawer
        title="Thông tin học viên"
        placement="right"
        onClose={() => setStudentDetail(null)}
        open={!!studentDetail}
      >
        {studentDetail && (
          <div className="space-y-6">
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Mã học viên</label>
                  <p className="text-2xl font-bold text-blue-600">
                    {studentDetail.code}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tên học viên</label>
                  <p className="text-xl font-semibold">{studentDetail.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-600">Khóa học</label>
                    <p>{studentDetail.course}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">Giảng viên</label>
                    <p>{studentDetail.instructor}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default LichCabin;
