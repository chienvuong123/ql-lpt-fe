import {
  Tooltip,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  ComposedChart,
  Line,
} from "recharts";

const BLUE_DARK = "#1a3fa8";
const BLUE_LIGHT = "#a8c8f0";

const thiPhanData = [
  { name: "Tuần 1", diaBan: 178, mb: 201, thiPhanMB: 40 },
  { name: "Tuần 2", diaBan: 197, mb: 197, thiPhanMB: 87 },
  { name: "Tuần 3", diaBan: 200, mb: 300, thiPhanMB: 72 },
  { name: "Tuần 4", diaBan: 123, mb: 128, thiPhanMB: 20 },
];

const CustomXAxisTick = ({ x, y, payload }) => {
  const lines = payload.value.split("\n");
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={14 + i * 13}
          textAnchor="middle"
          fill="#666"
          fontSize={11}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

const DiamondDot = (props) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <polygon
      points={`${cx},${cy - 6} ${cx + 5},${cy} ${cx},${cy + 6} ${cx - 5},${cy}`}
      fill="#7b6fcf"
      stroke="#7b6fcf"
    />
  );
};

const CustomLineLabel = (props) => {
  const { x, y, value } = props;
  return (
    <text
      x={x}
      y={y - 10}
      textAnchor="middle"
      fill="#7b6fcf"
      fontSize={12}
      fontWeight={600}
    >
      {value}%
    </text>
  );
};

export const LegendRow = ({ items, extraDiamond }) => (
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
    {extraDiamond && (
      <div className="flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="6,0 12,6 6,12 0,6" fill="#7b6fcf" />
        </svg>
        <span style={{ fontSize: 12, color: "#555" }}>{extraDiamond}</span>
      </div>
    )}
  </div>
);

export const ThiPhanChart = () => {
  return (
    <>
      <LegendRow
        items={[
          { color: BLUE_DARK, label: "Lý thuyết" },
          { color: BLUE_LIGHT, label: "Cabin" },
        ]}
        extraDiamond="DAT"
      />
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={thiPhanData}
          margin={{ top: 30, right: 20, left: 10, bottom: 30 }}
          barSize={36}
          barGap={2}
        >
          <CartesianGrid vertical={false} stroke="#e8eef6" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={<CustomXAxisTick />}
            interval={0}
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
            tick={false}
            domain={[0, 30]}
          />
          <Tooltip />
          <Bar
            yAxisId="left"
            dataKey="diaBan"
            fill={BLUE_LIGHT}
            radius={[2, 2, 0, 0]}
          >
            <LabelList
              dataKey="diaBan"
              position="top"
              style={{ fontSize: 11, fill: "#555" }}
              formatter={(v) => v.toLocaleString()}
            />
          </Bar>
          <Bar
            yAxisId="left"
            dataKey="mb"
            fill={BLUE_DARK}
            radius={[2, 2, 0, 0]}
          >
            <LabelList
              dataKey="mb"
              position="top"
              style={{ fontSize: 11, fill: "#333", fontWeight: 600 }}
              formatter={(v) => v.toLocaleString()}
            />
          </Bar>
          <Line
            yAxisId="right"
            type="linear"
            dataKey="thiPhanMB"
            stroke="#7b6fcf"
            strokeWidth={1.5}
            dot={<DiamondDot />}
            label={<CustomLineLabel />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
};
