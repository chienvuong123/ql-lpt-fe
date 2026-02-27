import { Card, Row, Col } from "antd";
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
import { ThiPhanChart } from "./ThiPhanChart";

const BLUE_DARK = "#1a3fa8";
const BLUE_LIGHT = "#a8c8f0";

// --- Fake Data ---
const duNoData = [
  { name: "MB", value: 6853, percent: "15.0%" },
  { name: "Ngân hàng khác", value: 4018, percent: "40.0%" },
  { name: "Khác", value: 3693, percent: "35.0%" },
];

// --- Donut Chart ---
const DonutChart = ({ data, total }) => {
  const COLORS = [BLUE_DARK, BLUE_LIGHT, "#d6e8fb"];
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
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => v.toLocaleString()} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
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
      {/* Side labels */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-start pl-1">
        <span style={{ color: BLUE_LIGHT, fontWeight: 700, fontSize: 13 }}>
          {data[1].value.toLocaleString()}
        </span>
        <span style={{ color: BLUE_LIGHT, fontSize: 11 }}>
          {data[1].percent}
        </span>
      </div>
      <div className="absolute right-0 top-1/3 flex flex-col items-end pr-1">
        <span style={{ color: BLUE_DARK, fontWeight: 700, fontSize: 13 }}>
          {data[0].value.toLocaleString()}
        </span>
        <span style={{ color: BLUE_DARK, fontSize: 11 }}>
          {data[0].percent}
        </span>
      </div>
    </div>
  );
};

// --- Custom Dot for scatter ---
const DiamondDot = (props) => {
  const { cx, cy } = props;
  return (
    <polygon
      points={`${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`}
      fill="#6b7fc4"
      stroke="#6b7fc4"
    />
  );
};

// --- Chat Luong No Bar + Scatter ---
const ChatLuongNoChart = () => {
  const data = [
    { name: "Địa bàn", quyMo: 88328, tyLe: 15 },
    { name: "MB", quyMo: 13783, tyLe: 7 },
  ];

  const CustomBar = (props) => {
    const { x, y, width, height } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={BLUE_LIGHT}
        rx={2}
      />
    );
  };

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
          yAxisId="left"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#aaa" }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#aaa" }}
          domain={[0, 25]}
        />
        <Tooltip />
        <Bar yAxisId="left" dataKey="quyMo">
          <LabelList
            dataKey="quyMo"
            position="top"
            style={{ fontSize: 12, fontWeight: 600, fill: "#333" }}
            formatter={(v) => v.toLocaleString()}
          />
        </Bar>
        {/* Diamonds as scatter overlay */}
        {data.map((entry, i) => (
          <g key={i}>
            <DiamondDot
              cx={i === 0 ? 130 : 310}
              cy={entry.tyLe === 15 ? 40 : 70}
            />
          </g>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

// --- Du No Khach Hang ---
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
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
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

// --- Card wrapper ---
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

// --- Legend row ---
const LegendRow = ({ items }) => (
  <div className="flex gap-4 mt-2">
    {items.map((item, i) => (
      <div key={i} className="flex items-center gap-1.5">
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

// --- Main Dashboard ---
export default function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px 32px",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1
          style={{
            fontFamily: "'Georgia', serif",
            fontWeight: 800,
            fontSize: 26,
            color: "#1a1a2e",
            letterSpacing: 1,
            margin: 0,
          }}
        >
          DASHBOARD
        </h1>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} md={10}>
          <ChartCard
            title="Tiến trình hoàn thành"
            date="02/2026"
            unit="tỷ đồng"
          >
            <LegendRow
              items={
                [
                  // { color: BLUE_DARK, label: "MB" },
                  // { color: BLUE_LIGHT, label: "Địa bàn" },
                ]
              }
              extraDiamond="Thị phần MB"
            />
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
          <ChartCard
            title="Học viên học lý thuyết"
            date="27/02/2026"
            unit="người"
          >
            <DuNoChart />
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
}
