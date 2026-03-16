import { useEffect, useState } from "react";
import { Alert, Card, Col, Row, Spin, Tabs } from "antd";
import dayjs from "dayjs";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { loggerApi } from "../../apis/apiLog";
import { ThiPhanChart } from "./ThiPhanChart";

const BLUE_DARK = "#1a3fa8";
const BLUE_LIGHT = "#a8c8f0";

const duNoData = [
  { name: "MB", value: 6853, percent: "15.0%" },
  { name: "Ngân hàng khác", value: 4018, percent: "40.0%" },
  { name: "Khác", value: 3693, percent: "35.0%" },
];

const normalizeLogData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getNestedValue = (record, path) =>
  path.split(".").reduce((current, key) => current?.[key], record);

const pickFirstValue = (record, paths) => {
  for (const path of paths) {
    const value = getNestedValue(record, path);
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return "";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  if (dayjs(value).isValid()) {
    return dayjs(value).format("DD/MM/YYYY HH:mm:ss");
  }
  return String(value);
};

const formatCompactValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
};

const normalizeGiaTriMoi = (value) => {
  const rawValue = formatCompactValue(value);
  const normalizedValue = String(rawValue).trim().toLowerCase();

  if (
    normalizedValue === "duyet" ||
    normalizedValue === "duyệt" ||
    normalizedValue === "1"
  ) {
    return { text: "Duyệt", color: "#22c55e" };
  }

  if (
    normalizedValue === "huy" ||
    normalizedValue === "hủy" ||
    normalizedValue === "0"
  ) {
    return { text: "Hủy", color: "#ef4444" };
  }

  return { text: rawValue, color: "#f59e0b" };
};

const mapLogItem = (record) => ({
  id:
    record?.id ||
    record?.iid ||
    record?._id ||
    `${pickFirstValue(record, ["ma_dk", "maDk", "user.code", "code"])}-${pickFirstValue(
      record,
      ["createdAt", "updatedAt", "timestamp", "thoi_gian_thay_doi", "thoiGian"],
    )}`,
  maDk: formatCompactValue(
    pickFirstValue(record, [
      "ma_dk",
      "maDk",
      "ma_dang_ky",
      "maDangKy",
      "user.admission_code",
      "user.code",
      "admission_code",
      "code",
    ]),
  ),
  nguoiThayDoi: formatCompactValue(
    pickFirstValue(record, [
      "nguoi_thay_doi",
      "nguoiThayDoi",
      "updatedBy",
      "updated_by",
      "createdBy",
      "created_by",
      "username",
      "user.name",
      "user.username",
      "user.code",
    ]),
  ),
  giaTriMoi: pickFirstValue(record, [
    "gia_tri_moi",
    "giaTriMoi",
    "new_value",
    "newValue",
    "value",
    "currentValue",
    "payload.value",
    "payload.newValue",
  ]),
  truongThayDoi: formatCompactValue(
    pickFirstValue(record, [
      "truong_thay_doi",
      "truongThayDoi",
      "field",
      "fieldName",
      "ten_truong",
      "key",
      "column",
      "attribute",
    ]),
  ),
  loai: formatCompactValue(
    pickFirstValue(record, [
      "loai",
      "type",
      "log_type",
      "logType",
      "module",
      "phan_he",
      "phanHe",
      "category",
    ]),
  ),
  thoiGian: formatDateTime(
    pickFirstValue(record, [
      "thoi_gian_thay_doi",
      "thoiGianThayDoi",
      "createdAt",
      "updatedAt",
      "timestamp",
      "thoiGian",
    ]),
  ),
});

const DonutChart = ({ data, total }) => {
  const colors = [BLUE_DARK, BLUE_LIGHT, "#d6e8fb"];

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height: 220 }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value.toLocaleString()} />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#1a1a2e",
          }}
        >
          {total}
        </span>
      </div>

      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-start pl-1">
        <span style={{ color: BLUE_LIGHT, fontWeight: 700, fontSize: 13 }}>
          {data[1]?.value?.toLocaleString?.() ?? data[1]?.value}
        </span>
        <span style={{ color: BLUE_LIGHT, fontSize: 11 }}>{data[1]?.percent}</span>
      </div>

      <div className="absolute right-0 top-1/3 flex flex-col items-end pr-1">
        <span style={{ color: BLUE_DARK, fontWeight: 700, fontSize: 13 }}>
          {data[0]?.value?.toLocaleString?.() ?? data[0]?.value}
        </span>
        <span style={{ color: BLUE_DARK, fontSize: 11 }}>{data[0]?.percent}</span>
      </div>
    </div>
  );
};

const DuNoChart = () => {
  const data = [
    { name: "Chưa đạt", value: 1.5, color: BLUE_LIGHT },
    { name: "Đạt", value: 3.4, color: BLUE_DARK },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 30, right: 20, left: 10, bottom: 5 }}
        barSize={48}
      >
        <CartesianGrid vertical={false} stroke="#e8eef6" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#666" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#aaa" }}
          domain={[0, 5]}
        />
        <Tooltip />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            style={{ fontSize: 13, fontWeight: 700, fill: "#333" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const ChartCard = ({ title, date, unit, children }) => (
  <Card
    className="h-full"
    style={{
      borderRadius: 12,
      border: "1px solid #e8eef6",
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
    }}
    bodyStyle={{ padding: "16px 20px" }}
  >
    <div className="flex justify-between items-start mb-1">
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#1a1a2e",
            fontFamily: "'Georgia', serif",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>{date}</div>
      </div>
      <div style={{ fontSize: 11, color: "#aaa" }}>Đơn vị: {unit}</div>
    </div>
    {children}
  </Card>
);

const LegendRow = ({ items }) => (
  <div className="flex gap-4 mt-2">
    {items.map((item, index) => (
      <div key={index} className="flex items-center gap-1.5">
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: item.color,
          }}
        />
        <span style={{ fontSize: 12, color: "#555" }}>{item.label}</span>
      </div>
    ))}
  </div>
);

const DashboardOverview = () => (
  <Row gutter={[20, 20]}>
    <Col xs={24} md={10}>
      <ChartCard title="Tiến trình hoàn thành" date="02/2026" unit="tỷ đồng">
        <LegendRow items={[]} />
        <ThiPhanChart />
      </ChartCard>
    </Col>

    <Col xs={24} md={7}>
      <ChartCard title="Học viên chạy Cabin" date="27/02/2026" unit="người">
        <DonutChart data={duNoData} total="42" />
        <LegendRow
          items={[
            { color: BLUE_DARK, label: "Thiếu giờ Cabin" },
            { color: BLUE_LIGHT, label: "Đủ giờ Cabin" },
          ]}
        />
      </ChartCard>
    </Col>

    <Col xs={24} md={7}>
      <ChartCard title="Học viên học lý thuyết" date="27/02/2026" unit="người">
        <DuNoChart />
      </ChartCard>
    </Col>
  </Row>
);

const DashboardLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await loggerApi();
        if (!isMounted) return;
        setLogs(normalizeLogData(response));
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Không tải được lịch sử phần mềm.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const logItems = logs.map(mapLogItem);

  return (
    <div className="bg-[#0f172a]">
      {errorMessage ? (
        <Alert
          type="error"
          showIcon
          message="Không thể tải lịch sử log"
          description={errorMessage}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : logItems.length === 0 ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
          Không có dữ liệu lịch sử log
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {logItems.map((item) => {
            const giaTriMoi = normalizeGiaTriMoi(item.giaTriMoi);

            return (
              <div
                key={item.id}
                style={{
                  width: "100%",
                  padding: "3px 2px",
                  borderRadius: 8,
                  background: "#0f172a",
                  color: "#e2e8f0",
                  fontFamily: "Consolas, 'Courier New', monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#94a3b8", fontFamily: "inherit" }}>
                  {item.thoiGian}
                </span>{" "}
                <span
                  style={{
                    color: "#38bdf8",
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  ma_dk={item.maDk}
                </span>{" "}
                <span style={{ color: "#f8fafc", fontFamily: "inherit" }}>
                  được
                </span>{" "}
                <span
                  style={{
                    color: "#22c55e",
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  {item.nguoiThayDoi}
                </span>{" "}
                <span style={{ color: "#f8fafc", fontFamily: "inherit" }}>
                  thay đổi
                </span>{" "}
                <span
                  style={{
                    color: giaTriMoi.color,
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  giá trị mới={giaTriMoi.text}
                </span>{" "}
                <span style={{ color: "#f8fafc", fontFamily: "inherit" }}>
                  trường
                </span>{" "}
                <span
                  style={{
                    color: "#a78bfa",
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  {item.truongThayDoi}
                </span>{" "}
                <span style={{ color: "#f8fafc", fontFamily: "inherit" }}>
                  loại
                </span>{" "}
                <span
                  style={{
                    color: "#60a5fa",
                    fontFamily: "inherit",
                    fontWeight: 700,
                  }}
                >
                  {item.loai}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px 32px",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <Tabs
        defaultActiveKey="dashboard"
        items={[
          {
            key: "dashboard",
            label: "Dashboard",
            children: <DashboardOverview />,
          },
          {
            key: "logs",
            label: "Logs",
            children: <DashboardLogs />,
          },
        ]}
      />
    </div>
  );
}
