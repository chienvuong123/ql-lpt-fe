import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, DatePicker, Dropdown, Empty, Input, Modal, Popover, Select, Spin, Table, Tooltip, message, notification } from "antd";
import {
  EyeOutlined, CheckOutlined, PrinterOutlined, MoreOutlined, ClockCircleOutlined, SearchOutlined,
  DownloadOutlined, RollbackOutlined, SyncOutlined, DeleteOutlined, EditOutlined, BellOutlined,
  FullscreenOutlined, FullscreenExitOutlined, ArrowRightOutlined, UserOutlined, FileSearchOutlined,
  CheckCircleFilled, ClockCircleFilled, ExclamationCircleFilled, PrinterFilled,
} from "@ant-design/icons";
import {
  FaUsers, FaRegClock, FaExclamationCircle, FaCheckCircle, FaPrint, FaRegCalendarAlt, FaPhoneAlt,
  FaRegIdCard, FaIdCard, FaUserPlus, FaEnvelope, FaGraduationCap, FaChartBar, FaShieldAlt, FaBolt, FaInfoCircle, FaFolderPlus,
  FaRegCheckCircle,
} from "react-icons/fa";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  getThongKeTiepSinh, getDanhSachHoSo, getChiTietHoSo, getCauHinhTiepSinh, ghiNhanInHoSo, traBoSungHoSo, moLaiHoSo, xoaHoSo, errMsg,
} from "../../apis/apiTiepSinh";
import {
  NGUON_META, TRANG_THAI_META, HANG_OPTIONS, WEEKDAYS, HoSoDetailModal, TraBoSungModal,
  fmtDate, fmtDateTime, fmtWait, useNow, tinhPhaiThu, fmtTien,
} from "./tiepSinhShared";
import { printForms, mauTheoHang } from "./mauDon";
import { TiepNhanView } from "./TiepNhanHoSo";
import OcrCccdModal from "./OcrCccdModal";

const NAVY = "#0f2d6b";
const TABLE_HEAD = "#16357a";
const SHORT_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Nhãn trạng thái trong bảng (nền nhạt + icon như ảnh mẫu)
const PILL = {
  cho_duyet: { label: "Chờ kiểm duyệt", color: "#2563eb", bg: "#e6efff", icon: <ClockCircleFilled /> },
  can_bo_sung: { label: "Cần bổ sung", color: "#e07b00", bg: "#fff1de", icon: <ExclamationCircleFilled /> },
  da_duyet: { label: "Đã duyệt", color: "#15803d", bg: "#e3f7ea", icon: <CheckCircleFilled /> },
  da_in: { label: "Đã in", color: "#7c3aed", bg: "#efe8ff", icon: <PrinterFilled /> },
};
function Pill({ value }) {
  const m = PILL[value] || { label: value, color: "#64748b", bg: "#f1f5f9" };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-medium" style={{ color: m.color, background: m.bg }}>
      {m.icon}
      {m.label}
    </span>
  );
}

// ─── Khung nội dung (nền trắng mờ, không viền tiêu đề) ─────────────────────
function Card({ title, icon, iconColor = "#1d5fd6", extra, children, className = "", bodyClassName = "px-4 pb-3" }) {
  return (
    <div className={`flex flex-col rounded-2xl bg-white/85 shadow-[0_6px_24px_rgba(23,64,140,0.08)] backdrop-blur ${className}`}>
      {title && (
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-1.5 pt-3">
          <div className="flex items-center gap-2.5 text-[16px] font-bold" style={{ color: NAVY }}>
            <span className="text-lg" style={{ color: iconColor }}>{icon}</span>
            {title}
          </div>
          {extra}
        </div>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

// Đo chiều cao 1 phần tử (để bảng cuộn bên trong, cả trang vừa 1 màn hình)
function useHeight() {
  const [el, setEl] = useState(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setH(Math.floor(e.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, h];
}

// ─── Ảnh nền khuôn viên (minh hoạ SVG) ─────────────────────────────
function CampusBackdrop() {
  const trees = [40, 120, 210, 330, 470, 560, 690, 800, 905, 1010];
  return (
    <svg
      className="pointer-events-none absolute right-0 top-0 h-[230px] w-[72%] max-w-[1100px]"
      viewBox="0 0 1100 230"
      preserveAspectRatio="xMaxYMin slice"
      style={{
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 35%), linear-gradient(180deg, #000 55%, transparent 100%)",
        WebkitMaskComposite: "source-in",
        maskImage: "linear-gradient(90deg, transparent 0%, #000 35%), linear-gradient(180deg, #000 55%, transparent 100%)",
        maskComposite: "intersect",
        opacity: 0.55,
      }}
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#bcd6f7" />
          <stop offset="1" stopColor="#e8f1fc" />
        </linearGradient>
      </defs>
      <rect width="1100" height="230" fill="url(#sky)" />
      <g fill="#f4f8fd" stroke="#9fbbe0" strokeWidth="1.2">
        <rect x="150" y="70" width="330" height="110" rx="4" />
        <rect x="560" y="55" width="300" height="125" rx="4" />
        <rect x="880" y="85" width="190" height="95" rx="4" />
        <path d="M140 72 L315 40 L490 72 Z" fill="#dbe7f7" />
        <path d="M550 57 L710 28 L870 57 Z" fill="#dbe7f7" />
      </g>
      <g fill="#a8c4e8">
        {Array.from({ length: 9 }).map((_, c) =>
          [88, 118, 148].map((y) => <rect key={`a${c}-${y}`} x={170 + c * 34} y={y} width="20" height="16" rx="2" />),
        )}
        {Array.from({ length: 8 }).map((_, c) =>
          [75, 105, 135].map((y) => <rect key={`b${c}-${y}`} x={580 + c * 34} y={y} width="20" height="18" rx="2" />),
        )}
        {Array.from({ length: 5 }).map((_, c) =>
          [100, 135].map((y) => <rect key={`c${c}-${y}`} x={898 + c * 34} y={y} width="20" height="16" rx="2" />),
        )}
      </g>
      {trees.map((x, i) => (
        <g key={x}>
          <rect x={x + 18} y={160} width="5" height="30" fill="#7c9a7a" />
          <circle cx={x + 20} cy={150 - (i % 3) * 6} r={24 + (i % 2) * 6} fill={i % 2 ? "#8fbf8d" : "#7fb27f"} opacity="0.9" />
        </g>
      ))}
      <rect y="186" width="1100" height="44" fill="#e3edf9" />
    </svg>
  );
}

// ─── Thẻ thống kê ─────────────────────────────────────
function StatCard({ icon, value, label, delta, color, from, to, spark, active, onClick }) {
  const gid = `sp-${color.slice(1)}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col overflow-hidden rounded-2xl text-left transition hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
        boxShadow: active ? `0 0 0 2px ${color}, 0 8px 22px ${color}33` : "0 6px 20px rgba(23,64,140,0.10)",
      }}
    >
      <div className="flex items-start gap-3 px-4 pt-3">
        <span className="shrink-0 text-[38px] leading-none" style={{ color }}>{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[26px] font-extrabold leading-none" style={{ color: NAVY }}>{value}</div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[13px]">
            <span className="truncate font-medium text-slate-700">{label}</span>
            {delta !== null && delta !== undefined && (
              <span className={`shrink-0 font-semibold ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                {delta >= 0 ? "↗ +" : "↘ "}{delta}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-0.5 h-7 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </button>
  );
}

// ─── Chuông: chỉ báo hồ sơ MỚI gửi đến kể từ lần xem trước ─────────────
const BELL_KEY = "tiepSinhBellSeenAt";
const readSeen = () => {
  try {
    return localStorage.getItem(BELL_KEY);
  } catch {
    return null;
  }
};
const writeSeen = (v) => {
  try {
    localStorage.setItem(BELL_KEY, v);
  } catch {
    /* trình duyệt chặn lưu trữ */
  }
};
const nowStr = () => dayjs().format("YYYY-MM-DD HH:mm:ss");

function BellThongBao({ onOpenHoSo }) {
  // Lần đầu mở trang: coi như đã xem hết hồ sơ cũ
  const [seenAt, setSeenAt] = useState(() => {
    const v = readSeen();
    if (v) return v;
    const n = nowStr();
    writeSeen(n);
    return n;
  });
  const [open, setOpen] = useState(false);
  const [shownList, setShownList] = useState([]);
  const notified = useRef(new Set());

  const { data } = useQuery({
    queryKey: ["tiep-sinh-thong-bao"],
    queryFn: () => getDanhSachHoSo({ trang_thai: "cho_duyet", limit: 100 }),
    refetchInterval: 10000,
    staleTime: 0,
  });
  const moi = useMemo(
    () =>
      (data?.data || [])
        .filter((r) => r.created_at && r.created_at > seenAt)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [data, seenAt],
  );

  // Hiện thông báo góc màn hình khi có hồ sơ mới gửi đến
  useEffect(() => {
    const fresh = moi.filter((r) => !notified.current.has(r.id));
    moi.forEach((r) => notified.current.add(r.id));
    if (!fresh.length || open) return;
    notification.info({
      key: "tiep-sinh-moi",
      title: fresh.length === 1 ? "Có hồ sơ mới" : `Có ${fresh.length} hồ sơ mới`,
      description: fresh.slice(0, 3).map((r) => r.ho_ten).join(", ") + (fresh.length > 3 ? "..." : ""),
      placement: "topRight",
      icon: <BellOutlined style={{ color: "#1d5fd6" }} />,
    });
  }, [moi, open]);

  const onOpenChange = (v) => {
    setOpen(v);
    if (v) {
      // giữ danh sách để xem, đánh dấu đã xem
      setShownList(moi);
      const n = nowStr();
      writeSeen(n);
      setSeenAt(n);
    }
  };

  const list = open ? shownList : moi;
  const content = (
    <div className="w-[340px]">
      {list.length ? (
        <div className="max-h-[360px] overflow-auto">
          {list.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenHoSo(r.id);
              }}
              className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-blue-50"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <UserOutlined />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-800">{r.ho_ten}</span>
                <span className="block text-xs text-slate-500">
                  {NGUON_META[r.nguon]?.label || r.nguon} · Hạng {r.hang || "-"} · khai {fmtDateTime(r.thoi_gian_khai)}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">Chờ duyệt</span>
            </button>
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có hồ sơ mới" className="!my-4" />
      )}
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="font-semibold">Hồ sơ mới gửi đến</span>}
      content={content}
    >
      <button type="button" className="relative text-xl" style={{ color: NAVY }} aria-label="Hồ sơ mới">
        <BellOutlined />
        {moi.length > 0 && !open && (
          <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {moi.length > 99 ? "99+" : moi.length}
          </span>
        )}
      </button>
    </Popover>
  );
}

function LastBadge({ x, y, value, index, last, color, dy, dx = 0 }) {
  if (index !== last || x == null || y == null) return null;
  const w = Math.max(30, String(value).length * 9 + 14);
  const cx = x + (dx < 0 ? dx - w / 2 : dx);
  return (
    <g>
      <rect x={cx - w / 2} y={y + dy} width={w} height={22} rx={7} fill={color} />
      <text x={cx} y={y + dy + 15} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>{value}</text>
    </g>
  );
}

function InfoLine({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 text-[14px] leading-[22px]">
      <span className="mt-[3px] w-5 shrink-0 text-[15px]" style={{ color: NAVY }}>{icon}</span>
      <span className="text-slate-700">{label}: <span className="font-medium text-slate-800">{value || "-"}</span></span>
    </div>
  );
}

// ─── Trang chính ─────────────────────────────────────
export default function TongQuanTiepSinh() {
  const now = useNow();
  const qc = useQueryClient();
  const [soNgay, setSoNgay] = useState(7);
  const [filters, setFilters] = useState({ tu_ngay: dayjs(), den_ngay: dayjs(), trang_thai: undefined, hang: undefined, search: "" });
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState({ page: 1, limit: 10 });
  const [checked, setChecked] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [traId, setTraId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [popupId, setPopupId] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPrefill, setPopupPrefill] = useState(null); // dữ liệu đọc từ ảnh CCCD
  const [ocrOpen, setOcrOpen] = useState(false);
  const openPopup = (id, prefill = null) => {
    setPopupId(id ? String(id) : null);
    setPopupPrefill(id ? null : prefill);
    setPopupOpen(true);
  };
  const closePopup = () => {
    setPopupOpen(false);
    setPopupId(null);
    refresh();
  };
  const [full, setFull] = useState(!!document.fullscreenElement);
  const [tableBoxRef, tableBoxH] = useHeight();

  useEffect(() => {
    const h = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const { data: tkRes, isLoading: tkLoading } = useQuery({
    queryKey: ["tiep-sinh-thong-ke", soNgay],
    queryFn: () => getThongKeTiepSinh({ so_ngay: soNgay }),
    refetchInterval: 10000,
    staleTime: 0,
  });
  const tk = tkRes?.data;

  const listParams = useMemo(
    () => ({
      tu_ngay: filters.tu_ngay?.format("YYYY-MM-DD"),
      den_ngay: filters.den_ngay?.format("YYYY-MM-DD"),
      trang_thai: filters.trang_thai,
      hang: filters.hang,
      search: filters.search || undefined,
      ...page,
    }),
    [filters, page],
  );
  // Tự làm mới chạy ngầm (không hiện vòng quay); chỉ báo đang tải lần đầu / khi đổi bộ lọc
  const { data: listRes, isLoading: listFirstLoad, isFetching: listFetching, isPlaceholderData: listPlaceholder } = useQuery({
    queryKey: ["tiep-sinh-list", listParams],
    queryFn: () => getDanhSachHoSo(listParams),
    refetchInterval: 10000,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
  const listLoading = listFirstLoad || (listFetching && listPlaceholder);
  const rows = useMemo(() => listRes?.data || [], [listRes]);

  useEffect(() => {
    if (rows.length && !rows.some((r) => r.id === selectedId)) setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  const { data: selRes } = useQuery({
    queryKey: ["tiep-sinh-ho-so", selectedId],
    queryFn: () => getChiTietHoSo(selectedId),
    enabled: !!selectedId,
    staleTime: 15000,
  });
  const sel = selRes?.data;
  const { data: cauHinhRes } = useQuery({ queryKey: ["tiep-sinh-cau-hinh"], queryFn: getCauHinhTiepSinh, staleTime: 60000 });
  const cauHinh = cauHinhRes?.data || {};

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["tiep-sinh-thong-ke"] });
    qc.invalidateQueries({ queryKey: ["tiep-sinh-list"] });
    qc.invalidateQueries({ queryKey: ["tiep-sinh-ho-so"] });
  };

  const act = async (fn, ok) => {
    setBusy(true);
    try {
      const res = await fn();
      if (ok) message.success(ok);
      refresh();
      return res?.data;
    } catch (e) {
      message.error(errMsg(e));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const inHoSo = async (id) => {
    const row = await act(() => ghiNhanInHoSo(id));
    if (row) await printForms(row, mauTheoHang(row.hang)).catch((e) => message.error(errMsg(e, "Không tạo được bản in")));
  };

  const xoa = (r) =>
    Modal.confirm({
      title: `Xoá hồ sơ ${r.ma_ho_so}?`,
      content: `${r.ho_ten} — thao tác không thể hoàn tác.`,
      okText: "Xoá",
      okButtonProps: { danger: true },
      onOk: () => act(() => xoaHoSo(r.id), "Đã xoá hồ sơ"),
    });

  const setStatusFilter = (tt, todayOnly) => {
    setFilters((f) => ({
      ...f,
      trang_thai: f.trang_thai === tt && !todayOnly ? undefined : tt,
      tu_ngay: todayOnly ? dayjs() : tt ? null : f.tu_ngay,
      den_ngay: todayOnly ? dayjs() : tt ? null : f.den_ngay,
    }));
    setPage((p) => ({ ...p, page: 1 }));
  };

  const resetPage = () => setPage((p) => ({ ...p, page: 1 }));
  const doSearch = () => {
    setFilters((f) => ({ ...f, search: searchText.trim() }));
    resetPage();
  };

  // Xuất các dòng đã tick, nếu không tick thì xuất toàn bộ theo bộ lọc
  const exportExcel = async () => {
    try {
      let list;
      if (checked.length) list = rows.filter((r) => checked.includes(r.id));
      else list = (await getDanhSachHoSo({ ...listParams, page: 1, limit: 500 }))?.data || [];
      const data = list.map((r, i) => ({
        STT: i + 1,
        "Mã hồ sơ": r.ma_ho_so,
        "Họ tên": r.ho_ten,
        "Ngày sinh": fmtDate(r.ngay_sinh),
        "Giới tính": r.gioi_tinh,
        CCCD: r.cccd,
        "Ngày cấp": fmtDate(r.ngay_cap_cccd),
        SĐT: r.dien_thoai,
        "Địa chỉ": r.dia_chi,
        Hạng: r.hang,
        "Đầu mối": r.dau_moi,
        Nguồn: NGUON_META[r.nguon]?.label || r.nguon,
        "Thời gian khai": fmtDateTime(r.thoi_gian_khai),
        "Trạng thái": TRANG_THAI_META[r.trang_thai]?.label || r.trang_thai,
        "Còn thiếu": (r.thieu_truong || []).join(", "),
        "Người duyệt": r.nguoi_duyet,
        "Thời gian duyệt": fmtDateTime(r.duyet_at),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = Object.keys(data[0] || { a: 1 }).map((k) => ({ wch: Math.max(10, k.length + 2) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ho so");
      XLSX.writeFile(wb, `ho-so-tiep-sinh-${dayjs().format("YYYYMMDD-HHmm")}.xlsx`);
    } catch (e) {
      message.error(errMsg(e, "Xuất Excel thất bại"));
    }
  };

  const the = tk?.the || {};
  const chart = (tk?.bieu_do || []).map((d) => ({
    ...d,
    label: soNgay <= 7 ? SHORT_DAYS[dayjs(d.ngay).day()] : dayjs(d.ngay).format("DD/MM"),
  }));
  const spark = (key) => chart.map((d) => ({ v: d[key] }));
  const tyLe = tk?.ty_le || {};
  const tong = Object.values(tyLe).reduce((a, b) => a + b, 0);
  const daXuLy = (tyLe.da_duyet || 0) + (tyLe.da_in || 0);
  const pct = (n) => (tong ? `${((n / tong) * 100).toFixed(1)}%` : "0%");
  const legend = [
    { key: "da_duyet", name: "Đã duyệt", value: tyLe.da_duyet || 0, color: "#22b45a" },
    { key: "da_in", name: "Đã in", value: tyLe.da_in || 0, color: "#2f6fe4" },
    { key: "can_bo_sung", name: "Cần bổ sung", value: tyLe.can_bo_sung || 0, color: "#f59e0b" },
    { key: "cho_duyet", name: "Khác", value: tyLe.cho_duyet || 0, color: "#d5dbe4" },
  ];

  const columns = [
    { title: "#", width: 40, align: "center", render: (_, __, i) => (page.page - 1) * page.limit + i + 1 },
    { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 118 },
    { title: "Họ và tên", dataIndex: "ho_ten", width: 150, ellipsis: true },
    { title: "CCCD", dataIndex: "cccd", width: 112, render: (v) => <span className="whitespace-nowrap">{v}</span> },
    { title: "Hạng", dataIndex: "hang", width: 50 },
    { title: "Thời gian khai", dataIndex: "thoi_gian_khai", width: 125, render: (v) => <span className="whitespace-nowrap">{fmtDateTime(v)}</span> },
    { title: "Trạng thái", dataIndex: "trang_thai", width: 138, render: (v) => <Pill value={v} /> },
    { title: "Phụ trách", width: 112,  ellipsis: true, render: (_, r) => r.nguoi_duyet || r.nguoi_tiep_nhan || "-" },
    {
      title: (
        <div className="flex justify-end">
          <Tooltip title={checked.length ? `Xuất Excel ${checked.length} hồ sơ đã chọn` : "Xuất Excel"}>
            <button type="button" onClick={exportExcel} className="flex items-center gap-1 whitespace-nowrap font-medium text-white hover:underline">
              <DownloadOutlined /> Excel
            </button>
          </Tooltip>
        </div>
      ),
      width: 112,
      render: (_, r) => {
        const go = () => openPopup(r.id);
        const main = {
          cho_duyet: { label: "Duyệt", icon: <CheckOutlined />, cls: "border-green-500 bg-green-500 text-white", onClick: go },
          can_bo_sung: { label: "Đã bổ sung", icon: <SyncOutlined />, cls: "border-orange-300 bg-white text-orange-500", onClick: () => act(() => moLaiHoSo(r.id), "Đã chuyển về chờ duyệt") },
          da_duyet: { label: "In", icon: <PrinterOutlined />, cls: "border-green-500 bg-green-500 text-white", onClick: () => inHoSo(r.id) },
          da_in: { label: "In lại", icon: <PrinterOutlined />, cls: "border-blue-300 bg-white text-blue-600", onClick: () => inHoSo(r.id) },
        }[r.trang_thai];
        const iconBtn = "inline-flex h-7 w-7 items-center justify-center rounded-md border text-[13px] transition hover:brightness-95 disabled:opacity-50";
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Xem">
              <button type="button" aria-label="Xem" onClick={go} className={`${iconBtn} border-blue-200 bg-white text-blue-600 hover:bg-blue-50`}>
                <EyeOutlined />
              </button>
            </Tooltip>
            {main && (
              <Tooltip title={main.label}>
                <button type="button" aria-label={main.label} disabled={busy} onClick={main.onClick} className={`${iconBtn} ${main.cls}`}>
                  {main.icon}
                </button>
              </Tooltip>
            )}
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "ct", icon: <FileSearchOutlined />, label: "Chi tiết & lịch sử", onClick: () => setDetailId(r.id) },
                  { key: "sua", icon: <EditOutlined />, label: "Chỉnh sửa", onClick: go },
                  ...(!["da_in", "can_bo_sung"].includes(r.trang_thai) ? [{ key: "tra", icon: <RollbackOutlined />, label: "Yêu cầu bổ sung", onClick: () => setTraId(r.id) }] : []),
                  ...(r.trang_thai !== "da_in" ? [{ type: "divider" }, { key: "xoa", danger: true, icon: <DeleteOutlined />, label: "Xoá hồ sơ", onClick: () => xoa(r) }] : []),
                ],
              }}
            >
              <button type="button" aria-label="Thêm" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                <MoreOutlined />
              </button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  const traRow = rows.find((r) => r.id === traId) || (sel?.id === traId ? sel : null);

  return (
    <div className="relative -m-4 flex h-[calc(100vh-64px)] min-h-[620px] flex-col overflow-hidden px-4 pb-3 pt-2 sm:px-5"
      style={{ background: "linear-gradient(180deg, #d7e6fa 0%, #e8f0fc 260px, #eef4fd 60%, #f3f7fd 100%)" }}>
      <CampusBackdrop />

      <div className="relative flex min-h-0 flex-1 flex-col gap-3">
        {/* Tiêu đề */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-1">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="text-[44px] leading-none" style={{ color: "#2f6fe4" }}><FaUsers /></span>
            <div className="min-w-0">
              <div className="text-[22px] font-extrabold leading-tight" style={{ color: NAVY }}>Hệ thống tiếp nhận hồ sơ học viên</div>
              <div className="text-[14px] text-slate-700">Nhanh chóng <span className="mx-1.5">•</span> Chính xác <span className="mx-1.5">•</span> Hiệu quả</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOcrOpen(true)}
              className="flex h-10 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgba(234,88,12,0.30)] transition hover:brightness-110"
              style={{ background: "linear-gradient(180deg, #fb923c 0%, #ea580c 100%)", color: "#fff" }}>
              <FaIdCard className="text-lg" /> Nhập từ ảnh CCCD
            </button>
            <button type="button" onClick={() => openPopup(null)}
              className="flex h-10 items-center gap-2 rounded-xl border-2 bg-white px-4 text-[14px] font-semibold transition hover:bg-blue-50"
              style={{ borderColor: "#2f6fe4", color: "#1d4ed8" }}>
              <FaUserPlus className="text-lg" /> Tiếp nhận mới
            </button>
          </div>
          <div className="flex items-center gap-5 rounded-xl bg-white/50 px-4 py-2 text-[14px] text-slate-800 backdrop-blur">
            <span className="flex items-center gap-2"><FaRegCalendarAlt className="text-lg" style={{ color: NAVY }} />{WEEKDAYS[now.day()]}, {now.format("DD/MM/YYYY")}</span>
            <span className="flex items-center gap-2 font-semibold tabular-nums"><FaRegClock className="text-lg" style={{ color: NAVY }} />{now.format("HH:mm:ss")}</span>
            <span className="flex items-center gap-1.5 text-[13px]"><span className="h-2 w-2 rounded-full bg-green-500" />Trực tuyến</span>
            <BellThongBao onOpenHoSo={openPopup} />
            <button
              type="button"
              className="text-lg"
              style={{ color: NAVY }}
              onClick={() => (document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.())}
            >
              {full ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </button>
          </div>
        </div>

        {/* Thẻ thống kê */}
        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={<FaUsers />} value={the.hom_nay ?? 0} label="Hồ sơ hôm nay" delta={tk ? the.hom_nay - the.hom_qua : null}
            color="#2f6fe4" from="#f3f7ff" to="#d6e5fd" spark={spark("tong")}
            active={!filters.trang_thai && filters.tu_ngay?.isSame(dayjs(), "day")} onClick={() => setStatusFilter(undefined, true)} />
          <StatCard icon={<FaRegClock />} value={the.cho_duyet ?? 0} label="Đang chờ duyệt" delta={tk ? the.cho_duyet_moi : null}
            color="#ef8a16" from="#fff8ee" to="#fde2bf" spark={spark("tong")}
            active={filters.trang_thai === "cho_duyet"} onClick={() => setStatusFilter("cho_duyet")} />
          <StatCard icon={<FaExclamationCircle />} value={the.can_bo_sung ?? 0} label="Cần bổ sung" delta={tk ? the.can_bo_sung_moi : null}
            color="#e53945" from="#fff4f5" to="#fcd6da" spark={spark("tong")}
            active={filters.trang_thai === "can_bo_sung"} onClick={() => setStatusFilter("can_bo_sung")} />
          <StatCard icon={<FaCheckCircle />} value={the.da_duyet ?? 0} label="Đã duyệt" delta={tk ? the.da_duyet - the.da_duyet_hom_qua : null}
            color="#22a84f" from="#f1fcf5" to="#cdf1da" spark={spark("da_xu_ly")}
            active={filters.trang_thai === "da_duyet"} onClick={() => setStatusFilter("da_duyet")} />
          <StatCard icon={<FaPrint />} value={the.da_in ?? 0} label="Đã in" delta={tk ? the.da_in - the.da_in_hom_qua : null}
            color="#7b4fe0" from="#f8f4ff" to="#e2d7fb" spark={spark("da_xu_ly")}
            active={filters.trang_thai === "da_in"} onClick={() => setStatusFilter("da_in")} />
        </div>

        {/* Biểu đồ + tỷ lệ + hàng đợi */}
        <div className="grid shrink-0 gap-3 xl:h-[clamp(196px,24vh,290px)] xl:grid-cols-[minmax(0,9fr)_minmax(0,7.5fr)_minmax(0,11fr)]">
          <Card
            title="Biểu đồ tiến độ tiếp nhận"
            icon={<FaChartBar />}
            extra={
              <Select size="small" value={soNgay} onChange={setSoNgay} style={{ width: 125 }}
                options={[{ value: 7, label: "7 ngày gần đây" }, { value: 14, label: "14 ngày" }, { value: 30, label: "30 ngày" }]} />
            }
            bodyClassName="px-3 pb-2"
          >
            <div className="flex justify-center gap-6 text-[13px] text-slate-700">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#2f6fe4" }} />Tổng hồ sơ</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22b45a" }} />Đã xử lý</span>
            </div>
            <div className="h-[calc(100%-20px)] min-h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 28, right: 26, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-tong" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2f6fe4" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#2f6fe4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-xl" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#22b45a" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#22b45a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e6ecf5" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} domain={[0, (max) => Math.max(4, Math.ceil(max * 1.15))]} />
                  <RTooltip formatter={(v, n) => [v, n === "tong" ? "Tổng hồ sơ" : "Đã xử lý"]} labelFormatter={(_, p) => (p?.[0] ? fmtDate(p[0].payload.ngay) : "")} />
                  <Area type="linear" dataKey="tong" stroke="#2f6fe4" strokeWidth={2} fill="url(#g-tong)" dot={{ r: 4, fill: "#2f6fe4", strokeWidth: 0 }} isAnimationActive={false}
                    label={(p) => <LastBadge {...p} last={chart.length - 1} color="#2f6fe4" dy={-28} />} />
                  <Area type="linear" dataKey="da_xu_ly" stroke="#22b45a" strokeWidth={2} fill="url(#g-xl)" dot={{ r: 4, fill: "#22b45a", strokeWidth: 0 }} isAnimationActive={false}
                    label={(p) => <LastBadge {...p} last={chart.length - 1} color="#22b45a" dy={-11} dx={-10} />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Tỷ lệ xử lý hồ sơ" icon={<FaShieldAlt />}>
            <div className="flex h-full items-center gap-4">
              <div className="relative aspect-square h-full max-h-40 min-h-[120px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ v: daXuLy }, { v: Math.max(tong - daXuLy, tong ? 0 : 1) }]}
                      dataKey="v" innerRadius="74%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}
                    >
                      <Cell fill="#22b45a" />
                      <Cell fill="#dfe5ee" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[24px] font-extrabold" style={{ color: NAVY }}>{pct(daXuLy)}</div>
                  <div className="text-[13px] text-slate-600">Đã xử lý</div>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {legend.map((l) => (
                  <div key={l.key} className="flex items-center justify-between gap-2 whitespace-nowrap text-[14px]">
                    <span className="flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-full" style={{ background: l.color }} />{l.name}</span>
                    <span className="font-semibold text-slate-800">{pct(l.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex flex-col overflow-hidden rounded-2xl bg-white/85 shadow-[0_6px_24px_rgba(23,64,140,0.10)] backdrop-blur">
            <div className="flex shrink-0 items-center justify-between px-4 py-2.5 text-white" style={{ background: `linear-gradient(90deg, #0b2a66, ${TABLE_HEAD})` }}>
              <span className="flex items-center gap-2.5 text-[16px] font-bold"><FaBolt className="text-amber-400" /> Hàng đợi tiếp nhận</span>
              <button type="button" className="flex items-center gap-1.5 text-[13px] font-medium hover:underline" onClick={() => setStatusFilter("cho_duyet")}>
                Xem chi tiết <ArrowRightOutlined />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-2">
              {tkLoading && !tk ? (
                <div className="py-10 text-center"><Spin /></div>
              ) : !tk?.hang_doi?.length ? (
                <Empty description="Không có hồ sơ chờ duyệt" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-6" />
              ) : (
                <div className="flex flex-col">
                  {tk.hang_doi.map((q, i) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => openPopup(q.id)}
                      className={`flex items-center gap-4 rounded-xl px-4 py-2 text-left transition hover:bg-blue-50 ${
                        i === 0 ? "border-2 border-blue-300 bg-blue-50/60 shadow-sm" : "border-b border-slate-100"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${q.gioi_tinh === "Nữ" ? "bg-pink-100 text-pink-500" : "bg-blue-100 text-blue-600"}`}>
                        <UserOutlined />
                      </span>
                      <span className="w-12 shrink-0 text-[16px] font-bold" style={{ color: "#2f6fe4" }}>{String(q.so_thu_tu || 0).padStart(4, "0")}</span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-slate-800">{q.ho_ten}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[14px] tabular-nums text-slate-700">
                        <ClockCircleOutlined /> {fmtWait(now.diff(dayjs(q.thoi_gian_khai), "second"))}
                      </span>
                      <span className="shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold text-orange-600" style={{ background: "#ffe9cc" }}>Chờ duyệt</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Danh sách + thông tin nhanh */}
        <div className="grid min-h-[300px] flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card title="Danh sách hồ sơ học viên" icon={<FaUsers />} className="min-h-0" bodyClassName="flex flex-col px-4 pb-2">
            <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2">
              <DatePicker value={filters.tu_ngay} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" style={{ width: 200 }}
                prefix={<span className="whitespace-nowrap text-slate-600"><FaRegCalendarAlt className="mr-1 inline" />Từ ngày</span>}
                suffixIcon={<ArrowRightOutlined className="text-slate-500" />}
                onChange={(v) => { setFilters((f) => ({ ...f, tu_ngay: v })); resetPage(); }} />
              <DatePicker value={filters.den_ngay} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" style={{ width: 205 }}
                prefix={<span className="whitespace-nowrap text-slate-600"><FaRegCalendarAlt className="mr-1 inline" />Đến ngày</span>}
                onChange={(v) => { setFilters((f) => ({ ...f, den_ngay: v })); resetPage(); }} />
              <Select allowClear placeholder="Tất cả trạng thái" style={{ width: 150 }} value={filters.trang_thai}
                onChange={(v) => { setFilters((f) => ({ ...f, trang_thai: v })); resetPage(); }}
                options={Object.entries(TRANG_THAI_META).map(([value, m]) => ({ value, label: m.label }))} />
              <Select allowClear placeholder="Tất cả hạng" style={{ width: 125 }} value={filters.hang}
                onChange={(v) => { setFilters((f) => ({ ...f, hang: v })); resetPage(); }}
                options={HANG_OPTIONS.map((h) => ({ value: h.value, label: `Hạng ${h.value}` }))} />
              <Input
                allowClear
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Tìm theo tên, CCCD, mã hồ sơ..."
                className="min-w-[180px] flex-1"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); if (!e.target.value) setFilters((f) => ({ ...f, search: "" })); }}
                onPressEnter={doSearch}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={doSearch} style={{ background: "#1f6ae0" }}>Tìm kiếm</Button>
            </div>
            <div ref={tableBoxRef} className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
            <Table
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={rows}
              loading={listLoading}
              scroll={{ x: 960, y: Math.max(80, tableBoxH - 40 - 42) }}
              className="[&_.ant-table]:!text-[13px] [&_td]:!px-2 [&_th]:!px-2"
              rowSelection={{ selectedRowKeys: checked, onChange: setChecked, columnWidth: 36 }}
              onRow={(r) => ({ onClick: () => setSelectedId(r.id), className: "cursor-pointer" })}
              rowClassName={(r) => (r.id === selectedId ? "[&>td]:!bg-blue-50/70" : "")}
              pagination={{
                current: page.page,
                pageSize: page.limit,
                total: listRes?.pagination?.total || 0,
                showSizeChanger: true,
                size: "small",
                className: "!mb-0 !mt-2",
                showTotal: (t) => `${t} hồ sơ`,
                onChange: (p, l) => setPage({ page: l !== page.limit ? 1 : p, limit: l }),
              }}
              components={{
                header: {
                  cell: (props) => <th {...props} style={{ ...props.style, background: TABLE_HEAD, color: "#fff", fontWeight: 600, borderColor: TABLE_HEAD }} />,
                },
              }}
            />
            </div>
            </div>
          </Card>

          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <Card title="Thông tin nhanh" icon={<FaInfoCircle />} iconColor="#22a84f" className="min-h-0 flex-1" bodyClassName="overflow-auto px-4 pb-3">
              {!sel ? (
                <Empty description="Chọn một hồ sơ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div className="flex h-full flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    {sel.anh_chan_dung ? (
                      <img src={sel.anh_chan_dung} alt={sel.ho_ten} className="h-[60px] w-[60px] shrink-0 rounded-full object-cover shadow-md ring-4 ring-blue-50" />
                    ) : (
                      <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-blue-50 text-3xl text-blue-300 ring-4 ring-blue-50">
                        <UserOutlined />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="text-[18px] font-bold leading-snug" style={{ color: NAVY }}>{sel.ho_ten}</div>
                      <div className="text-[14px] text-slate-600">{sel.ma_ho_so}</div>
                      <div className="mt-1"><Pill value={sel.trang_thai} /></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0">
                    <InfoLine icon={<FaPhoneAlt />} label="SĐT" value={sel.dien_thoai} />
                    <InfoLine icon={<FaRegCalendarAlt />} label="Ngày sinh" value={fmtDate(sel.ngay_sinh)} />
                    <InfoLine icon={<FaRegIdCard />} label="CCCD" value={sel.cccd} />
                    <InfoLine icon={<FaEnvelope />} label="Địa chỉ" value={sel.dia_chi} />
                    <InfoLine icon={<FaGraduationCap />} label="Hạng đăng ký" value={sel.loai_hinh || sel.hang} />
                    <InfoLine icon={<FaRegCheckCircle />} label="Khám SK" value={sel.kham_suc_khoe} />
                    <InfoLine icon={<FaRegCheckCircle />} label="Phải thu" value={fmtTien(tinhPhaiThu(sel, cauHinh)?.tong) || "Chưa có giá"} />
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => setDetailId(sel.id)} style={{ background: "#1f6ae0" }}>Xem chi tiết</Button>
                    <Button icon={<EditOutlined />} onClick={() => openPopup(sel.id)} className="!border-blue-300 !text-blue-600">Chỉnh sửa</Button>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Thao tác nhanh" icon={<FaRegCheckCircle />} iconColor="#1f6ae0" className="shrink-0" bodyClassName="px-4 pb-3">
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Duyệt hồ sơ", icon: <FaCheckCircle />, color: "#1f6ae0", bg: "#e8f0ff", disabled: !sel || !["cho_duyet", "can_bo_sung"].includes(sel.trang_thai), onClick: () => openPopup(sel.id) },
                  { label: "In hồ sơ", icon: <FaPrint />, color: "#7b4fe0", bg: "#f1ebff", disabled: !sel || !["da_duyet", "da_in"].includes(sel.trang_thai), onClick: () => inHoSo(sel.id) },
                  { label: "Tiếp nhận hồ sơ mới", icon: <FaUserPlus />, color: "#0e7490", bg: "#e0f7fb", onClick: () => openPopup(null) },
                  { label: "Nhập từ ảnh CCCD (OCR)", icon: <FaIdCard />, color: "#ea580c", bg: "#fff1e6", onClick: () => setOcrOpen(true) },
                  { label: "Yêu cầu bổ sung", icon: <FaFolderPlus />, color: "#22a84f", bg: "#e6f8ec", disabled: !sel || ["da_in", "can_bo_sung"].includes(sel.trang_thai), onClick: () => setTraId(sel.id) },
                ].map((b) => (
                  <Tooltip key={b.label} title={b.label}>
                    <button type="button" aria-label={b.label} disabled={b.disabled || busy} onClick={b.onClick}
                      className="flex h-11 w-full items-center justify-center rounded-xl text-[24px] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ color: b.color, background: b.bg, fontSize: 26 }}>
                      {b.icon}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Thanh trạng thái */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-white/80 px-5 py-2 text-[13px] text-slate-700 shadow-sm backdrop-blur">
          <span className="flex items-center gap-1.5"><FaShieldAlt className="text-green-600" /> Hệ thống hoạt động ổn định</span>
          <span className="text-slate-300">|</span>
          <span>Tổng: {the.tong ?? 0} hồ sơ</span>
          <span className="text-slate-300">|</span>
          <span>Đã xử lý: {the.tong_da_xu_ly ?? 0} hồ sơ ({the.tong ? ((the.tong_da_xu_ly / the.tong) * 100).toFixed(1) : 0}%)</span>
          <span className="ml-auto text-[15px] font-semibold italic" style={{ color: NAVY }}>Lập Phương Thành – Vững bước tương lai</span>
        </div>
      </div>

      <Modal
        open={popupOpen}
        onCancel={closePopup}
        footer={null}
        closable={false}
        width="min(1500px, 96vw)"
        style={{ top: 16 }}
        destroyOnHidden
        styles={{ container: { padding: 0, background: "transparent", boxShadow: "none" }, content: { padding: 0, background: "transparent", boxShadow: "none" }, body: { padding: 0 } }}
      >
        {popupOpen && (
          <TiepNhanView id={popupId} inModal prefill={popupPrefill} onOpen={(newId) => setPopupId(newId ? String(newId) : null)} onBack={closePopup} />
        )}
      </Modal>
      <OcrCccdModal
        open={ocrOpen}
        onClose={() => setOcrOpen(false)}
        onResult={(data, nguon) => {
          setOcrOpen(false);
          openPopup(null, { data, nguon });
        }}
      />
      <HoSoDetailModal id={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
      <TraBoSungModal
        open={!!traId}
        onClose={() => setTraId(null)}
        loading={busy}
        thieu={traRow?.thieu_truong || []}
        onSubmit={async (lyDo) => {
          const ok = await act(() => traBoSungHoSo(traId, lyDo), "Đã trả hồ sơ yêu cầu bổ sung");
          if (ok) setTraId(null);
        }}
      />
    </div>
  );
}
