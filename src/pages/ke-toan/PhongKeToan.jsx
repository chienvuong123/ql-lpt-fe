import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Empty, Input, InputNumber, Modal, Pagination, Select, Spin, Table, Tooltip, message } from "antd";
import {
  FaSackDollar, FaUsers, FaWallet, FaCircleCheck, FaDatabase, FaRegCalendarDays, FaBell, FaFileExcel, FaClock,
  FaCheck, FaClipboardList, FaPrint, FaCreditCard, FaListUl, FaCircleInfo, FaPhone, FaUserTie,
  FaArrowTrendUp, FaArrowTrendDown, FaMoneyBill1, FaBuildingColumns, FaUser, FaMoneyCheckDollar,
  FaHouse, FaCar, FaCarSide, FaMotorcycle, FaIdCard, FaCircleDollarToSlot, FaMagnifyingGlass, FaAnglesLeft, FaAnglesRight, FaChevronUp, FaChevronDown,
} from "react-icons/fa6";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { getKtThongKe, getKtDanhSach, getKtChiTiet, getKtDot, ktThuPhi, errMsg } from "../../apis/apiTiepSinh";
import DuyetDotModal from "./DuyetDotModal";
import ChiTietHocVienModal from "./ChiTietHocVienModal";
import { WEEKDAYS, fmtDate, fmtTien, useNow } from "../tiep-sinh/tiepSinhShared";
import { tenKhoa, phieuThuHtml, inHtml } from "./phieuThu";
import banner from "../../assets/ke-toan-banner.webp";

// ─── Bảng màu ─────────────────────────────
const C = {
  sidebar: "#0646A8",
  primary: "#0878F9",
  light: "#2495FF",
  soft: "#DCEBFF",
  title: "#102D62",
  text: "#263B5E",
  sub: "#71839E",
  bg: "#EAF3FF",
  bg2: "#F5F9FF",
  border: "#D7E5F8",
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#EF4444",
};
const TABLE_HEAD = "#16357a"; // cùng màu tiêu đề bảng bên Tiếp sinh
const SHADOW = "0 4px 16px rgba(30,100,190,0.12)";
const CARD = "rounded-[18px] border bg-white";
const cardStyle = { borderColor: C.border, boxShadow: SHADOW };

// Danh sách = học viên tiếp sinh đã duyệt / cần bổ sung · Đã thu = tiếp sinh trình + KT duyệt thu, hoặc KT tự thu · Công nợ = còn lại
const TABS = [
  { key: "danh_sach", label: "Danh sách" },
  { key: "da_thu", label: "Đã thu" },
  { key: "cong_no", label: "Công nợ" },
];
const TRANG_THAI_THU = {
  cho_thu: { label: "Chờ thu phí", bg: "#FFF1DC", color: "#E8730C", icon: <FaClock /> },
  chua_trinh: { label: "Chưa trình KT", bg: "#EEF1F6", color: "#5B6B85", icon: <FaWallet /> },
  thu_thieu: { label: "Thu thiếu", bg: "#FDE4E4", color: C.danger, icon: <FaWallet /> },
  da_thu: { label: "Đã thu", bg: "#DCF5E5", color: C.success, icon: <FaCircleCheck /> },
};
const HINH_THUC = [
  { key: "tien_mat", label: "Tiền mặt", icon: <FaMoneyBill1 /> },
  { key: "chuyen_khoan", label: "Chuyển khoản", icon: <FaBuildingColumns /> },
];

// ─── Thành phần giao diện ─────────────────────────────
function Delta({ value, suffix = "%", text }) {
  if (value === null || value === undefined) return <span className="text-[14px]" style={{ color: C.sub }}>{text || "—"}</span>;
  const up = value >= 0;
  return (
    <span className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: C.text }}>
      <span style={{ color: up ? C.success : C.danger }}>{up ? <FaArrowTrendUp /> : <FaArrowTrendDown />}</span>
      {up ? "+" : ""}{value}{suffix}{text ? ` ${text}` : ""}
    </span>
  );
}

/** Thẻ KPI: ô biểu tượng gradient bóng bên trái, nền nhạt cùng tông, biểu tượng mờ bên phải */
function StatCard({ icon, label, value, delta, color, tile, bg }) {
  return (
    <div className="relative flex h-[86px] items-center gap-3 overflow-hidden rounded-2xl border border-white p-1.5 pr-3"
      style={{ background: bg, boxShadow: SHADOW }}>
      <span className="relative flex h-full w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-xl text-[34px] text-white"
        style={{ background: tile, boxShadow: `inset 0 2px 0 rgba(255,255,255,0.35), 0 8px 16px ${color}40` }}>
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
        <span className="relative drop-shadow-[0_3px_4px_rgba(0,0,0,0.18)]">{icon}</span>
      </span>
      <div className="relative z-10 min-w-0">
        <div className="text-[15px] font-bold" style={{ color: C.title }}>{label}</div>
        <div className="truncate text-[26px] font-extrabold leading-[1.15] tabular-nums" style={{ color: C.title }}>{value}</div>
        {delta}
      </div>
      <span className="pointer-events-none absolute bottom-2 right-3 text-[48px]" style={{ color, opacity: 0.2 }}>{icon}</span>
    </div>
  );
}

function TrangThaiTag({ value }) {
  const m = TRANG_THAI_THU[value] || TRANG_THAI_THU.cho_thu;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-semibold" style={{ background: m.bg, color: m.color }}>
      {m.icon} {m.label}
    </span>
  );
}

function IconCircle({ children, className = "" }) {
  return (
    <span className={`flex items-center justify-center rounded-full bg-white ${className}`} style={{ boxShadow: SHADOW, color: C.primary }}>
      {children}
    </span>
  );
}

// Hạng mô tô (A, A1, A02...) -> biểu tượng xe máy; ô tô -> biểu tượng ô tô
function IconXe({ hang, ...props }) {
  const moTo = /^A/i.test(String(hang || "").trim()) || !hang;
  return moTo ? <FaMotorcycle {...props} /> : <FaCarSide {...props} />;
}

// ─── Thông tin học viên ───
function KhoaRow({ icon, label, children, hl }) {
  return (
    <div className="flex items-center gap-3 border-t px-3.5 py-2.5 text-[14px]" style={{ borderColor: C.border, background: hl ? C.bg : undefined }}>
      <span className="w-5 shrink-0 text-center text-[16px]" style={{ color: C.sidebar }}>{icon}</span>
      <span className="w-[104px] shrink-0" style={{ color: C.text }}>{label}</span>
      <span className="min-w-0 flex-1 font-bold" style={{ color: C.title }}>{children}</span>
    </div>
  );
}

/** Học viên đang chọn (dùng chung cache giữa panel và khu thu phí) */
function useHocVien(id) {
  const q = useQuery({ queryKey: ["kt-hoc-vien", id], queryFn: () => getKtChiTiet(id), enabled: !!id, staleTime: 0 });
  return { ...q, hs: q.data?.data?.id === id ? q.data.data : null };
}

function ThongTinHocVien({ id }) {
  const { hs, isFetching } = useHocVien(id);
  if (!id) return <Empty className="py-10" description="Chọn một học viên trong danh sách" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  if (!hs) return <div className="py-10 text-center"><Spin /></div>;

  return (
    <Spin spinning={isFetching} size="small">
      <div className="rounded-2xl border p-3" style={{ borderColor: C.border, background: `linear-gradient(180deg, #fff, ${C.bg2})` }}>
        <div className="flex gap-3.5">
          {hs.anh_chan_dung ? (
            <img src={hs.anh_chan_dung} alt={hs.ho_ten} className="h-[150px] w-[120px] shrink-0 rounded-xl object-cover" style={{ boxShadow: SHADOW }} />
          ) : (
            <span className="flex h-[150px] w-[120px] shrink-0 items-center justify-center rounded-xl text-5xl" style={{ background: C.bg, color: "#9cc3f5" }}><FaUser /></span>
          )}
          <div className="min-w-0 flex-1 pt-2">
            <div className="truncate text-[18px] font-bold leading-snug" style={{ color: C.title }}>{hs.ho_ten}</div>
            <div className="text-[16px] font-semibold" style={{ color: C.title }}>{hs.ma_ho_so}</div>
            <div className="mt-5 flex flex-col gap-2.5 text-[13px]" style={{ color: C.text }}>
              <span className="flex items-center gap-2"><FaRegCalendarDays className="shrink-0" style={{ color: C.sidebar }} />Ngày sinh: {fmtDate(hs.ngay_sinh) || "—"}</span>
              <span className="flex items-center gap-2"><FaPhone className="shrink-0" style={{ color: C.sidebar }} />SĐT: {hs.dien_thoai || "—"}</span>
              <span className="flex items-start gap-2"><FaHouse className="mt-0.5 shrink-0" style={{ color: C.sidebar }} />
                <span className="line-clamp-2">Địa chỉ: <b style={{ color: C.title }}>{hs.dia_chi || "—"}</b></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border" style={{ borderColor: C.border, boxShadow: SHADOW }}>
        <div className="flex items-center gap-3 px-3.5 py-2.5 text-[15px] font-bold" style={{ background: C.soft, color: C.title }}>
          <IconXe hang={hs.hang} className="text-[20px]" style={{ color: C.sidebar }} /> Thông tin khóa học
        </div>
        <KhoaRow icon={<FaIdCard />} label="Hạng đăng ký:">{hs.hang || "—"}</KhoaRow>
        <KhoaRow icon={<IconXe hang={hs.hang} />} label="Khóa học:">{tenKhoa(hs) || "—"}</KhoaRow>
        <KhoaRow icon={<FaCircleDollarToSlot />} label="Đơn giá:" hl>
          {hs.phai_thu === null ? <span className="font-normal" style={{ color: C.sub }}>Chưa có giá</span> : fmtTien(hs.phai_thu)}
        </KhoaRow>
        {hs.da_thu > 0 && (
          <KhoaRow icon={<FaCircleCheck />} label="Đã thu:">
            <span style={{ color: C.success }}>{fmtTien(hs.da_thu)}</span>
            {hs.con_lai > 0 && <span className="ml-1.5 font-semibold" style={{ color: C.danger }}>(còn {fmtTien(hs.con_lai)})</span>}
          </KhoaRow>
        )}
      </div>
    </Spin>
  );
}

// ─── Thu phí: logic dùng chung cho nút F2–F4 (dưới bảng) và ô nhập tiền F5 (dưới panel) ───
function useThuPhi({ id, hinhThuc, onDone, onXemCongNo }) {
  const qc = useQueryClient();
  const { hs } = useHocVien(id);
  const [soTien, setSoTien] = useState(null);
  const [saving, setSaving] = useState(false);
  const dangHoi = useRef(false);
  const daDu = hs?.trang_thai_thu === "da_thu";
  const chuaTrinh = false; // kế toán được tự thu cả hồ sơ tiếp sinh chưa trình

  useEffect(() => {
    setSoTien(hs ? hs.con_lai ?? null : null);
  }, [hs?.id, hs?.con_lai]); // eslint-disable-line react-hooks/exhaustive-deps

  const thu = (st) => {
    if (dangHoi.current || saving) return;
    if (!hs) return message.warning("Chọn một học viên trong danh sách");
    if (daDu) return message.info("Học viên đã đóng đủ học phí");
    if (!st || st <= 0) return message.warning("Nhập số tiền thu");
    dangHoi.current = true;
    const tenHt = HINH_THUC.find((h) => h.key === hinhThuc)?.label.toLowerCase();
    Modal.confirm({
      title: "Xác nhận thu phí?",
      content: (
        <div>
          Thu <b>{fmtTien(st)}</b> ({tenHt}) của <b>{hs.ho_ten}</b> ({hs.ma_ho_so}).
          {!hs.nop_kt_at && <div className="mt-1 text-slate-600">Tiếp sinh chưa trình hồ sơ này — kế toán tự thu, số phải thu được chốt theo dữ liệu hiện tại.</div>}
          {hs.con_lai !== null && st < hs.con_lai && <div className="mt-1 text-orange-600">Thu thiếu — còn nợ {fmtTien(hs.con_lai - st)}.</div>}
        </div>
      ),
      okText: "Xác nhận",
      afterClose: () => { dangHoi.current = false; },
      onOk: async () => {
        setSaving(true);
        try {
          const r = await ktThuPhi(hs.id, { so_tien: st, hinh_thuc: hinhThuc });
          message.success(`Đã thu phí — phiếu ${r.data.phieu.so_phieu}`);
          inHtml(phieuThuHtml(r.data.ho_so, r.data.phieu));
          qc.invalidateQueries({ queryKey: ["kt-hoc-vien", id] });
          onDone?.();
        } catch (e) {
          message.error(errMsg(e, "Thu phí thất bại"));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const inPhieu = () => {
    if (!hs) return message.warning("Chọn một học viên trong danh sách");
    const p = hs.phieu_thu?.[0];
    if (!p) return message.info("Học viên chưa có phiếu thu");
    inHtml(phieuThuHtml(hs, p));
  };
  const thuNhanh = () => thu(hs?.con_lai);
  const xacNhan = () => thu(soTien);

  // Phím tắt F2–F5 (chặn hành vi mặc định của trình duyệt, F5 = tải lại trang)
  const hanhDong = useRef({});
  hanhDong.current = { F2: inPhieu, F3: thuNhanh, F4: onXemCongNo, F5: xacNhan };
  useEffect(() => {
    const onKey = (e) => {
      const fn = hanhDong.current[e.key];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { hs, daDu, chuaTrinh, soTien, setSoTien, saving, inPhieu, thuNhanh, xacNhan };
}

function NutLon({ icon, label, phim, from, to, color, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex h-[54px] min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
      style={{ background: `linear-gradient(180deg, ${from}, ${to})`, color: "#fff", boxShadow: `0 6px 16px ${color}55, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
      <span className="text-[20px]">{icon}</span>
      {label} ({phim})
    </button>
  );
}

function Dong({ label, hv, tien }) {
  return (
    <div className="grid grid-cols-[104px_minmax(84px,auto)_1fr] items-baseline gap-x-3 py-[2px] text-[14px]" style={{ color: C.text }}>
      <span>{label}</span>
      <span>{hv ?? 0} học viên</span>
      <span className="text-right text-[15px] font-bold tabular-nums" style={{ color: C.title }}>{fmtTien(tien ?? 0)}</span>
    </div>
  );
}

function TongQuanThuPhi({ tk, tp, onXemCongNo }) {
  const { hs, daDu, chuaTrinh, saving, inPhieu, thuNhanh } = tp;
  return (
    <>
      <div className={`${CARD} px-4 py-2.5`} style={cardStyle}>
        <div className="mb-1 flex items-center gap-2 text-[16px] font-bold" style={{ color: C.title }}>
          <FaCircleInfo className="text-[19px]" style={{ color: C.primary }} /> Tổng quan thu phí
        </div>
        <Dong label="Tổng phải thu:" hv={tk.da_duyet} tien={tk.tq_phai_thu} />
        <Dong label="Đã thu:" hv={tk.tq_hv_da_thu} tien={tk.tq_da_thu} />
        <Dong label="Còn phải thu:" hv={tk.tq_hv_con_lai} tien={tk.tq_con_lai} />
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <NutLon icon={<FaPrint />} label="In phiếu thu" phim="F2" from={C.light} to={C.primary} color={C.primary} onClick={inPhieu} disabled={!hs?.phieu_thu?.length} />
        <NutLon icon={<FaCreditCard />} label="Thu phí nhanh" phim="F3" from="#2fc46c" to={C.success} color={C.success} onClick={thuNhanh} disabled={!hs || daDu || chuaTrinh || !hs.con_lai || saving} />
        <NutLon icon={<FaListUl />} label="Xem công nợ" phim="F4" from="#FFA54A" to="#FF8B18" color="#FF8B18" onClick={onXemCongNo} />
      </div>
    </>
  );
}

function NhapSoTien({ tp }) {
  const { hs, daDu, chuaTrinh, soTien, setSoTien, saving, xacNhan } = tp;
  return (
    <div className={`${CARD} px-4 py-3`} style={cardStyle}>
      <div className="mb-1.5 truncate text-[15px] font-bold" style={{ color: C.title }}>
        Nhập số tiền thu{hs ? <span className="font-medium" style={{ color: C.text }}> — {hs.ho_ten} ({hs.ma_ho_so})</span> : null}
      </div>
      {daDu ? (
        <div className="flex h-[54px] items-center gap-2 text-[15px] font-semibold" style={{ color: C.success }}>
          <FaCircleCheck /> Học viên đã đóng đủ học phí
        </div>
      ) : (
        <div className="flex gap-3">
          <InputNumber size="large" disabled={!hs}
            className="!h-[54px] min-w-0 flex-1 !rounded-xl [&_.ant-input-number-suffix]:!text-[18px] [&_.ant-input-number-suffix]:!font-bold [&_input]:!h-[52px] [&_input]:!text-right [&_input]:!text-[20px] [&_input]:!font-extrabold"
            style={{ borderColor: C.border }}
            min={0} value={soTien} onChange={setSoTien} suffix="đ" controls={false}
            formatter={(v) => (v ? Number(v).toLocaleString("vi-VN") : "")} parser={(v) => Number(String(v).replace(/[^\d]/g, "")) || null}
            onPressEnter={xacNhan} />
          <button type="button" disabled={!hs || chuaTrinh || saving} onClick={xacNhan}
            className="flex h-[54px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
            style={{ background: "linear-gradient(180deg, #2fc46c, #148a3f)", color: "#fff", boxShadow: `0 6px 16px ${C.success}55` }}>
            <span className="text-[18px]">{saving ? <Spin size="small" /> : <FaCheck />}</span>
            <span className="flex flex-col items-center leading-tight">
              <span className="text-[13.5px] font-bold">Xác nhận thu phí</span>
              <span className="text-[13px] font-semibold">(F5)</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/** Sóng xanh nhạt trang trí đáy trang */
function SongNen() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[220px] w-full" viewBox="0 0 1440 220" preserveAspectRatio="none">
      <path d="M0 120 C 260 60, 520 180, 820 120 S 1260 40, 1440 90 V220 H0Z" fill="#DCEBFF" opacity="0.7" />
      <path d="M0 160 C 300 110, 600 210, 900 160 S 1300 110, 1440 140 V220 H0Z" fill="#cfe3fd" opacity="0.6" />
      <path d="M0 195 C 360 160, 700 225, 1040 190 S 1380 170, 1440 185 V220 H0Z" fill="#c2dbfb" opacity="0.5" />
    </svg>
  );
}

// ─── Trang ─────────────────────────────
export default function PhongKeToan() {
  const qc = useQueryClient();
  const now = useNow();
  const [tab, setTab] = useState("danh_sach");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState({ page: 1, limit: 10 });
  const [checked, setChecked] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [chiTietId, setChiTietId] = useState(null);
  const [thuGon, setThuGon] = useState(false); // thu gọn ô thông tin học viên
  // Trang cố định 1 màn hình: đo chiều cao vùng bảng để chỉ bảng cuộn
  const bangRef = useRef(null);
  const [caoBang, setCaoBang] = useState(400);
  useEffect(() => {
    const el = bangRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setCaoBang(Math.floor(e.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const hinhThuc = "tien_mat"; // panel mới không còn chọn hình thức thu -> mặc định tiền mặt

  const { data: tkRes } = useQuery({ queryKey: ["kt-thong-ke"], queryFn: getKtThongKe, refetchInterval: 15000, staleTime: 0 });
  // Đợt gửi từ tiếp sinh còn học viên chờ kế toán duyệt
  const [dotOpen, setDotOpen] = useState(false);
  const { data: dotRes } = useQuery({ queryKey: ["kt-dot"], queryFn: getKtDot, refetchInterval: 15000, staleTime: 0 });
  const dotChoDuyet = (dotRes?.data || []).filter((d) => d.cho_duyet > 0);
  const hvChoDuyet = dotChoDuyet.reduce((s, d) => s + d.cho_duyet, 0);
  const tk = tkRes?.data || {};

  const params = useMemo(() => ({ tab, search: search || undefined, ...page }), [tab, search, page]);
  const { data: listRes, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["kt-danh-sach", params],
    queryFn: () => getKtDanhSach(params),
    refetchInterval: 15000,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
  const rows = useMemo(() => listRes?.data || [], [listRes]);
  const dem = listRes?.dem || {};
  const total = listRes?.pagination?.total || 0;
  const soTrang = Math.max(1, Math.ceil(total / page.limit));

  useEffect(() => {
    if (rows.length && !rows.some((r) => r.id === selectedId)) setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["kt-thong-ke"] });
    qc.invalidateQueries({ queryKey: ["kt-danh-sach"] });
  };
  const doiTab = (k) => {
    setTab(k);
    setPage((p) => ({ ...p, page: 1 }));
    setChecked([]);
  };
  const doSearch = () => {
    setSearch(searchText.trim());
    setPage((p) => ({ ...p, page: 1 }));
  };
  const xemCongNo = () => doiTab("cong_no");
  const tp = useThuPhi({ id: selectedId, hinhThuc, onDone: refresh, onXemCongNo: xemCongNo });

  // Xuất Excel: dòng đã tick, không tick thì toàn bộ danh sách của tab hiện tại
  const xuatExcel = async () => {
    const hide = message.loading("Đang xuất Excel...", 0);
    try {
      let list;
      if (checked.length) list = rows.filter((r) => checked.includes(r.id));
      else {
        list = [];
        for (let p = 1; ; p++) {
          const res = await getKtDanhSach({ ...params, page: p, limit: 500 });
          list.push(...(res?.data || []));
          if (p >= (res?.pagination?.totalPages || 1)) break;
        }
      }
      if (!list.length) return message.info("Không có dữ liệu để xuất");
      const data = list.map((r, i) => ({
        STT: i + 1,
        "Mã hồ sơ": r.ma_ho_so,
        "Họ và tên": r.ho_ten,
        CCCD: r.cccd || "",
        "Điện thoại": r.dien_thoai || "",
        Hạng: r.hang || "",
        "Khoá học": tenKhoa(r),
        "Số tiền phải thu": r.phai_thu ?? "",
        "Đã thu": r.da_thu || 0,
        "Còn phải thu": r.con_lai ?? "",
        "Thời gian duyệt": r.duyet_at ? dayjs(r.duyet_at).format("HH:mm DD/MM/YYYY") : "",
        "Ngày nộp KT": r.nop_kt_at ? dayjs(r.nop_kt_at).format("HH:mm DD/MM/YYYY") : "",
        "Trạng thái": TRANG_THAI_THU[r.trang_thai_thu]?.label || "",
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = Object.keys(data[0]).map((k) => ({ wch: Math.min(40, Math.max(k.length + 2, ...data.map((d) => String(d[k] ?? "").length + 1))) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Thu phi");
      XLSX.writeFile(wb, `ke-toan-${tab}-${dayjs().format("YYYYMMDD-HHmm")}.xlsx`);
    } catch (e) {
      message.error(errMsg(e, "Xuất Excel thất bại"));
    } finally {
      hide();
    }
  };

  const columns = [
    { title: "STT", width: 52, align: "center", render: (_, __, i) => (page.page - 1) * page.limit + i + 1 },
    { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 130 },
    {
      title: "Họ và tên", dataIndex: "ho_ten", width: 160, ellipsis: true,
      render: (v, r) => (
        <Tooltip title="Xem chi tiết học viên">
          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); setChiTietId(r.id); }}
            className="max-w-full truncate text-left font-semibold underline-offset-2 hover:underline" style={{ color: C.sidebar }}>
            {v}
          </button>
        </Tooltip>
      ),
    },
    { title: "CCCD", dataIndex: "cccd", width: 140 },
    { title: "Hạng", dataIndex: "hang", width: 62, align: "center" },
    { title: "Khoá học", width: 100, align: "center", render: (_, r) => tenKhoa(r) },
    { title: "Số tiền phải thu", dataIndex: "phai_thu", width: 130, align: "right", render: (v) => (v === null ? <span style={{ color: C.sub }}>Chưa có giá</span> : fmtTien(v)) },
    { title: "Thời gian duyệt", dataIndex: "duyet_at", width: 120, align: "center", render: (v) => (v ? dayjs(v).format("HH:mm DD/MM") : "—") },
    { title: "Trạng thái", width: 130, align: "center", render: (_, r) => <TrangThaiTag value={r.trang_thai_thu} /> },
    {
      title: "Thao tác", width: 120, align: "center",
      render: (_, r) => {
        const xem = r.trang_thai_thu === "da_thu";
        return (
          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); }}
            className="inline-flex h-[28px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold text-white transition hover:brightness-110"
            style={{ background: xem ? "linear-gradient(180deg,#94a3b8,#64748b)" : `linear-gradient(180deg,${C.light},${C.primary})`, color: "#fff", boxShadow: `0 3px 8px ${C.primary}40` }}>
            <FaMoneyCheckDollar /> {xem ? "Xem" : "Thu phí"}
          </button>
        );
      },
    },
  ];

  const navBtn = "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-[12px] transition hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="relative -m-4 flex h-[calc(100vh-64px)] min-h-[640px] flex-col gap-4 overflow-hidden px-4 pb-4 pt-3 sm:px-5"
      style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 45%, ${C.bg} 100%)` }}>
      {/* Ảnh nền khuôn viên phía sau tiêu đề + sóng đáy trang */}
      <img src={banner} alt="" aria-hidden
        className="pointer-events-none absolute -top-[18px] left-1/2 hidden h-[130px] w-auto max-w-none -translate-x-1/2 select-none lg:block"
        style={{ WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 85%, transparent 100%)", maskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 85%, transparent 100%)" }} />
      <SongNen />

      {/* Tiêu đề */}
      <div className="relative flex min-h-[64px] flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <IconCircle className="h-[58px] w-[58px] text-[28px]">
            <FaSackDollar style={{ color: C.primary, filter: "drop-shadow(0 3px 4px rgba(8,120,249,0.35))" }} />
          </IconCircle>
          <div>
            <div className="text-[26px] font-extrabold leading-tight" style={{ color: C.title }}>Phòng Kế toán</div>
            <div className="text-[15px]" style={{ color: C.text }}>Quản lý thu học phí và công nợ học viên</div>
          </div>
        </div>
        <Tooltip title={dotChoDuyet.length ? `${dotChoDuyet.length} đợt gửi — ${hvChoDuyet} học viên chờ duyệt thu` : "Xem các đợt gửi từ Phòng Tiếp sinh"}>
          <Badge count={hvChoDuyet} overflowCount={999}>
            <button type="button" onClick={() => setDotOpen(true)}
              className="flex h-10 items-center gap-2 rounded-xl px-3.5 text-[14px] font-bold text-white transition hover:brightness-110"
              style={{ background: `linear-gradient(180deg, ${C.light}, ${C.primary})`, color: "#fff", boxShadow: `0 6px 16px ${C.primary}55` }}>
              <FaClipboardList className="text-[16px]" /> Tiếp sinh
            </button>
          </Badge>
        </Tooltip>
        <div className="flex items-center gap-3">
          <IconCircle className="h-[44px] w-[44px] text-[20px]"><FaRegCalendarDays /></IconCircle>
          <div className="leading-tight" style={{ color: C.title }}>
            <div className="text-[14px]">{WEEKDAYS[now.day()]}, {now.format("DD/MM/YYYY")}</div>
            <div className="text-[22px] font-extrabold tabular-nums">{now.format("HH:mm:ss")}</div>
          </div>
          <span className="mx-1 h-9 w-px" style={{ background: C.border }} />
          <Tooltip title={tk.cho_thu_hom_nay ? `${tk.cho_thu_hom_nay} hồ sơ mới gửi lên hôm nay chờ thu phí` : "Không có hồ sơ mới hôm nay"}>
            <Badge count={tk.cho_thu_hom_nay || 0} offset={[-4, 4]}>
              <button type="button" onClick={() => doiTab("cong_no")} aria-label="Hồ sơ mới hôm nay">
                <IconCircle className="h-[44px] w-[44px] text-[20px]"><FaBell /></IconCircle>
              </button>
            </Badge>
          </Tooltip>
          <IconCircle className="h-[44px] w-[44px] text-[20px]"><FaUserTie /></IconCircle>
        </div>
      </div>

      {/* Thẻ KPI */}
      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FaUsers />} label="Học viên đã duyệt" value={tk.da_duyet ?? 0} color="#1684F5"
          bg="linear-gradient(100deg, #DDEBFF 0%, #EEF5FF 65%, #E2EEFF 100%)" tile="linear-gradient(160deg,#4FA3FF,#1684F5 55%,#0A62D6)"
          delta={<Delta value={tk.da_duyet_hom_nay ?? 0} suffix="" text="hôm nay" />} />
        <StatCard icon={<FaWallet />} label="Chờ thu phí" value={tk.cho_thu ?? 0} color="#16B85B"
          bg="linear-gradient(100deg, #DDF6E7 0%, #EFFBF3 65%, #DCF5E6 100%)" tile="linear-gradient(160deg,#4AD683,#16B85B 55%,#0E9446)"
          delta={<Delta value={tk.cho_thu_hom_nay ?? 0} suffix="" text="hôm nay" />} />
        <StatCard icon={<FaCircleCheck />} label="Đã thu trong ngày" value={tk.hv_thu_hom_nay ?? 0} color="#FF8B18"
          bg="linear-gradient(100deg, #FFEBD6 0%, #FFF5EA 65%, #FFE9D2 100%)" tile="linear-gradient(160deg,#FFB05A,#FF8B18 55%,#EC6A00)"
          delta={<Delta value={tk.pct_hv_thu} />} />
        <StatCard icon={<FaDatabase />} label="Tổng thu hôm nay" value={fmtTien(tk.tien_hom_nay ?? 0)} color="#873FF0"
          bg="linear-gradient(100deg, #EDE3FF 0%, #F6F0FF 65%, #EAE0FE 100%)" tile="linear-gradient(160deg,#A874FF,#873FF0 55%,#6A22D6)"
          delta={<Delta value={tk.pct_tien} />} />
      </div>

      {/* Cột trái: danh sách + tổng quan/nút · Cột phải: thông tin học viên + nhập tiền */}
      <div className="relative grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className={`${CARD} flex min-h-0 min-w-0 flex-1 flex-col p-3`} style={cardStyle}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {TABS.map((t) => {
                  const active = tab === t.key;
                  return (
                    <button key={t.key} type="button" onClick={() => doiTab(t.key)}
                      className="flex h-11 items-center gap-2.5 rounded-xl px-4 text-[16px] font-bold transition hover:brightness-105"
                      style={active
                        ? { background: `linear-gradient(180deg, ${C.primary}, ${C.sidebar})`, color: "#fff", boxShadow: `0 6px 14px ${C.sidebar}55` }
                        : { color: C.title }}>
                      {t.label}
                      <span className="min-w-[28px] rounded-full px-2 py-px text-center text-[13px] font-bold"
                        style={active ? { background: "rgba(255,255,255,0.9)", color: C.sidebar } : { background: C.bg, color: C.text }}>
                        {dem[t.key] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex h-10 w-[300px] overflow-hidden rounded-lg border bg-white transition focus-within:border-[#0878F9]" style={{ borderColor: C.border }}>
                  <Input variant="borderless" allowClear placeholder="Tìm theo tên, CCCD, mã hồ sơ..." value={searchText}
                    className="!h-full flex-1 !text-[14px]"
                    onChange={(e) => { setSearchText(e.target.value); if (!e.target.value) { setSearch(""); setPage((p) => ({ ...p, page: 1 })); } }}
                    onPressEnter={doSearch} />
                  <button type="button" onClick={doSearch} aria-label="Tìm kiếm"
                    className="flex w-11 shrink-0 items-center justify-center text-[16px] text-white transition hover:brightness-110"
                    style={{ background: C.primary, color: "#fff" }}>
                    <FaMagnifyingGlass />
                  </button>
                </div>
                <Tooltip title={checked.length ? `Xuất ${checked.length} dòng đã chọn` : "Xuất toàn bộ danh sách của mục đang xem"}>
                  <button type="button" onClick={xuatExcel}
                    className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border bg-white px-3.5 text-[14px] font-semibold transition hover:border-green-500"
                    style={{ borderColor: C.border, color: C.title }}>
                    <FaFileExcel className="text-[20px] text-green-600" /> Xuất Excel{checked.length ? ` (${checked.length})` : ""}
                  </button>
                </Tooltip>
              </div>
            </div>
            <div ref={bangRef} className="min-h-0 flex-1">
            <Table
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={rows}
              loading={isLoading || (isFetching && isPlaceholderData)}
              scroll={{ x: 1160, y: Math.max(120, caoBang - 44) }}
              rowSelection={{ selectedRowKeys: checked, onChange: setChecked, columnWidth: 44 }}
              // bấm dòng = chọn học viên; bấm vào tên mới mở chi tiết
              onRow={(r) => ({ onClick: () => setSelectedId(r.id), className: "cursor-pointer" })}
              // đã thu tiền -> nền xanh lá; đang chọn -> xanh dương
              rowClassName={(r) => {
                const daThu = r.trang_thai_thu === "da_thu" || r.trang_thai_thu === "thu_thieu";
                if (daThu) return r.id === selectedId ? "[&>td]:!bg-[#7FCF9C]" : "[&>td]:!bg-[#A8E0BC] hover:[&>td]:!bg-[#95D8AD]";
                return r.id === selectedId ? "[&>td]:!bg-[#EAF3FF]" : "";
              }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có học viên — học viên được tiếp sinh duyệt sẽ hiện ở đây" /> }}
              components={{
                header: {
                  cell: (props) => (
                    <th {...props} style={{ ...props.style, background: TABLE_HEAD, color: "#fff", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", padding: "7px 8px", borderColor: TABLE_HEAD, borderInlineEnd: "1px solid rgba(255,255,255,0.18)" }} />
                  ),
                },
              }}
              className="overflow-hidden rounded-xl border [&_.ant-table-tbody_td]:!border-[#E6EEF9] [&_.ant-table-tbody>tr.ant-table-row>td]:!py-[9px] [&_.ant-table-tbody_td]:!text-[15px] [&_.ant-table-tbody_td]:!text-[#263B5E] [&_.ant-table-tbody_td]:!whitespace-nowrap [&_.ant-table-tbody_td+td]:!border-l"
              style={{ borderColor: C.border }}
              pagination={false}
            />
            </div>
            {/* Phân trang */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-[15px]" style={{ color: C.text }}>
                Hiển thị {total ? (page.page - 1) * page.limit + 1 : 0} - {Math.min(page.page * page.limit, total)} trong tổng số {total} hồ sơ
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <button type="button" className={navBtn} style={{ color: C.title, borderColor: C.border }} disabled={page.page <= 1} onClick={() => setPage((p) => ({ ...p, page: 1 }))}><FaAnglesLeft /></button>
                <Pagination size="small" current={page.page} pageSize={page.limit} total={total} showSizeChanger={false}
                  onChange={(p) => setPage((s) => ({ ...s, page: p }))}
                  className="[&_.ant-pagination-item]:!h-8 [&_.ant-pagination-item]:!min-w-8 [&_.ant-pagination-item]:!rounded-md [&_.ant-pagination-item]:!border-[#D7E5F8] [&_.ant-pagination-item]:!leading-[30px] [&_.ant-pagination-item-active]:!border-[#0878F9] [&_.ant-pagination-item-active]:!bg-[#0878F9] [&_.ant-pagination-item-active_a]:!text-white [&_.ant-pagination-next]:!h-8 [&_.ant-pagination-next]:!min-w-8 [&_.ant-pagination-next]:!rounded-md [&_.ant-pagination-next]:!border [&_.ant-pagination-next]:!border-[#D7E5F8] [&_.ant-pagination-prev]:!h-8 [&_.ant-pagination-prev]:!min-w-8 [&_.ant-pagination-prev]:!rounded-md [&_.ant-pagination-prev]:!border [&_.ant-pagination-prev]:!border-[#D7E5F8]" />
                <button type="button" className={navBtn} style={{ color: C.title, borderColor: C.border }} disabled={page.page >= soTrang} onClick={() => setPage((p) => ({ ...p, page: soTrang }))}><FaAnglesRight /></button>
                <Select value={page.limit} onChange={(l) => setPage({ page: 1, limit: l })} className="ml-1 w-[104px]"
                  options={[10, 20, 50, 100].map((n) => ({ value: n, label: `${n} / trang` }))} />
              </div>
            </div>
          </div>

        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          {/* Cao bằng khung bảng bên trái; nội dung dài thì cuộn trong khung */}
          <div className={`${CARD} flex min-h-0 flex-col overflow-hidden ${thuGon ? "" : "flex-1"}`} style={cardStyle}>
            <button type="button" onClick={() => setThuGon((v) => !v)}
              className="flex items-center gap-2.5 px-4 py-3 text-left text-[17px] font-bold text-white"
              style={{ background: `linear-gradient(90deg, ${C.sidebar}, ${C.primary} 70%, ${C.light})`, color: "#fff" }}>
              <FaSackDollar className="text-[20px]" />
              <span className="flex-1">Thông tin học viên</span>
              {thuGon ? <FaChevronDown /> : <FaChevronUp />}
            </button>
            {!thuGon && (
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-3.5">
                <ThongTinHocVien id={selectedId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer 1 hàng: tổng quan · nút F2–F4 · nhập số tiền F5 */}
      <div className="relative grid items-center gap-4 lg:grid-cols-[minmax(330px,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(330px,380px)_minmax(0,1fr)_360px]">
        <TongQuanThuPhi tk={tk} tp={tp} onXemCongNo={xemCongNo} />
        <div className="lg:col-span-2 xl:col-span-1">
          <NhapSoTien tp={tp} />
        </div>
      </div>

      <ChiTietHocVienModal id={chiTietId} open={!!chiTietId} onClose={() => setChiTietId(null)} />
      <DuyetDotModal open={dotOpen} onClose={() => setDotOpen(false)} onChanged={refresh} />
    </div>
  );
}
