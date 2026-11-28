import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dropdown, Empty, Input, Modal, Pagination, Select, Spin, Table, Tooltip, message } from "antd";
import {
  FaClipboardList, FaClipboardUser, FaUsers, FaClock, FaCircleCheck, FaCubes, FaIdCard, FaPhone, FaRegCalendarDays,
  FaGraduationCap, FaFileInvoiceDollar, FaDownload, FaRegFileLines, FaPrint, FaCheck, FaLock, FaUser, FaXmark,
  FaMagnifyingGlass, FaFilter, FaChevronDown, FaAnglesLeft, FaAnglesRight,
} from "react-icons/fa6";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { getKtDot, getKtChiTietDot, getKtChiTiet, ktDuyetDot, errMsg } from "../../apis/apiTiepSinh";
import { fmtDate, fmtTien } from "../tiep-sinh/tiepSinhShared";
import { bienBanHtml } from "../tiep-sinh/bienBanNopKt";
import { tenKhoa, phieuThuDotHtml, phieuThuDotNhieuHtml, inHtml } from "./phieuThu";

// Bảng màu chung với màn Phòng Kế toán
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
};
const SHADOW = "0 4px 16px rgba(30,100,190,0.12)";
const HEAD = `linear-gradient(90deg, ${C.sidebar}, ${C.primary} 65%, ${C.light})`;
const LOC = [
  { key: "tat_ca", label: "Tất cả" },
  { key: "cho_duyet", label: "Chờ duyệt" },
  { key: "da_duyet", label: "Đã duyệt" },
];
const fmtGio = (v) => (v ? dayjs(v).format("HH:mm - DD/MM/YYYY") : "—");

function Stat({ icon, label, value, valueColor = C.title }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3" style={{ borderColor: C.border, boxShadow: SHADOW }}>
      {icon}
      <div className="min-w-0">
        <div className="text-[13px] font-medium" style={{ color: C.text }}>{label}</div>
        <div className="truncate text-[22px] font-extrabold leading-tight tabular-nums" style={{ color: valueColor }}>{value}</div>
      </div>
    </div>
  );
}

const tron = (bg, children) => (
  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[22px] text-white" style={{ background: bg, boxShadow: "0 4px 10px rgba(0,0,0,0.12)" }}>
    {children}
  </span>
);

function SecTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[15px] font-bold" style={{ background: C.bg, color: C.title }}>
      <span className="text-[18px]" style={{ color: C.sidebar }}>{icon}</span> {children}
    </div>
  );
}

function Line({ label, children, color = C.title }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-baseline gap-2 px-3 py-[3px] text-[14px]">
      <span style={{ color: C.text }}>{label}</span>
      <span className="text-right font-bold" style={{ color }}>{children}</span>
    </div>
  );
}

/** Ảnh + thông tin học viên đang chọn trong đợt */
function ThongTin({ row }) {
  const { data } = useQuery({ queryKey: ["kt-hoc-vien", row?.id], queryFn: () => getKtChiTiet(row.id), enabled: !!row, staleTime: 30000 });
  const anh = row && data?.data?.id === row.id ? data.data.anh_chan_dung : null;
  if (!row) return <Empty className="py-10" image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn một học viên" />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        {anh ? (
          <img src={anh} alt={row.ho_ten} className="h-[136px] w-[112px] shrink-0 rounded-xl object-cover" style={{ boxShadow: SHADOW }} />
        ) : (
          <span className="flex h-[136px] w-[112px] shrink-0 items-center justify-center rounded-xl text-5xl" style={{ background: C.bg, color: "#9cc3f5" }}><FaUser /></span>
        )}
        <div className="min-w-0 flex-1 pt-1">
          <div className="truncate text-[20px] font-bold" style={{ color: C.title }}>{row.ho_ten}</div>
          <span className="mb-2.5 mt-0.5 inline-block rounded-md px-2.5 py-0.5 text-[15px] font-bold" style={{ background: C.soft, color: C.sidebar }}>{row.ma_ho_so}</span>
          <div className="flex flex-col gap-1.5 text-[14px]" style={{ color: C.text }}>
            <span className="flex items-center gap-2"><FaRegCalendarDays className="shrink-0" style={{ color: C.sidebar }} />Ngày sinh: <b style={{ color: C.title }}>{fmtDate(row.ngay_sinh) || "—"}</b></span>
            <span className="flex items-center gap-2"><FaIdCard className="shrink-0" style={{ color: C.sidebar }} />CCCD: <b style={{ color: C.title }}>{row.cccd || "—"}</b></span>
            <span className="flex items-center gap-2"><FaPhone className="shrink-0" style={{ color: C.sidebar }} />SĐT: <b style={{ color: C.title }}>{row.dien_thoai || "—"}</b></span>
          </div>
        </div>
      </div>

      <div>
        <SecTitle icon={<FaGraduationCap />}>Thông tin đào tạo</SecTitle>
        <div className="pt-1">
          <div className="grid grid-cols-[150px_1fr] gap-2 px-3 py-[3px] text-[14px]"><span style={{ color: C.text }}>Hạng đăng ký:</span><b style={{ color: C.title }}>{row.hang || "—"}</b></div>
          <div className="grid grid-cols-[150px_1fr] gap-2 px-3 py-[3px] text-[14px]"><span style={{ color: C.text }}>Khóa học:</span><b style={{ color: C.title }}>{tenKhoa(row) || "—"}</b></div>
        </div>
      </div>

      <div>
        <SecTitle icon={<FaFileInvoiceDollar />}>Thông tin thu phí</SecTitle>
        <div className="pt-1">
          {row.nhap_tay !== null && row.nhap_tay !== undefined ? (
            <Line label="Học phí (tiếp sinh nhập tay):">{fmtTien(row.nhap_tay)}</Line>
          ) : (
            <>
              <Line label="Học phí theo bảng giá:">{row.gia_goc === null ? <span className="font-normal" style={{ color: C.sub }}>Chưa có giá</span> : fmtTien(row.gia_goc)}</Line>
              <Line label="Giảm trừ (nếu có):" color={C.success}>{fmtTien(row.giam_tru || 0)}</Line>
              {row.phi_kham > 0 && <Line label="Phí khám sức khoẻ:">{fmtTien(row.phi_kham)}</Line>}
            </>
          )}
          {row.duoc_chuyen > 0 && <Line label="Tiền HV khác chuyển sang:" color={C.success}>−{fmtTien(row.duoc_chuyen)}</Line>}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5" style={{ background: C.bg }}>
          <span className="text-[16px] font-bold" style={{ color: C.title }}>Số tiền phải thu:</span>
          <span className="text-[20px] font-extrabold tabular-nums" style={{ color: C.primary }}>{row.so_tien === null ? "Chưa có giá" : fmtTien(row.so_tien)}</span>
        </div>
      </div>

      {row.kt_duyet_at && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-[13px]" style={{ color: C.success }}>
          <FaLock /> Đã duyệt {fmtGio(row.kt_duyet_at)}{row.kt_nguoi_duyet ? ` bởi ${row.kt_nguoi_duyet}` : ""} — dữ liệu đã khoá
        </div>
      )}
    </div>
  );
}

function NutVien({ icon, children, ...rest }) {
  return (
    <button type="button" {...rest}
      className="flex h-12 items-center gap-2.5 rounded-xl border-2 bg-white px-5 text-[16px] font-bold transition hover:bg-[#F5F9FF] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ borderColor: "#9cc3f5", color: C.sidebar, boxShadow: SHADOW }}>
      <span className="text-[18px]">{icon}</span> {children}
    </button>
  );
}

/**
 * Duyệt danh sách thu học phí từ Phòng Tiếp sinh (theo đợt gửi).
 * Duyệt thu = chốt số tiền, lập + in phiếu thu, khoá dữ liệu hồ sơ bên tiếp sinh.
 */
export default function DuyetDotModal({ open, onClose, onChanged }) {
  const qc = useQueryClient();
  const [dotId, setDotId] = useState(null);
  const [search, setSearch] = useState("");
  const [loc, setLoc] = useState("tat_ca");
  const [checked, setChecked] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [xemDot, setXemDot] = useState(false);
  const [page, setPage] = useState({ page: 1, limit: 10 });

  const { data: dsRes, isLoading: dsLoading } = useQuery({ queryKey: ["kt-dot"], queryFn: getKtDot, enabled: open, staleTime: 0 });
  const dots = useMemo(() => dsRes?.data || [], [dsRes]);
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setLoc("tat_ca");
  }, [open]);
  useEffect(() => {
    if (open && dots.length && !dots.some((d) => d.id === dotId)) setDotId(dots[0].id);
  }, [open, dots, dotId]);

  const { data: ctRes, isFetching } = useQuery({ queryKey: ["kt-dot", dotId], queryFn: () => getKtChiTietDot(dotId), enabled: open && !!dotId, staleTime: 0 });
  const ct = ctRes?.data?.dot?.id === dotId ? ctRes.data : null;
  const all = useMemo(() => ct?.data || [], [ct]);

  // Mặc định tick các học viên chờ duyệt
  useEffect(() => {
    setChecked(all.filter((r) => !r.kt_duyet_at).map((r) => r.id));
    setSelectedId((id) => (all.some((r) => r.id === id) ? id : all[0]?.id ?? null));
  }, [all]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(
      (r) =>
        (loc === "tat_ca" || (loc === "da_duyet") === !!r.kt_duyet_at) &&
        (!q || [r.ho_ten, r.cccd, r.ma_ho_so].some((v) => String(v || "").toLowerCase().includes(q))),
    );
  }, [all, search, loc]);
  // Đổi đợt / lọc / tìm -> về trang 1
  useEffect(() => { setPage((p) => ({ ...p, page: 1 })); }, [dotId, search, loc]);
  const soTrang = Math.max(1, Math.ceil(rows.length / page.limit));
  const trang = Math.min(page.page, soTrang);
  const rowsTrang = rows.slice((trang - 1) * page.limit, trang * page.limit);

  const selected = all.find((r) => r.id === selectedId) || null;
  const chon = all.filter((r) => checked.includes(r.id));
  const chonChoDuyet = chon.filter((r) => !r.kt_duyet_at);
  const chonDaDuyet = chon.filter((r) => r.kt_duyet_at);

  const lamMoi = () => {
    qc.invalidateQueries({ queryKey: ["kt-dot"] });
    onChanged?.();
  };

  const duyet = () => {
    if (!chonChoDuyet.length) return message.warning("Chọn học viên chờ duyệt");
    const tong = chonChoDuyet.reduce((s, r) => s + (r.so_tien || 0), 0);
    Modal.confirm({
      title: `Duyệt thu ${chonChoDuyet.length} học viên?`,
      width: 460,
      content: (
        <div>
          Tổng tiền: <b>{fmtTien(tong)}</b>.
          <div className="mt-1 text-slate-600">Hệ thống lập phiếu thu, in phiếu và <b>khoá dữ liệu</b> các hồ sơ này — tiếp sinh không sửa được nữa.</div>
        </div>
      ),
      okText: "Duyệt thu & In phiếu",
      onOk: async () => {
        setSaving(true);
        try {
          const r = await ktDuyetDot(dotId, chonChoDuyet.map((x) => x.id));
          const pc = r.data.phieu_chung;
          message.success(`Đã duyệt thu ${r.data.vua_duyet.length} học viên${pc ? ` — phiếu thu ${pc.so_phieu}` : ""}`);
          if (pc) inHtml(phieuThuDotHtml(pc, r.data.dot));
          lamMoi();
        } catch (e) {
          message.error(errMsg(e, "Duyệt thu thất bại"));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  // In lại phiếu của học viên đã duyệt (đang tick; không tick ai thì cả đợt)
  const inLai = () => {
    const ds = (chonDaDuyet.length ? chonDaDuyet : all.filter((r) => r.kt_duyet_at)).filter((r) => r.phieu_thu?.length);
    if (!ds.length) return message.info("Chưa có phiếu thu đã duyệt để in");
    // Gom theo số phiếu: mỗi lần duyệt = 1 phiếu chung cho nhiều hồ sơ
    const nhom = new Map();
    for (const r of ds) {
      for (const p of r.phieu_thu) {
        const g = nhom.get(p.so_phieu) || { so_phieu: p.so_phieu, created_at: p.created_at, nguoi_thu: p.nguoi_thu, so_tien: 0, ho_so: [] };
        g.so_tien += p.so_tien;
        g.ho_so.push({ ...r, so_tien_thu: p.so_tien });
        nhom.set(p.so_phieu, g);
      }
    }
    const list = [...nhom.values()].sort((a, b) => a.so_phieu.localeCompare(b.so_phieu));
    inHtml(phieuThuDotNhieuHtml(list.map((phieu) => ({ phieu, dot: ct.dot }))));
  };

  const xuatExcel = () => {
    if (!all.length) return;
    const data = (chon.length ? chon : all).map((r, i) => ({
      STT: i + 1,
      "Mã hồ sơ": r.ma_ho_so,
      "Họ và tên": r.ho_ten,
      "Ngày sinh": fmtDate(r.ngay_sinh),
      CCCD: r.cccd || "",
      "Điện thoại": r.dien_thoai || "",
      Hạng: r.hang || "",
      "Khoá học": tenKhoa(r),
      "Học phí theo bảng giá": r.gia_goc ?? "",
      "Giảm trừ": r.giam_tru || 0,
      "Phải thu": r.so_tien ?? "",
      "Trạng thái": r.kt_duyet_at ? "Đã duyệt" : "Chờ duyệt",
      "Thời gian duyệt": r.kt_duyet_at ? dayjs(r.kt_duyet_at).format("HH:mm DD/MM/YYYY") : "",
      "Số phiếu thu": (r.phieu_thu || []).map((p) => p.so_phieu).join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0]).map((k) => ({ wch: Math.min(40, Math.max(k.length + 2, ...data.map((d) => String(d[k] ?? "").length + 1))) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dot gui");
    XLSX.writeFile(wb, `${ct.dot.ma_dot}.xlsx`);
  };

  const columns = [
    { title: "STT", width: 56, align: "center", render: (_, __, i) => (trang - 1) * page.limit + i + 1 },
    { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 130 },
    { title: "Họ và tên", dataIndex: "ho_ten", width: 170, ellipsis: true },
    { title: "Hạng", dataIndex: "hang", width: 64, align: "center" },
    { title: "Khóa học", width: 110, render: (_, r) => tenKhoa(r) },
    { title: "Học phí", dataIndex: "so_tien", width: 120, align: "right", render: (v) => (v === null ? <span style={{ color: C.sub }}>Chưa có giá</span> : <span className="whitespace-nowrap">{fmtTien(v)}</span>) },
    {
      title: "Trạng thái", width: 130, align: "center",
      render: (_, r) =>
        r.kt_duyet_at ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-semibold" style={{ background: "#DCF5E5", color: C.success }}><FaCircleCheck /> Đã duyệt</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-semibold" style={{ background: "#FFF1DC", color: "#E8730C" }}><FaClock /> Chờ duyệt</span>
        ),
    },
  ];

  const navBtn = "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-[12px] transition hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width="min(1500px, 96vw)" style={{ top: 16 }} destroyOnHidden
      styles={{ container: { padding: 0, overflow: "hidden", borderRadius: 24 }, content: { padding: 0 }, body: { padding: 0 } }}>
      {/* Tiêu đề */}
      <div className="flex items-center gap-4 px-6 py-4 text-white" style={{ background: `linear-gradient(110deg, ${C.sidebar}, ${C.primary} 55%, #5aa8ff)` }}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl text-[26px]" style={{ background: "rgba(255,255,255,0.2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}>
          <FaClipboardList />
        </span>
        <span className="flex-1 text-[24px] font-bold">Duyệt danh sách thu học phí từ Phòng Tiếp sinh</span>
        <button type="button" onClick={onClose} aria-label="Đóng" title="Đóng"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[20px] transition hover:bg-blue-50" style={{ color: C.primary }}>
          <FaXmark />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5" style={{ background: C.bg2 }}>
        {dsLoading ? (
          <div className="py-16 text-center"><Spin /></div>
        ) : !dots.length ? (
          <Empty className="py-16" description="Chưa có đợt gửi nào từ Phòng Tiếp sinh" />
        ) : (
          <>
            {/* Đợt gửi + số liệu */}
            <div className="grid gap-3 xl:grid-cols-[minmax(480px,2.4fr)_repeat(3,minmax(0,0.8fr))_minmax(0,1.25fr)]">
              <div className="flex items-center gap-4 rounded-2xl border bg-white px-4 py-3" style={{ borderColor: C.border, boxShadow: SHADOW }}>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[28px] text-white"
                  style={{ background: "linear-gradient(160deg, #3fd3e6, #0ea5c6)", boxShadow: "0 6px 14px rgba(14,165,198,0.3)" }}>
                  <FaClipboardUser />
                </span>
                <div className="grid min-w-0 flex-1 gap-x-6 gap-y-1 text-[14px] md:grid-cols-[auto_minmax(0,1fr)]" style={{ color: C.text }}>
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="whitespace-nowrap text-[17px] font-bold" style={{ color: C.title }}>Đợt gửi:</span>
                    <Select variant="borderless" value={dotId} onChange={setDotId} popupMatchSelectWidth={false}
                      className="min-w-[170px]"
                      labelRender={(o) => <span className="text-[17px] font-extrabold" style={{ color: C.title }}>{o.label}</span>}
                      style={{ color: C.title }}
                      options={dots.map((d) => ({
                        value: d.id,
                        label: d.ma_dot,
                        hint: d.cho_duyet ? `(${d.cho_duyet} chờ duyệt)` : "(đã duyệt xong)",
                        cho: d.cho_duyet,
                      }))}
                      optionRender={(o) => (
                        <span className="font-bold" style={{ color: C.title }}>
                          {o.data.label}{" "}
                          <span className={`text-[12px] font-normal ${o.data.cho ? "text-orange-600" : "text-green-700"}`}>{o.data.hint}</span>
                        </span>
                      )} />
                  </div>
                  <span className="truncate">Thời gian gửi: <b style={{ color: C.title }}>{fmtGio(ct?.dot.created_at)}</b></span>
                  <span className="truncate">Người gửi: <b style={{ color: C.title }}>{ct?.dot.nguoi || "—"}</b> (Tiếp sinh)</span>
                  <span className="truncate" title={ct?.dot.ghi_chu || ""}>Ghi chú: <b style={{ color: C.title }}>{ct?.dot.ghi_chu || "—"}</b></span>
                </div>
              </div>
              <Stat icon={<FaUsers className="shrink-0 text-[34px]" style={{ color: C.primary }} />} label="Tổng học viên" value={ct?.tong_hv ?? 0} />
              <Stat icon={tron("linear-gradient(160deg,#ffb347,#f59e0b)", <FaClock />)} label="Chờ duyệt" value={ct?.cho_duyet ?? 0} />
              <Stat icon={tron("linear-gradient(160deg,#3ddc84,#16a34a)", <FaCheck />)} label="Đã duyệt" value={ct?.da_duyet ?? 0} />
              <Stat icon={tron("linear-gradient(160deg,#b98cff,#873FF0)", <FaCubes />)} label="Tổng tiền" value={fmtTien(ct?.tong_tien ?? 0)} />
            </div>

            {/* Danh sách + thông tin học viên */}
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white" style={{ borderColor: C.border, boxShadow: SHADOW }}>
                <div className="flex flex-wrap items-center gap-3 p-3 pb-0">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 rounded-xl px-4 py-2 text-white" style={{ background: HEAD }}>
                    <span className="mr-auto flex items-center gap-2.5 text-[17px] font-bold"><FaClipboardList /> Danh sách học viên ({all.length})</span>
                    <Input allowClear prefix={<FaMagnifyingGlass style={{ color: C.sub }} />} placeholder="Tìm theo họ tên, CCCD, mã hồ sơ..."
                      value={search} onChange={(e) => setSearch(e.target.value)} className="!h-9 !rounded-lg" style={{ width: 320 }} />
                  </div>
                  <Dropdown trigger={["click"]} menu={{ selectable: true, selectedKeys: [loc], items: LOC.map((l) => ({ key: l.key, label: l.label })), onClick: (e) => setLoc(e.key) }}>
                    <button type="button" className="flex h-[52px] items-center gap-2.5 rounded-xl border bg-white px-4 text-[15px] font-bold transition hover:border-blue-400"
                      style={{ borderColor: C.border, color: C.sidebar }}>
                      <FaFilter /> {loc === "tat_ca" ? "Lọc" : LOC.find((l) => l.key === loc).label} <FaChevronDown className="text-[12px]" />
                    </button>
                  </Dropdown>
                </div>
                <div className="p-3">
                  <Table rowKey="id" size="small" columns={columns} dataSource={rowsTrang} loading={isFetching} pagination={false}
                    scroll={{ x: 780 }}
                    rowSelection={{ selectedRowKeys: checked, onChange: (keys) => {
                      // giữ lựa chọn của các trang khác
                      const trangIds = rowsTrang.map((r) => r.id);
                      setChecked((cu) => [...cu.filter((id) => !trangIds.includes(id)), ...keys]);
                    }, columnWidth: 48 }}
                    onRow={(r) => ({ onClick: () => setSelectedId(r.id), className: "cursor-pointer" })}
                    rowClassName={(r) => (r.id === selectedId ? "[&>td]:!bg-[#EAF3FF]" : "")}
                    components={{
                      header: {
                        cell: (props) => <th {...props} style={{ ...props.style, background: "#fff", color: C.title, fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }} />,
                      },
                    }}
                    className="[&_.ant-table-tbody>tr.ant-table-row>td]:!border-[#EDF2FA] [&_.ant-table-tbody>tr.ant-table-row>td]:!py-[9px] [&_.ant-table-tbody>tr.ant-table-row>td]:!text-[15px] [&_.ant-table-tbody>tr.ant-table-row>td]:!text-[#102D62]" />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-[15px]" style={{ color: C.title }}>
                      Đã chọn: <b>{chon.length}</b> / {all.length} học viên
                      {chonChoDuyet.length > 0 && <> — chờ duyệt: <b style={{ color: C.success }}>{fmtTien(chonChoDuyet.reduce((s, r) => s + (r.so_tien || 0), 0))}</b></>}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button type="button" className={navBtn} style={{ color: C.title, borderColor: C.border }} disabled={trang <= 1} onClick={() => setPage((p) => ({ ...p, page: 1 }))}><FaAnglesLeft /></button>
                      <Pagination size="small" current={trang} pageSize={page.limit} total={rows.length} showSizeChanger={false}
                        onChange={(p) => setPage((s) => ({ ...s, page: p }))}
                        className="[&_.ant-pagination-item]:!h-8 [&_.ant-pagination-item]:!min-w-8 [&_.ant-pagination-item]:!rounded-md [&_.ant-pagination-item]:!border-[#D7E5F8] [&_.ant-pagination-item]:!leading-[30px] [&_.ant-pagination-item-active]:!border-[#0878F9] [&_.ant-pagination-item-active]:!bg-[#0878F9] [&_.ant-pagination-item-active_a]:!text-white [&_.ant-pagination-next]:!h-8 [&_.ant-pagination-next]:!min-w-8 [&_.ant-pagination-next]:!rounded-md [&_.ant-pagination-next]:!border [&_.ant-pagination-next]:!border-[#D7E5F8] [&_.ant-pagination-prev]:!h-8 [&_.ant-pagination-prev]:!min-w-8 [&_.ant-pagination-prev]:!rounded-md [&_.ant-pagination-prev]:!border [&_.ant-pagination-prev]:!border-[#D7E5F8]" />
                      <button type="button" className={navBtn} style={{ color: C.title, borderColor: C.border }} disabled={trang >= soTrang} onClick={() => setPage((p) => ({ ...p, page: soTrang }))}><FaAnglesRight /></button>
                      <Select value={page.limit} onChange={(l) => setPage({ page: 1, limit: l })} className="ml-1 w-[104px]"
                        options={[10, 20, 50, 100].map((n) => ({ value: n, label: `${n} / trang` }))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="self-start overflow-hidden rounded-2xl border bg-white" style={{ borderColor: C.border, boxShadow: SHADOW }}>
                <div className="flex items-center gap-2.5 px-4 py-3 text-[17px] font-bold text-white" style={{ background: HEAD }}>
                  <FaUser /> Thông tin học viên
                </div>
                <div className="p-4"><ThongTin row={selected} /></div>
              </div>
            </div>

            {/* Thao tác */}
            <div className="flex flex-wrap items-center gap-3">
              <NutVien icon={<FaDownload />} disabled={!all.length} onClick={xuatExcel}>Xuất Excel</NutVien>
              <NutVien icon={<FaRegFileLines />} disabled={!ct} onClick={() => setXemDot(true)}>Xem chi tiết đợt gửi</NutVien>
              <div className="ml-auto flex flex-wrap gap-3">
                <Tooltip title={chonDaDuyet.length ? `In lại phiếu của ${chonDaDuyet.length} học viên đã duyệt đang chọn` : "In lại phiếu thu của mọi học viên đã duyệt trong đợt"}>
                  <span>
                    <NutVien icon={<FaPrint />} disabled={!ct?.da_duyet} onClick={inLai}>In phiếu thu (đã duyệt)</NutVien>
                  </span>
                </Tooltip>
                <button type="button" disabled={!chonChoDuyet.length || saving} onClick={duyet}
                  className="flex h-12 items-center gap-3 rounded-xl px-7 text-[17px] font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "linear-gradient(180deg, #2fc46c, #148a3f)", color: "#fff", boxShadow: "0 6px 16px rgba(22,163,74,0.35)" }}>
                  {saving ? <Spin size="small" /> : <FaCheck className="text-[20px]" />}
                  Duyệt thu & In phiếu thu{chonChoDuyet.length ? ` (${chonChoDuyet.length})` : ""}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal open={xemDot} onCancel={() => setXemDot(false)} width={900} destroyOnHidden footer={null}
        title={ct ? `Đợt gửi ${ct.dot.ma_dot} — biên bản xác nhận của tiếp sinh` : ""}>
        {ct && (
          <iframe title="Biên bản đợt gửi" className="h-[70vh] w-full rounded border"
            srcDoc={bienBanHtml({ rows: all, tu: ct.dot.tu_ngay, den: ct.dot.den_ngay, nguoi: ct.dot.nguoi, ghiChu: ct.dot.ghi_chu, thoiGian: ct.dot.created_at })} />
        )}
      </Modal>
    </Modal>
  );
}
