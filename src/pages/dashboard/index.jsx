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
  ComposedChart,
  Line,
} from "recharts";
import { loggerApi } from "../../apis/apiLog";

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

const RealTimeClock = () => {
  const [time, setTime] = useState(dayjs().format("DD/MM/YYYY H:mm:ss"));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs().format("DD/MM/YYYY H:mm:ss"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="!text-[#cc0000] !font-bold !text-[26px] !text-right !font-mono">
      {time}
    </div>
  );
};

const ChartTitle = ({ text }) => (
  <div className="!text-[#2b6cb0] !font-bold !text-[15px] !mb-2 !text-left">
    {text}
  </div>
);

const RedDivider = () => (
  <div className="!border-b-[4px] !border-[#e06666] !my-4 !w-full" />
);

const CoSoPieChart = () => {
  const data = [
    { name: "CS 1", value: 2475, percent: "99,1%" },
    { name: "CS 3", value: 25, percent: "0,9%" },
  ];
  const COLORS = ["#4285f4", "#ff9900"];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Lượng hồ sơ từng cơ sở" />
      <div className="!h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={75}
              dataKey="value"
              label={({ name, percent }) => `${name} ${percent}`}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString()} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SoLieuHangBarChart = () => {
  const data = [
    { name: "B2", value: 1139, color: "#3b82f6" },
    { name: "B1", value: 1277, color: "#d93025" },
    { name: "C1", value: 81, color: "#5fba7d" },
  ];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Số liệu hồ sơ trên từng hạng" />
      <div className="!h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={true} tickLine={false} />
            <YAxis axisLine={true} tickLine={false} domain={[0, 1500]} />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Bar dataKey="value" barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: "bold", fill: "#333" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TyLeHangPieChart = () => {
  const data = [
    { name: "B2", value: 45.6 },
    { name: "B1", value: 51.1 },
    { name: "C1", value: 3.3 },
  ];
  const COLORS = ["#4285f4", "#ea4335", "#34a853"];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Tỷ lệ % từng hạng" />
      <div className="!h-[240px] !relative">
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={75}
              dataKey="value"
              label={({ value }) => `${value}%`}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="!flex !justify-center !gap-4 !text-xs !font-semibold">
          <span className="!flex !items-center !gap-1"><span className="!w-3 !h-3 !rounded-full !bg-[#4285f4]"></span> B2</span>
          <span className="!flex !items-center !gap-1"><span className="!w-3 !h-3 !rounded-full !bg-[#ea4335]"></span> B1</span>
          <span className="!flex !items-center !gap-1"><span className="!w-3 !h-3 !rounded-full !bg-[#34a853]"></span> C1</span>
        </div>
      </div>
    </div>
  );
};

const TyLePhanBoPieChart = () => {
  const data = [
    { name: "LK", value: 2399, percent: "95.1%" },
    { name: "CBNV", value: 61, percent: "2.4%" },
    { name: "Khác", value: 61, percent: "2.5%" },
  ];
  const COLORS = ["#4285f4", "#ea4335", "#fbc02d"];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Tỷ lệ hồ sơ phân bổ" />
      <div className="!h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={75}
              dataKey="value"
              label={({ name, percent }) => `${name} ${percent}`}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString()} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TongHoSoThangChart = () => {
  const data = [
    { name: "Tháng 1", value: 70 },
    { name: "Tháng 2", value: 453 },
    { name: "Tháng 3", value: 415 },
    { name: "Tháng 4", value: 281 },
    { name: "Tháng 5", value: 394 },
    { name: "Tháng 6", value: 385 },
    { name: "Tháng 7", value: 481 },
    { name: "Tháng 8", value: 428 },
    { name: "Tháng 9", value: 423 },
    { name: "Tháng 10", value: 491 },
    { name: "Tháng 11", value: 436 },
    { name: "Tháng 12", value: 572 },
  ];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Tổng số lượng hồ sơ/tháng" />
      <div className="!h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={true} tickLine={false} style={{ fontSize: 10 }} />
            <YAxis axisLine={true} tickLine={false} domain={[0, 600]} style={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#4285f4" barSize={30}>
              <LabelList dataKey="value" position="top" style={{ fontSize: 10, fontWeight: "bold", fill: "#333" }} />
            </Bar>
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TongHoSoThangCoSoChart = () => {
  const data = [
    { name: "Tháng 1", "Cơ sở 1": 69, "Cơ sở 3": 1 },
    { name: "Tháng 2", "Cơ sở 1": 451, "Cơ sở 3": 2 },
    { name: "Tháng 3", "Cơ sở 1": 413, "Cơ sở 3": 2 },
    { name: "Tháng 4", "Cơ sở 1": 279, "Cơ sở 3": 2 },
    { name: "Tháng 5", "Cơ sở 1": 389, "Cơ sở 3": 5 },
    { name: "Tháng 6", "Cơ sở 1": 385, "Cơ sở 3": 0 },
    { name: "Tháng 7", "Cơ sở 1": 471, "Cơ sở 3": 10 },
    { name: "Tháng 8", "Cơ sở 1": 421, "Cơ sở 3": 7 },
    { name: "Tháng 9", "Cơ sở 1": 423, "Cơ sở 3": 0 },
    { name: "Tháng 10", "Cơ sở 1": 491, "Cơ sở 3": 0 },
    { name: "Tháng 11", "Cơ sở 1": 435, "Cơ sở 3": 1 },
    { name: "Tháng 12", "Cơ sở 1": 565, "Cơ sở 3": 7 },
  ];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Tổng hồ sơ/tháng/cơ sở" />
      <div className="!h-[280px] !relative">
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={true} tickLine={false} style={{ fontSize: 10 }} />
            <YAxis axisLine={true} tickLine={false} domain={[0, 600]} style={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="Cơ sở 1" fill="#4285f4" barSize={16}>
              <LabelList dataKey="Cơ sở 1" position="top" style={{ fontSize: 9, fill: "#333" }} />
            </Bar>
            <Bar dataKey="Cơ sở 3" fill="#ea4335" barSize={16}>
              <LabelList dataKey="Cơ sở 3" position="top" style={{ fontSize: 9, fill: "#cc0000" }} />
            </Bar>
            <Line type="monotone" dataKey="Cơ sở 1" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="!flex !justify-center !gap-4 !text-xs !font-semibold !absolute !top-2 !right-4">
          <span className="!flex !items-center !gap-1"><span className="!w-3 !h-3 !rounded-full !bg-[#4285f4]"></span> Cơ sở 1</span>
          <span className="!flex !items-center !gap-1"><span className="!w-3 !h-3 !rounded-full !bg-[#ea4335]"></span> Cơ sở 3</span>
        </div>
      </div>
    </div>
  );
};

const PhieuKhamSKChart = () => {
  const data = [
    { name: "Đã phát", value: 3540, percent: "73,3%" },
    { name: "Chưa phát", value: 1289, percent: "26,7%" },
  ];
  const COLORS = ["#4285f4", "#ea4335"];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Phiếu khám SK" />
      <div className="!h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${percent}`}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList dataKey="value" position="inside" style={{ fontSize: 11, fontWeight: "bold", fill: "#333" }} />
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString()} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const HoSoKeToanChart = () => {
  const data = [
    { name: "Đã hoàn thiện", value: 4586 },
    { name: "Chưa hoàn thiện", value: 242 },
  ];
  const COLORS = ["#4285f4", "#fbc02d"];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Dữ liệu hồ sơ tại phòng kế toán (bộ)" />
      <div className="!h-[280px] !relative">
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              label={({ value }) => value.toLocaleString()}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString()} />
          </PieChart>
        </ResponsiveContainer>
        <div className="!flex !justify-center !gap-4 !text-xs !font-semibold">
          <span className="!flex !items-center !gap-1"><span className="!w-3 !h-3 !rounded-full !bg-[#4285f4]"></span> Đã hoàn thiện</span>
          <span className="!flex !items-center !gap-1"><span className="!w-3 !h-3 !rounded-full !bg-[#fbc02d]"></span> Chưa hoàn thiện</span>
        </div>
      </div>
    </div>
  );
};

const DuiLieuHocPhiChart = () => {
  const data = [
    { name: "Đã hoàn thiện", value: 20661900000, color: "#4285f4", display: "20.661.900.000" },
    { name: "Còn phải thu", value: 1.218000000, color: "#e08c3c", display: "1.218.000.000" },
    { name: "Rút hồ sơ", value: 0, color: "#d93025", display: "0" },
  ];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Dữ liệu học phí (vnd)" />
      <div className="!h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 120, left: 30, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" axisLine={true} tickLine={false} tickFormatter={(val) => val.toLocaleString()} />
            <YAxis dataKey="name" type="category" axisLine={true} tickLine={false} style={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Bar dataKey="value" barSize={25}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="display"
                position="right"
                style={{ fontSize: 11, fontWeight: "bold", fill: "#e08c3c" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DuLieuVaoKhoaEmpty = () => {
  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Dữ liệu vào khoá (học viên)" />
      <div className="!h-[240px] !flex !items-center !justify-center !text-slate-400">
        -
      </div>
    </div>
  );
};

const HocVienVaoKhoaChart = ({ title, barColor }) => {
  const data = [
    { name: "Hạng B2", value: 0 },
    { name: "Hạng B11", value: 0 },
    { name: "Hạng C1", value: 0 },
  ];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text={title} />
      <div className="!h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={true} tickLine={false} />
            <YAxis axisLine={true} tickLine={false} domain={[-1, 1]} />
            <Tooltip />
            <Bar dataKey="value" fill={barColor} barSize={40}>
              <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: "bold", fill: "#333" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const NguoiTuyenSinhChart = () => {
  const data = [
    { name: "Nguyễn Duy Công", value: 18 },
    { name: "Nguyễn Văn Tình", value: 50 },
    { name: "Nguyễn Hữu Sơn", value: 89 },
    { name: "Nguyễn Ngọc Trung", value: 13 },
    { name: "Nguyễn Văn Tuấn 86", value: 11 },
    { name: "Vũ Duy Hinh", value: 11 },
    { name: "Nguyễn Như Đức", value: 18 },
    { name: "Vũ Minh Huy", value: 22 },
    { name: "Nguyễn Phúc Khải Hoàn", value: 40 },
    { name: "Vũ Đình Thắng", value: 25 },
    { name: "Vũ Thanh Bình", value: 26 },
    { name: "Nguyễn Hữu Hướng", value: 7 },
    { name: "Nguyễn Hữu Phú", value: 38 },
    { name: "Nguyễn Thanh Hưng", value: 19 },
    { name: "Trần Việt Cường", value: 38 },
    { name: "Nguyễn Mạnh Khôi", value: 22 },
    { name: "Nguyễn Hữu Đăng", value: 16 },
    { name: "Đỗ Tùng Sơn", value: 19 },
    { name: "Trương Thăng Long", value: 69 },
    { name: "Phạm Văn Hội", value: 11 },
    { name: "Nguyễn Văn Thảo", value: 17 },
    { name: "Nguyễn Thúc Nghiệp", value: 9 },
    { name: "Nguyễn Văn Bình", value: 7 },
    { name: "Vũ Văn Dần", value: 80 },
    { name: "Nguyễn Văn Mười", value: 10 },
    { name: "Nguyễn Văn Quân", value: 45 },
    { name: "Hà Thành Được", value: 13 },
    { name: "Nguyễn Văn Thư", value: 3 },
    { name: "Nguyễn Trung Tình", value: 33 },
    { name: "Hồng Trường Giang", value: 13 },
    { name: "Hà Thành Đạt", value: 7 },
  ];

  return (
    <div className="!flex !flex-col !h-full">
      <ChartTitle text="Người tuyển sinh" />
      <div className="!h-[720px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
          >
            <CartesianGrid horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" axisLine={true} tickLine={false} />
            <YAxis dataKey="name" type="category" axisLine={true} tickLine={false} style={{ fontSize: 10 }} interval={0} />
            <Tooltip />
            <Bar dataKey="value" fill="#4285f4" barSize={12}>
              <LabelList dataKey="value" position="right" style={{ fontSize: 9, fontWeight: "bold", fill: "#333" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DashboardOverview = () => (
  <div style={{ backgroundColor: "#ffe8d6", margin: "-28px -32px", padding: "28px 32px" }}>
    {/* Page Title Header Block */}
    <div className="!text-center !py-3 !border !border-slate-400 !bg-[#ffe8d6] !rounded-md !mb-6">
      <h1 className="!text-4xl !font-bold !italic !text-[#1a1a2e] !m-0" style={{ fontFamily: "'Georgia', serif" }}>
        Dữ liệu tuyển sinh ô-tô năm 2026
      </h1>
    </div>

    {/* Top Metrics Row */}
    <Row gutter={[16, 16]} align="middle" className="!mb-6">
      <Col xs={24} md={6}>
        <div className="!border !border-slate-400 !p-4 !bg-[#ffe8d6] !rounded !h-full !flex !flex-col !justify-between">
          <div className="!text-center">
            <div className="!text-[12px] !text-[#cc0000] !font-bold !uppercase">Tổng số user học Online</div>
            <div className="!text-5xl !font-bold !text-[#4285f4] !my-2">6810</div>
          </div>
          <div className="!text-xs !space-y-1.5 !text-[#cc0000] !font-semibold">
            <div>BC tuyển sinh: <span className="!text-slate-600 !underline !cursor-pointer">Xem ngay</span></div>
            <div>BC kế toán: <span className="!text-slate-600 !underline !cursor-pointer">Xem ngay</span></div>
            <div>BC lưu lượng: <span className="!text-slate-600 !underline !cursor-pointer">Xem ngay</span></div>
            <div>BC vào khoá: <span className="!text-slate-600 !underline !cursor-pointer">Xem ngay</span></div>
          </div>
        </div>
      </Col>

      <Col xs={24} md={12}>
        <div className="!text-center !flex !flex-col !items-center !justify-center">
          <div className="!text-[15px] !text-[#cc0000] !font-bold !uppercase !tracking-wide">TỔNG SỐ LƯỢNG HỒ SƠ</div>
          <div className="!text-7xl !font-extrabold !text-[#4285f4] !my-1">4829</div>

          <div className="!flex !border !border-slate-400 !bg-[#ffe8d6] !rounded !w-96 !mx-auto !overflow-hidden">
            <div className="!flex-1 !border-r !border-slate-400 !py-2">
              <div className="!text-[12px] !font-bold !text-slate-700">Lưu lượng hiện tại</div>
              <div className="!text-3xl !font-bold !text-[#4285f4]">0</div>
            </div>
            <div className="!flex-1 !py-2">
              <div className="!text-[12px] !font-bold !text-slate-700">Số khoá đang học</div>
              <div className="!text-3xl !font-bold !text-[#4285f4]">0</div>
            </div>
          </div>
        </div>
      </Col>

      <Col xs={24} md={6}>
        <RealTimeClock />
      </Col>
    </Row>

    <RedDivider />

    {/* Row 1 of Charts */}
    <Row gutter={[24, 24]}>
      <Col xs={24} sm={12} lg={6}>
        <CoSoPieChart />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SoLieuHangBarChart />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <TyLeHangPieChart />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <TyLePhanBoPieChart />
      </Col>
    </Row>

    <RedDivider />

    {/* Row 2 of Charts */}
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={10}>
        <TongHoSoThangChart />
      </Col>
      <Col xs={24} lg={10}>
        <TongHoSoThangCoSoChart />
      </Col>
      <Col xs={24} lg={4}>
        <PhieuKhamSKChart />
      </Col>
    </Row>

    <RedDivider />

    {/* Row 3 of Charts */}
    <Row gutter={[24, 24]}>
      <Col xs={24} md={10}>
        <HoSoKeToanChart />
      </Col>
      <Col xs={24} md={14}>
        <DuiLieuHocPhiChart />
      </Col>
    </Row>

    <RedDivider />

    {/* Row 4 of Charts */}
    <Row gutter={[24, 24]}>
      <Col xs={24} md={8}>
        <DuLieuVaoKhoaEmpty />
      </Col>
      <Col xs={24} md={8}>
        <HocVienVaoKhoaChart title="Số lượng học viên đã vào khoá (Học viên/hạng)" barColor="#4285f4" />
      </Col>
      <Col xs={24} md={8}>
        <HocVienVaoKhoaChart title="Số lượng học viên chưa vào khoá (Học viên/hạng)" barColor="#fbc02d" />
      </Col>
    </Row>

    <RedDivider />

    {/* Row 5 of Charts */}
    <Row gutter={[24, 24]}>
      <Col xs={24}>
        <NguoiTuyenSinhChart />
      </Col>
    </Row>
  </div>
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
    <div className="bg-[#0f172a]  h-[80vh] overflow-y-auto">
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
        <div className="p-6 text-center">
          <Spin />
        </div>
      ) : logItems.length === 0 ? (
        <div className="p-6 text-center text-slate-500">
          Không có dữ liệu lịch sử log
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {logItems.map((item) => {
            const giaTriMoi = normalizeGiaTriMoi(item.giaTriMoi);

            return (
              <div
                key={item.id}
                className="w-full overflow-x-auto whitespace-nowrap rounded-lg bg-[#0f172a] px-[2px] py-[3px] font-mono text-[13px] leading-[1.6] text-slate-200"
              >
                <span className="font-inherit text-slate-400">
                  {item.thoiGian}
                </span>{" "}
                <span className="font-inherit font-bold text-sky-400">
                  ma_dk={item.maDk}
                </span>{" "}
                <span className="font-inherit text-slate-50">được</span>{" "}
                <span className="font-inherit font-bold text-green-500">
                  {item.nguoiThayDoi}
                </span>{" "}
                <span className="font-inherit text-slate-50">thay đổi</span>{" "}
                <span
                  className="font-inherit font-bold"
                  style={{ color: giaTriMoi.color }}
                >
                  giá trị mới={giaTriMoi.text}
                </span>{" "}
                <span className="font-inherit text-slate-50">trường</span>{" "}
                <span className="font-inherit font-bold text-violet-400">
                  {item.truongThayDoi}
                </span>{" "}
                <span className="font-inherit text-slate-50">loại</span>{" "}
                <span className="font-inherit font-bold text-blue-400">
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
