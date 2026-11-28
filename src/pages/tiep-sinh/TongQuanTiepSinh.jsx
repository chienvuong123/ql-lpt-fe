import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, DatePicker, Segmented, Dropdown, Empty, Input, Modal, Popover, Select, Spin, Table, Tooltip, message, notification } from "antd";
import {
  EyeOutlined, MoreOutlined, ClockCircleOutlined, SearchOutlined,
  DownloadOutlined, SyncOutlined, DeleteOutlined, EditOutlined, BellOutlined,
  FullscreenOutlined, FullscreenExitOutlined, ArrowRightOutlined, UserOutlined, FileSearchOutlined,
  SettingOutlined, SendOutlined,
} from "@ant-design/icons";
import {
  FaUsers, FaRegClock, FaExclamationCircle, FaCheckCircle, FaPrint, FaRegCalendarAlt, FaPhoneAlt, FaTrashAlt,
  FaRegIdCard, FaIdCard, FaUserPlus, FaEnvelope, FaGraduationCap, FaChartBar, FaShieldAlt, FaBolt, FaInfoCircle, FaFolderPlus,
  FaRegCheckCircle, FaUserTie,
} from "react-icons/fa";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import dayjs from "dayjs";
import {
  getThongKeTiepSinh, getDaXoaTiepSinh, getDanhSachHoSo, getChiTietHoSo, getCauHinhTiepSinh, ghiNhanInHoSo, traBoSungHoSo, moLaiHoSo, xoaHoSo, errMsg,
} from "../../apis/apiTiepSinh";
import {
  NGUON_META, StatusTag, TRANG_THAI_HIEN_THI, LOC_TRANG_THAI, trangThaiHienThi, chiTietTrangThai, HANG_OPTIONS, WEEKDAYS, HoSoDetailModal, TraBoSungModal,
  fmtDate, fmtDateTime, fmtWait, useNow, tinhPhaiThu, fmtTien, taiAnhHoSo,
} from "./tiepSinhShared";
import { printForms, mauTheoHang } from "./mauDon";
import { TiepNhanView } from "./TiepNhanHoSo";
import OcrCccdModal from "./OcrCccdModal";
import NopKeToanModal from "./NopKeToanModal";
import CampusBackdrop from "./CampusBackdrop";

const NAVY = "#0f2d6b";
const TABLE_HEAD = "#16357a";
const SHORT_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
// v2: mặc định ẩn "Thời gian duyệt" + "Địa chỉ" -> STT, Mã hồ sơ, Họ tên, Năm sinh, CCCD, Điện thoại, Loại hình, Đầu mối, Hạng, Phải thu, Trạng thái
const COT_AN_KEY = "tiep-sinh-cot-an-v2";
const COT_AN_MAC_DINH = ["duyet_at", "dia_chi"];
const KY_KEY = "tiep-sinh-ky-so-lieu";
// Kỳ xem số liệu của các thẻ thống kê
const KY_OPTIONS = [
  { value: 1, label: "1 ngày" },
  { value: 7, label: "7 ngày" },
  { value: 14, label: "14 ngày" },
  { value: 30, label: "30 ngày" },
];

/** Danh sách hồ sơ đã xoá trong kỳ */
function DaXoaModal({ open, ky, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["tiep-sinh-da-xoa", ky],
    queryFn: () => getDaXoaTiepSinh({ ky }),
    enabled: open,
    staleTime: 0,
  });
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={1000} destroyOnHidden
      title={`Hồ sơ đã xoá — ${ky === 1 ? "hôm nay" : `${ky} ngày gần nhất`}`}>
      <Table rowKey="id" size="small" loading={isLoading} dataSource={data?.data || []} pagination={{ pageSize: 10, size: "small" }}
        scroll={{ x: 900 }}
        columns={[
          { title: "Thời gian xoá", dataIndex: "xoa_at", width: 130, render: (v) => fmtDateTime(v) },
          { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 100 },
          { title: "Họ và tên", dataIndex: "ho_ten", width: 160 },
          { title: "CCCD", dataIndex: "cccd", width: 115 },
          { title: "Điện thoại", dataIndex: "dien_thoai", width: 105 },
          { title: "Loại hình", dataIndex: "loai_hinh", width: 150, ellipsis: true },
          { title: "Trạng thái khi xoá", dataIndex: "trang_thai", width: 120, render: (v) => <StatusTag value={v} tooltip={false} /> },
          { title: "Thời gian khai", dataIndex: "thoi_gian_khai", width: 130, render: (v) => fmtDateTime(v) },
          { title: "Người xoá", dataIndex: "nguoi_xoa", width: 120, render: (v) => v || "-" },
        ]} />
    </Modal>
  );
}

// Nhãn trạng thái: dùng chung 4 loại (Chờ duyệt / Bổ sung / Duyệt / Bỏ học)
const Pill = ({ row }) => <StatusTag hs={row} />;

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
  // kỳ số liệu của thẻ thống kê (nhớ theo trình duyệt)
  const [ky, setKyState] = useState(() => {
    try {
      const v = Number(localStorage.getItem(KY_KEY));
      return KY_OPTIONS.some((o) => o.value === v) ? v : 1;
    } catch {
      return 1;
    }
  });
  const setKy = (v) => {
    setKyState(v);
    try {
      localStorage.setItem(KY_KEY, String(v));
    } catch {
      /* bỏ qua */
    }
  };
  const [daXoaOpen, setDaXoaOpen] = useState(false);
  const [nopKtOpen, setNopKtOpen] = useState(false);
  const [filters, setFilters] = useState({ tu_ngay: dayjs(), den_ngay: dayjs(), trang_thai: undefined, hang: undefined, search: "" });
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState({ page: 1, limit: 10 });
  const [checked, setChecked] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [traId, setTraId] = useState(null);
  const [busy, setBusy] = useState(false);
  // Cột đang ẩn — nhớ theo trình duyệt
  const [cotAn, setCotAn] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(COT_AN_KEY));
      return Array.isArray(v) ? v : COT_AN_MAC_DINH;
    } catch {
      return COT_AN_MAC_DINH;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(COT_AN_KEY, JSON.stringify(cotAn));
    } catch {
      /* bỏ qua */
    }
  }, [cotAn]);
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
    queryKey: ["tiep-sinh-thong-ke", soNgay, ky],
    queryFn: () => getThongKeTiepSinh({ so_ngay: soNgay, ky }),
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

  // Thẻ "Hồ sơ N ngày": lọc danh sách theo đúng kỳ đang xem
  const locTheoKy = () => {
    setFilters((f) => ({ ...f, trang_thai: undefined, tu_ngay: dayjs().subtract(ky - 1, "day"), den_ngay: dayjs() }));
    setPage((p) => ({ ...p, page: 1 }));
  };
  const resetPage = () => setPage((p) => ({ ...p, page: 1 }));
  const doSearch = () => {
    setFilters((f) => ({ ...f, search: searchText.trim() }));
    resetPage();
  };

  // Cột bảng (thứ tự theo yêu cầu). xuat: giá trị ghi ra Excel
  // còn phải thu = phải thu − tiền HV khác chuyển sang
  const phaiThu = (r) => tinhPhaiThu(r, cauHinh)?.conLai ?? null;
  const nowrap = (v) => <span className="whitespace-nowrap">{v}</span>;
  const COT = [
    { key: "stt", title: "STT", width: 46, align: "center", always: true, render: (_, __, i) => (page.page - 1) * page.limit + i + 1 },
    { key: "duyet_at", title: "Thời gian duyệt", width: 128, render: (v) => nowrap(fmtDateTime(v)), xuat: (r) => fmtDateTime(r.duyet_at) },
    { key: "ma_ho_so", title: "Mã hồ sơ", width: 100 },
    { key: "ho_ten", title: "Họ và tên", width: 160, ellipsis: true, always: true },
    { key: "ngay_sinh", title: "Năm sinh", width: 92, render: (v) => nowrap(fmtDate(v)), xuat: (r) => fmtDate(r.ngay_sinh) },
    { key: "cccd", title: "CCCD", width: 112, render: nowrap },
    { key: "dien_thoai", title: "Điện thoại", width: 104, render: nowrap },
    { key: "dia_chi", title: "Địa chỉ", width: 200, ellipsis: { showTitle: true } },
    { key: "loai_hinh", title: "Loại hình", width: 150, ellipsis: { showTitle: true } },
    { key: "dau_moi", title: "Đầu mối", width: 120, ellipsis: { showTitle: true } },
    { key: "hang", title: "Hạng", width: 54, align: "center" },
    { key: "phai_thu", title: "Phải thu", width: 108, align: "right", render: (_, r) => nowrap(fmtTien(phaiThu(r))), xuat: phaiThu },
    { key: "trang_thai", title: "Trạng thái", width: 120, render: (_, r) => <Pill row={r} />,
      xuat: (r) => {
        const ct = chiTietTrangThai(r);
        return `${TRANG_THAI_HIEN_THI[trangThaiHienThi(r)].label}${ct ? ` (${ct})` : ""}`;
      } },
    { key: "nguoi_duyet", title: "Người duyệt", width: 120, ellipsis: { showTitle: true } },
  ];

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

  const columns = COT.filter((c) => c.always || !cotAn.includes(c.key)).map((c) => {
    const col = { ...c, dataIndex: c.key === "stt" || c.key === "phai_thu" ? undefined : c.key };
    delete col.xuat;
    delete col.always;
    return col;
  });
  const tableWidth = columns.reduce((t, c) => t + (c.width || 100), 36);

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
            <span className="flex items-center gap-2 whitespace-nowrap"><FaRegCalendarAlt className="text-lg" style={{ color: NAVY }} /><span className="hidden 2xl:inline">{WEEKDAYS[now.day()]}, </span>{now.format("DD/MM/YYYY")}</span>
            <span className="flex items-center gap-2 font-semibold tabular-nums"><FaRegClock className="text-lg" style={{ color: NAVY }} />{now.format("HH:mm:ss")}</span>
            <span className="flex items-center gap-1.5 text-[13px]" title="Trực tuyến"><span className="h-2 w-2 rounded-full bg-green-500" /><span className="hidden 2xl:inline">Trực tuyến</span></span>
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

        {/* Thẻ thống kê — chọn kỳ xem số liệu */}
        <div className="-mb-1.5 -mt-1 flex shrink-0 items-center justify-end gap-2 text-[13px] font-semibold" style={{ color: NAVY }}>
          Xem số liệu:
          <Segmented size="small" value={ky} onChange={setKy} options={KY_OPTIONS} />
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={<FaUsers />} value={the.ky_moi ?? 0} label={ky === 1 ? "Hồ sơ hôm nay" : `Hồ sơ ${ky} ngày`}
            delta={tk ? the.ky_moi - the.ky_moi_truoc : null}
            color="#2f6fe4" from="#f3f7ff" to="#d6e5fd" spark={spark("tong")}
            active={!filters.trang_thai && filters.tu_ngay?.isSame(dayjs().subtract(ky - 1, "day"), "day") && filters.den_ngay?.isSame(dayjs(), "day")}
            onClick={locTheoKy} />
          <StatCard icon={<FaRegClock />} value={the.cho_duyet ?? 0} label="Đang chờ duyệt" delta={tk ? the.ky_cho_duyet_moi : null}
            color="#ef8a16" from="#fff8ee" to="#fde2bf" spark={spark("tong")}
            active={filters.trang_thai === "cho_duyet"} onClick={() => setStatusFilter("cho_duyet")} />
          <StatCard icon={<FaExclamationCircle />} value={the.can_bo_sung ?? 0} label="Bổ sung" delta={tk ? the.ky_can_bo_sung_moi : null}
            color="#ca8a04" from="#fffbeb" to="#fde68a" spark={spark("tong")}
            active={filters.trang_thai === "can_bo_sung"} onClick={() => setStatusFilter("can_bo_sung")} />
          <StatCard icon={<FaCheckCircle />} value={the.ky_da_duyet ?? 0} label="Đã duyệt" delta={tk ? the.ky_da_duyet - the.ky_da_duyet_truoc : null}
            color="#22a84f" from="#f1fcf5" to="#cdf1da" spark={spark("da_xu_ly")}
            active={filters.trang_thai === "duyet"} onClick={() => setStatusFilter("duyet")} />
          <StatCard icon={<FaTrashAlt />} value={the.ky_da_xoa ?? 0} label="Đã xoá" delta={tk ? the.ky_da_xoa - the.ky_da_xoa_truoc : null}
            color="#e11d48" from="#fff1f3" to="#fecdd6" spark={spark("da_xoa")}
            active={daXoaOpen} onClick={() => setDaXoaOpen(true)} />
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
                options={LOC_TRANG_THAI}
                labelRender={(o) => ({ da_in: "Duyệt (đã in)", da_duyet: "Duyệt" })[o.value] || o.label} />
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
              <Popover
                trigger="click"
                placement="bottomRight"
                title="Hiển thị cột"
                content={
                  <div className="flex w-48 flex-col gap-1">
                    {COT.filter((c) => !c.always).map((c) => (
                      <Checkbox key={c.key} checked={!cotAn.includes(c.key)}
                        onChange={(e) => setCotAn((a) => (e.target.checked ? a.filter((k) => k !== c.key) : [...a, c.key]))}>
                        {c.title}
                      </Checkbox>
                    ))}
                    <Button size="small" type="link" className="!px-0 text-left" disabled={!cotAn.length} onClick={() => setCotAn([])}>Hiện tất cả</Button>
                  </div>
                }
              >
                <Button icon={<SettingOutlined />}>Cột{cotAn.length ? ` (ẩn ${cotAn.length})` : ""}</Button>
              </Popover>
              <Tooltip title={checked.length ? `Gửi ${checked.length} hồ sơ đã tích chọn lên kế toán` : "Gửi dữ liệu học viên đã thu tiền lên kế toán (theo thời gian)"}>
                <Button icon={<SendOutlined />} onClick={() => setNopKtOpen(true)} className="!border-green-600 !font-semibold !text-green-700">
                  Nộp KT{checked.length ? ` (${checked.length})` : ""}
                </Button>
              </Tooltip>
            </div>
            <div ref={tableBoxRef} className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
            <Table
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={rows}
              loading={listLoading}
              scroll={{ x: tableWidth, y: Math.max(80, tableBoxH - 40 - 42) }}
              className="[&_.ant-table]:!text-[13px] [&_td]:!px-2 [&_th]:!px-2"
              rowSelection={{ selectedRowKeys: checked, onChange: setChecked, columnWidth: 36 }}
              onRow={(r) => ({ onClick: () => setSelectedId(r.id), onDoubleClick: () => openPopup(r.id), className: "cursor-pointer" })}
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
            <Card title="Thông tin nhanh" icon={<FaInfoCircle />} iconColor="#22a84f" className="min-h-0 flex-1" bodyClassName="flex flex-col overflow-hidden px-4 pb-2"
              extra={sel && (
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      { key: "ct", icon: <FileSearchOutlined />, label: "Chi tiết & lịch sử", onClick: () => setDetailId(sel.id) },
                      { key: "anh", icon: <DownloadOutlined />, label: `Tải ảnh (${sel.ma_ho_so})`, disabled: !sel.anh_chan_dung, onClick: () => taiAnhHoSo(sel) },
                      ...(sel.trang_thai === "can_bo_sung" && !sel.kt_duyet_at ? [{ key: "mo", icon: <SyncOutlined />, label: "Đã bổ sung → chờ duyệt", onClick: () => act(() => moLaiHoSo(sel.id), "Đã chuyển về chờ duyệt") }] : []),
                      ...(sel.trang_thai !== "da_in" && !sel.kt_duyet_at ? [{ type: "divider" }, { key: "xoa", danger: true, icon: <DeleteOutlined />, label: "Xoá hồ sơ", onClick: () => xoa(sel) }] : []),
                    ],
                  }}
                >
                  <button type="button" aria-label="Thêm thao tác" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                    <MoreOutlined />
                  </button>
                </Dropdown>
              )}>
              {!sel ? (
                <Empty description="Chọn một hồ sơ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                  {/* Phần thông tin cuộn; nút Xem chi tiết / Chỉnh sửa cố định bên dưới */}
                  <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto pr-2">
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
                      <div className="mt-1"><Pill row={sel} /></div>
                      {sel.kt_duyet_at ? <div className="mt-1 text-xs font-semibold text-amber-700">🔒 Kế toán đã duyệt thu — dữ liệu đã khoá</div> : null}
                      {sel.can_bo_sung_sau && sel.ly_do_bo_sung ? <div className="mt-1 text-xs text-orange-600">Cần bổ sung: {sel.ly_do_bo_sung}</div> : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0">
                    <InfoLine icon={<FaPhoneAlt />} label="SĐT" value={sel.dien_thoai} />
                    <InfoLine icon={<FaRegCalendarAlt />} label="Ngày sinh" value={fmtDate(sel.ngay_sinh)} />
                    <InfoLine icon={<FaRegIdCard />} label="CCCD" value={sel.cccd} />
                    <InfoLine icon={<FaEnvelope />} label="Địa chỉ" value={sel.dia_chi} />
                    <InfoLine icon={<FaGraduationCap />} label="Hạng đăng ký" value={sel.loai_hinh || sel.hang} />
                    <InfoLine icon={<FaRegCheckCircle />} label="Khám SK" value={sel.kham_suc_khoe} />
                    <InfoLine icon={<FaRegCheckCircle />} label="Phải thu" value={fmtTien(tinhPhaiThu(sel, cauHinh)?.conLai) || "Chưa có giá"} />
                    <InfoLine icon={<FaUserTie />} label="Đầu mối" value={sel.dau_moi} />
                    <InfoLine icon={<FaRegClock />} label="Thời gian khai" value={fmtDateTime(sel.thoi_gian_khai)} />
                    <InfoLine icon={<FaRegClock />} label="Thời gian duyệt" value={fmtDateTime(sel.duyet_at)} />
                  </div>
                  </div>
                  <div className="grid shrink-0 grid-cols-2 gap-2">
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => setDetailId(sel.id)} style={{ background: "#1f6ae0" }}>Xem chi tiết</Button>
                    <Button icon={<EditOutlined />} onClick={() => openPopup(sel.id)} className="!border-blue-300 !text-blue-600">{sel.kt_duyet_at ? "Xem / In" : "Chỉnh sửa"}</Button>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Thao tác nhanh" icon={<FaRegCheckCircle />} iconColor="#1f6ae0" className="shrink-0" bodyClassName="px-4 pb-3">
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Duyệt hồ sơ", icon: <FaCheckCircle />, color: "#1f6ae0", bg: "#e8f0ff", disabled: !sel || !!sel.kt_duyet_at || !["cho_duyet", "can_bo_sung"].includes(sel.trang_thai), onClick: () => openPopup(sel.id) },
                  { label: "In hồ sơ", icon: <FaPrint />, color: "#7b4fe0", bg: "#f1ebff", disabled: !sel || !["da_duyet", "da_in"].includes(sel.trang_thai), onClick: () => inHoSo(sel.id) },
                  { label: "Tiếp nhận hồ sơ mới", icon: <FaUserPlus />, color: "#0e7490", bg: "#e0f7fb", onClick: () => openPopup(null) },
                  { label: "Nhập từ ảnh CCCD (OCR)", icon: <FaIdCard />, color: "#ea580c", bg: "#fff1e6", onClick: () => setOcrOpen(true) },
                  { label: "Yêu cầu bổ sung", icon: <FaFolderPlus />, color: "#22a84f", bg: "#e6f8ec", disabled: !sel || !!sel.kt_duyet_at || ["da_in", "can_bo_sung", "bo_hoc"].includes(sel.trang_thai), onClick: () => setTraId(sel.id) },
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
      <DaXoaModal open={daXoaOpen} ky={ky} onClose={() => setDaXoaOpen(false)} />
      <NopKeToanModal open={nopKtOpen} ids={checked} onClose={() => { setNopKtOpen(false); setChecked([]); refresh(); }} />
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
