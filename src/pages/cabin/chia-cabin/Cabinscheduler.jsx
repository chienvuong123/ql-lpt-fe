import { useState, useMemo, useCallback } from "react";
import {
  Layout,
  Table,
  Tag,
  Button,
  Select,
  InputNumber,
  Card,
  Drawer,
  Badge,
  Tooltip,
  Modal,
  Form,
  Typography,
  Statistic,
  Row,
  Col,
  Divider,
  Space,
  Alert,
  Empty,
  ConfigProvider,
  theme,
} from "antd";
import {
  CalendarOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  RightOutlined,
  LeftOutlined,
  ReloadOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  CABINS,
  ALL_SLOTS,
  generateStudents,
  DEFAULT_DAY_CONFIG,
} from "../data/mockData";
import { autoSchedule, getDayStats, getWeekDates } from "../utils/scheduler";

dayjs.locale("vi");

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function CabinScheduler() {
  const [students] = useState(() => generateStudents(35));
  const [config, setConfig] = useState(DEFAULT_DAY_CONFIG);
  const [startDate] = useState(dayjs().startOf("week").add(1, "day"));
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null); // { date, slotId, cabinId }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);

  const schedule = useMemo(
    () => autoSchedule(students, config, startDate.format("YYYY-MM-DD")),
    [students, config, startDate],
  );

  const weekDates = useMemo(() => {
    const base = startDate.add(weekOffset * 7, "day");
    return getWeekDates(base);
  }, [startDate, weekOffset]);

  const activeSlots = ALL_SLOTS.slice(0, config.activeSlotsCount);

  const getCellStudents = useCallback(
    (date, slotId, cabinId) => {
      const key = date.format("YYYY-MM-DD");
      return schedule[key]?.[slotId]?.[cabinId] || [];
    },
    [schedule],
  );

  const openCellDetail = (date, slotId, cabinId) => {
    setSelectedCell({ date, slotId, cabinId });
    setDrawerOpen(true);
  };

  const saveSettings = () => {
    setConfig({ ...tempConfig });
    setSettingsOpen(false);
  };

  const selectedStudents = selectedCell
    ? getCellStudents(
        selectedCell.date,
        selectedCell.slotId,
        selectedCell.cabinId,
      )
    : [];

  const selectedSlot = selectedCell
    ? ALL_SLOTS.find((s) => s.id === selectedCell.slotId)
    : null;
  const selectedCabin = selectedCell
    ? CABINS.find((c) => c.id === selectedCell.cabinId)
    : null;

  const totalScheduled = Object.values(schedule).reduce((acc, day) => {
    Object.values(day).forEach((slots) => {
      Object.values(slots).forEach((list) => {
        acc += list.length;
      });
    });
    return acc;
  }, 0);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: "#6366f1", borderRadius: 8 },
      }}
    >
      <Layout style={{ minHeight: "100vh", background: "#0f0f1a" }}>
        {/* TOP HEADER */}
        <Header
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            borderBottom: "1px solid #2d2d4e",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <Space align="center">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            <div>
              <Title
                level={5}
                style={{
                  margin: 0,
                  color: "#e2e8f0",
                  fontFamily: "Georgia, serif",
                  letterSpacing: 1,
                }}
              >
                CABIN SCHEDULER
              </Title>
              <Text style={{ color: "#6b7280", fontSize: 11 }}>
                Hệ thống xếp lịch học tự động
              </Text>
            </div>
          </Space>

          <Space>
            <Tag color="purple" style={{ fontSize: 12 }}>
              <TeamOutlined /> {students.length} Học viên
            </Tag>
            <Tag color="green" style={{ fontSize: 12 }}>
              <CheckCircleOutlined /> {totalScheduled} Đã xếp
            </Tag>
            {students.length - totalScheduled > 0 && (
              <Tag color="orange" style={{ fontSize: 12 }}>
                <WarningOutlined /> {students.length - totalScheduled} Chờ xếp
              </Tag>
            )}
            <Button
              icon={<SettingOutlined />}
              onClick={() => {
                setTempConfig(config);
                setSettingsOpen(true);
              }}
              style={{
                background: "#1e1e3a",
                borderColor: "#3d3d6b",
                color: "#a5b4fc",
              }}
            >
              Cài đặt ca học
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: 20 }}>
          {/* WEEK NAVIGATION */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Space>
              <Button
                icon={<LeftOutlined />}
                onClick={() => setWeekOffset((w) => w - 1)}
                style={{
                  background: "#1e1e3a",
                  borderColor: "#3d3d6b",
                  color: "#a5b4fc",
                }}
              />
              <Title level={4} style={{ margin: 0, color: "#e2e8f0" }}>
                {weekDates[0].format("DD/MM")} –{" "}
                {weekDates[6].format("DD/MM/YYYY")}
              </Title>
              <Button
                icon={<RightOutlined />}
                onClick={() => setWeekOffset((w) => w + 1)}
                style={{
                  background: "#1e1e3a",
                  borderColor: "#3d3d6b",
                  color: "#a5b4fc",
                }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setWeekOffset(0)}
                style={{
                  background: "#1e1e3a",
                  borderColor: "#3d3d6b",
                  color: "#a5b4fc",
                }}
              >
                Tuần này
              </Button>
            </Space>
            <Space>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>
                <ClockCircleOutlined /> Ca hoạt động: {config.activeSlotsCount}{" "}
                ca | Nhận đến: Ca {config.cutoffSlot}
              </Text>
            </Space>
          </div>

          {/* SCHEDULE GRID */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 4,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      width: 90,
                      padding: "8px 12px",
                      color: "#6b7280",
                      fontSize: 12,
                      textAlign: "left",
                      background: "transparent",
                    }}
                  >
                    Ca / Cabin
                  </th>
                  {weekDates.map((date, i) => {
                    const isToday = date.isSame(dayjs(), "day");
                    const stats = getDayStats(schedule, date);
                    return (
                      <th
                        key={i}
                        style={{
                          padding: "8px 4px",
                          textAlign: "center",
                          minWidth: 130,
                        }}
                      >
                        <div
                          style={{
                            background: isToday
                              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                              : "#1e1e3a",
                            borderRadius: 10,
                            padding: "6px 8px",
                            border: isToday ? "none" : "1px solid #2d2d4e",
                          }}
                        >
                          <div
                            style={{
                              color: isToday ? "#fff" : "#94a3b8",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {DAY_LABELS[i]}
                          </div>
                          <div
                            style={{
                              color: isToday ? "#c4b5fd" : "#6b7280",
                              fontSize: 11,
                            }}
                          >
                            {date.format("DD/MM")}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Badge
                              count={stats.total}
                              style={{
                                backgroundColor: isToday
                                  ? "rgba(255,255,255,0.2)"
                                  : "#2d2d4e",
                                fontSize: 10,
                              }}
                            />
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {activeSlots.map((slot) =>
                  CABINS.map((cabin, ci) => (
                    <tr key={`${slot.id}-${cabin.id}`}>
                      {ci === 0 && (
                        <td
                          rowSpan={CABINS.length}
                          style={{
                            padding: "4px 8px",
                            verticalAlign: "middle",
                          }}
                        >
                          <div
                            style={{
                              background: "#1a1a2e",
                              borderRadius: 8,
                              padding: "8px 10px",
                              border: "1px solid #2d2d4e",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                color: "#a5b4fc",
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              {slot.label}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 10 }}>
                              {slot.start}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 10 }}>
                              –
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 10 }}>
                              {slot.end}
                            </div>
                            {slot.id > config.cutoffSlot && (
                              <Tag
                                color="orange"
                                style={{
                                  marginTop: 4,
                                  fontSize: 9,
                                  padding: "0 4px",
                                }}
                              >
                                Cutoff
                              </Tag>
                            )}
                          </div>
                        </td>
                      )}
                      {weekDates.map((date, di) => {
                        const cellStudents = getCellStudents(
                          date,
                          slot.id,
                          cabin.id,
                        );
                        const count = cellStudents.length;
                        const isFull = count >= 8;
                        const isEmpty = count === 0;
                        const isOverCutoff = slot.id > config.cutoffSlot;

                        return (
                          <td key={di} style={{ padding: 2 }}>
                            <Tooltip
                              title={
                                isEmpty
                                  ? "Trống"
                                  : `${count} học viên – Click để xem`
                              }
                            >
                              <div
                                onClick={() =>
                                  !isEmpty &&
                                  openCellDetail(date, slot.id, cabin.id)
                                }
                                style={{
                                  borderRadius: 8,
                                  padding: "5px 8px",
                                  minHeight: 44,
                                  cursor: isEmpty ? "default" : "pointer",
                                  transition: "all 0.2s",
                                  border: `1px solid`,
                                  borderColor: isEmpty
                                    ? "#1e1e3a"
                                    : isFull
                                      ? "#ef4444"
                                      : cabin.color + "44",
                                  background: isEmpty
                                    ? isOverCutoff
                                      ? "#0d0d1a"
                                      : "#131320"
                                    : `${cabin.color}18`,
                                  opacity: isOverCutoff ? 0.4 : 1,
                                }}
                                className={isEmpty ? "" : "hover-cell"}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: cabin.color,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {cabin.name}
                                  </span>
                                  {!isEmpty && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: isFull ? "#ef4444" : "#94a3b8",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {count}/8
                                    </span>
                                  )}
                                </div>
                                {!isEmpty && (
                                  <div style={{ marginTop: 3 }}>
                                    <div
                                      style={{
                                        height: 4,
                                        background: "#1e1e3a",
                                        borderRadius: 2,
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          height: "100%",
                                          borderRadius: 2,
                                          width: `${(count / 8) * 100}%`,
                                          background: isFull
                                            ? "#ef4444"
                                            : cabin.color,
                                          transition: "width 0.3s",
                                        }}
                                      />
                                    </div>
                                    <div
                                      style={{
                                        marginTop: 3,
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 2,
                                      }}
                                    >
                                      {cellStudents.slice(0, 3).map((s) => (
                                        <span
                                          key={s.id}
                                          style={{
                                            fontSize: 9,
                                            color: "#6b7280",
                                            background: "#1e1e3a",
                                            borderRadius: 4,
                                            padding: "1px 4px",
                                          }}
                                        >
                                          {s.name.split(" ").pop()}
                                        </span>
                                      ))}
                                      {count > 3 && (
                                        <span
                                          style={{
                                            fontSize: 9,
                                            color: cabin.color,
                                          }}
                                        >
                                          +{count - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>

          {/* LEGEND */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {CABINS.map((c) => (
              <Space key={c.id} size={4}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: c.color,
                  }}
                />
                <Text style={{ color: "#6b7280", fontSize: 11 }}>{c.name}</Text>
              </Space>
            ))}
            <Divider type="vertical" style={{ borderColor: "#2d2d4e" }} />
            <Space size={4}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "#ef4444",
                }}
              />
              <Text style={{ color: "#6b7280", fontSize: 11 }}>Đầy (8/8)</Text>
            </Space>
            <Space size={4}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "#1e1e3a",
                  border: "1px solid #2d2d4e",
                }}
              />
              <Text style={{ color: "#6b7280", fontSize: 11 }}>Trống</Text>
            </Space>
          </div>
        </Content>

        {/* DRAWER: Chi tiết học viên trong cell */}
        <Drawer
          title={
            selectedCell && (
              <Space>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: selectedCabin?.color,
                  }}
                />
                <span style={{ color: "#e2e8f0" }}>
                  {selectedCabin?.name} – {selectedSlot?.label} (
                  {selectedSlot?.start}–{selectedSlot?.end})
                </span>
                <Tag color="purple">
                  {selectedCell.date.format("dddd, DD/MM/YYYY")}
                </Tag>
              </Space>
            )
          }
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={480}
          styles={{
            body: { padding: 16, background: "#0f0f1a" },
            header: {
              background: "#1a1a2e",
              borderBottom: "1px solid #2d2d4e",
            },
            wrapper: { background: "#0f0f1a" },
          }}
        >
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card
                size="small"
                style={{
                  background: "#1a1a2e",
                  border: "1px solid #2d2d4e",
                  textAlign: "center",
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: "#6b7280", fontSize: 11 }}>
                      Học viên
                    </span>
                  }
                  value={selectedStudents.length}
                  suffix="/8"
                  valueStyle={{ color: "#a5b4fc", fontSize: 22 }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card
                size="small"
                style={{
                  background: "#1a1a2e",
                  border: "1px solid #2d2d4e",
                  textAlign: "center",
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: "#6b7280", fontSize: 11 }}>
                      Còn trống
                    </span>
                  }
                  value={8 - selectedStudents.length}
                  valueStyle={{ color: "#10b981", fontSize: 22 }}
                />
              </Card>
            </Col>
          </Row>
          <Table
            dataSource={selectedStudents}
            rowKey="id"
            size="small"
            pagination={false}
            style={{ background: "transparent" }}
            columns={[
              {
                title: "Mã HV",
                dataIndex: "id",
                width: 80,
                render: (v) => (
                  <Tag color="purple" style={{ fontSize: 10 }}>
                    {v}
                  </Tag>
                ),
              },
              {
                title: "Họ tên",
                dataIndex: "name",
                render: (v) => (
                  <span style={{ color: "#e2e8f0", fontSize: 12 }}>{v}</span>
                ),
              },
              {
                title: "Khóa học",
                dataIndex: "course",
                render: (v) => (
                  <Text style={{ color: "#6b7280", fontSize: 11 }}>{v}</Text>
                ),
              },
            ]}
          />
        </Drawer>

        {/* MODAL: Cài đặt ca học */}
        <Modal
          title={
            <span style={{ color: "#e2e8f0" }}>
              <SettingOutlined /> Cài đặt ca học trong ngày
            </span>
          }
          open={settingsOpen}
          onOk={saveSettings}
          onCancel={() => setSettingsOpen(false)}
          okText="Lưu cài đặt"
          cancelText="Huỷ"
          styles={{
            content: { background: "#1a1a2e", border: "1px solid #2d2d4e" },
            header: {
              background: "#1a1a2e",
              borderBottom: "1px solid #2d2d4e",
            },
            footer: { background: "#1a1a2e", borderTop: "1px solid #2d2d4e" },
            mask: { backdropFilter: "blur(4px)" },
          }}
        >
          <Alert
            message="Cài đặt sẽ ảnh hưởng đến việc phân bổ học viên tự động"
            type="info"
            showIcon
            style={{
              marginBottom: 20,
              background: "#1e1e3a",
              border: "1px solid #3d3d6b",
            }}
          />

          <Form layout="vertical">
            <Form.Item
              label={
                <span style={{ color: "#94a3b8" }}>
                  Số ca hoạt động trong ngày
                </span>
              }
            >
              <Select
                value={tempConfig.activeSlotsCount}
                onChange={(v) =>
                  setTempConfig((c) => ({
                    ...c,
                    activeSlotsCount: v,
                    cutoffSlot: Math.min(c.cutoffSlot, v),
                  }))
                }
                style={{ width: "100%" }}
                options={ALL_SLOTS.map((s) => ({
                  value: s.id,
                  label: `${s.id} ca (${ALL_SLOTS[0].start} – ${ALL_SLOTS[s.id - 1].end})`,
                }))}
              />
              <div style={{ marginTop: 8 }}>
                {ALL_SLOTS.slice(0, tempConfig.activeSlotsCount).map((s) => (
                  <Tag key={s.id} color="purple" style={{ marginBottom: 4 }}>
                    {s.label}: {s.start}–{s.end}
                  </Tag>
                ))}
              </div>
            </Form.Item>

            <Form.Item
              label={
                <span style={{ color: "#94a3b8" }}>
                  Ca cutoff – Sau ca này đẩy học viên sang ngày mai
                </span>
              }
            >
              <Select
                value={tempConfig.cutoffSlot}
                onChange={(v) =>
                  setTempConfig((c) => ({ ...c, cutoffSlot: v }))
                }
                style={{ width: "100%" }}
                options={ALL_SLOTS.slice(0, tempConfig.activeSlotsCount).map(
                  (s) => ({
                    value: s.id,
                    label: `${s.label} – kết thúc ${s.end}`,
                  }),
                )}
              />
              <Text
                style={{
                  color: "#6b7280",
                  fontSize: 11,
                  display: "block",
                  marginTop: 6,
                }}
              >
                Học viên đăng ký sau {ALL_SLOTS[tempConfig.cutoffSlot - 1]?.end}{" "}
                sẽ được tự động xếp sang ngày hôm sau
              </Text>
            </Form.Item>
          </Form>
        </Modal>
      </Layout>

      <style>{`
        .hover-cell:hover { transform: scale(1.02); box-shadow: 0 4px 20px rgba(99,102,241,0.3); }
        .ant-table { background: transparent !important; }
        .ant-table-thead th { background: #1a1a2e !important; color: #6b7280 !important; border-bottom: 1px solid #2d2d4e !important; }
        .ant-table-tbody tr td { background: #131320 !important; color: #e2e8f0 !important; border-bottom: 1px solid #1e1e3a !important; }
        .ant-table-tbody tr:hover td { background: #1a1a2e !important; }
        .ant-drawer-body { background: #0f0f1a; }
      `}</style>
    </ConfigProvider>
  );
}
