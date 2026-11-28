import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DatePicker, Dropdown, Empty, Input, Modal, Pagination, Progress, Select, Spin, Table, Tooltip, message } from "antd";
import {
  FaHouse, FaRegCalendarDays, FaUsers, FaCarSide, FaFileLines, FaCircleCheck, FaMagnifyingGlass, FaArrowsRotate, FaWandMagicSparkles,
  FaUser, FaChevronRight, FaChevronLeft, FaPlus, FaGraduationCap, FaPlay, FaUserCheck, FaClock, FaBell, FaTriangleExclamation,
  FaCircleXmark, FaChalkboardUser, FaEye, FaPrint, FaCheck, FaPen, FaTrashCan, FaArrowLeft, FaAnglesLeft, FaAnglesRight, FaXmark,
  FaLock, FaEllipsis,
} from "react-icons/fa6";
import dayjs from "dayjs";
import {
  getTdLop, getTdGoiY, tdLuuThongTin, tdXoaNhom, tdGanNhom, tdTuDongGhep, tdXacThuc, errMsg,
} from "../../apis/apiTiepSinh";
import { WEEKDAYS, fmtDate, useNow } from "../tiep-sinh/tiepSinhShared";
import banner from "../../assets/ke-toan-banner.webp";
import NhomModal from "./NhomModal";
import TongQuanLop from "./TongQuanLop";
import { baoCaoLopHtml, dsBaoCao } from "./baoCaoLop";
import { C, SHADOW, HEAD, tenLop } from "./xepLopShared";

const CARD = "rounded-2xl border bg-white";
const cardStyle = { borderColor: C.border, boxShadow: SHADOW };

function SectionHead({ so, icon, children, extra }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-t-2xl px-4 py-2.5 text-white" style={{ background: HEAD }}>
      <span className="flex items-center gap-2.5 text-[17px] font-bold">
        {so ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[13px] font-extrabold" style={{ color: C.sidebar }}>{so}</span> : null}
        {icon} {children}
      </span>
      <span className="ml-auto flex items-center gap-2">{extra}</span>
    </div>
  );
}

// Thanh tiến trình 4 bước: vòng tròn số nối bằng đường kẻ (xong = xanh lá, đang làm = xanh dương, chưa = xám)
const MAU_BUOC = { xong: C.success, dang: C.primary, cho: "#A9B7CC" };
const XAM = "#D5DEEA";
// nửa phải của bước trước / nửa trái của bước sau -> đoạn nối chuyển màu xanh lá -> xanh dương
const noiPhai = (a, b) => (a === "xong" && b !== "cho" ? C.success : XAM);
const noiTrai = (a, b) => (b === "xong" ? C.success : a === "xong" && b === "dang" ? `linear-gradient(90deg, ${C.success}, ${C.primary})` : XAM);

function Buoc({ so, title, sub, trangThai, chon, trai, phai, onClick }) {
  const dang = chon; // ô chữ nổi bật = bước đang xem
  return (
    <button type="button" onClick={onClick} className="group relative flex min-w-0 flex-1 flex-col items-center">
      <span className="relative flex h-10 w-full items-center">
        <span className="h-[5px] flex-1 rounded-r-full" style={{ background: trai || "transparent" }} />
        <span className="h-[5px] flex-1 rounded-l-full" style={{ background: phai || "transparent" }} />
        <span className="absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white text-[16px] font-extrabold text-white"
          style={{ background: MAU_BUOC[trangThai], boxShadow: `0 3px 10px ${MAU_BUOC[trangThai]}66` }}>
          {trangThai === "xong" ? <FaCheck /> : so}
        </span>
      </span>
      <span className="mx-1.5 mt-1.5 flex min-h-[48px] w-[calc(100%-12px)] flex-col items-center justify-center rounded-xl px-2 py-1 text-center leading-tight transition group-hover:brightness-[0.98]"
        style={{ background: dang ? "#E1ECFC" : "#EEF3FA" }}>
        {dang ? (
          <span className="text-[15px] font-bold" style={{ color: C.title }}>{title}</span>
        ) : (
          <>
            <span className="text-[13px] font-medium" style={{ color: C.title }}>{title}</span>
            <span className="text-[13px]" style={{ color: C.text }}>{sub}</span>
          </>
        )}
      </span>
    </button>
  );
}

function OTongQuan({ icon, label, value, color, bg }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: bg }}>
      <span className="text-[30px]" style={{ color }}>{icon}</span>
      <div>
        <div className="text-[14px] font-semibold" style={{ color: C.text }}>{label}</div>
        <div className="text-[26px] font-extrabold leading-tight tabular-nums" style={{ color: C.title }}>{value}</div>
      </div>
    </div>
  );
}

const MUC = {
  ok: { icon: <FaCircleCheck />, color: C.success },
  warn: { icon: <FaTriangleExclamation />, color: "#E8A10C" },
  error: { icon: <FaCircleXmark />, color: C.danger },
};

export default function TienDoLop() {
  const { id } = useParams();
  const lopId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const now = useNow();
  const refs = { s1: useRef(null), s2: useRef(null), s3: useRef(null), s4: useRef(null) };
  const [loc, setLoc] = useState({ search: "", co_so: undefined, hang: undefined, nhom: undefined });
  const [page, setPage] = useState({ page: 1, limit: 8 });
  const [checked, setChecked] = useState([]);
  const [nhomModal, setNhomModal] = useState({ open: false, nhom: null });
  const [xemNhom, setXemNhom] = useState(null);
  const [xemBaoCao, setXemBaoCao] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ghiChu, setGhiChu] = useState("");
  const [view, setView] = useState(null); // "b1" danh sách HV · "b2" ghép GV – xe · "tong_quan" bước 3–4

  const { data: res, isLoading, isFetching, error } = useQuery({ queryKey: ["td-lop", lopId], queryFn: () => getTdLop(lopId), enabled: !!lopId, staleTime: 0 });
  const ct = res?.data;
  const lop = ct?.lop;
  const { data: gyRes } = useQuery({ queryKey: ["td-goi-y", lop?.hang], queryFn: () => getTdGoiY(lop.hang), enabled: !!lop, staleTime: 5 * 60 * 1000 });
  const goiY = gyRes?.data;

  useEffect(() => { setGhiChu(lop?.ghi_chu_tien_do || ""); }, [lop?.id, lop?.ghi_chu_tien_do]);
  // Mở lớp đã xác thực -> vào thẳng tổng quan
  useEffect(() => {
    if (lop && view === null) setView(lop.xac_thuc_at ? "tong_quan" : (ct.nhom || []).length ? "b2" : "b1");
  }, [lop, view, ct]);

  const hv = useMemo(() => ct?.hoc_vien || [], [ct]);
  const nhom = useMemo(() => ct?.nhom || [], [ct]);
  const nhomCua = useMemo(() => new Map(nhom.map((n) => [n.id, n])), [nhom]);
  const daXacThuc = !!lop?.xac_thuc_at;
  const rows = useMemo(() => {
    const q = loc.search.trim().toLowerCase();
    return hv.filter((h) =>
      (!q || [h.ho_ten, h.cccd, h.dien_thoai, h.ma_ho_so].some((v) => String(v || "").toLowerCase().includes(q))) &&
      (!loc.co_so || h.co_so === loc.co_so) &&
      (!loc.hang || h.hang === loc.hang) &&
      (!loc.nhom || (loc.nhom === "chua" ? !h.nhom_id : !!h.nhom_id)));
  }, [hv, loc]);
  const soTrang = Math.max(1, Math.ceil(rows.length / page.limit));
  const trang = Math.min(page.page, soTrang);
  const rowsTrang = rows.slice((trang - 1) * page.limit, trang * page.limit);
  const baoCao = useMemo(() => dsBaoCao(ct), [ct]);

  const lamMoi = () => qc.invalidateQueries({ queryKey: ["td-lop", lopId] });
  const goi = async (fn, ok) => {
    setBusy(true);
    try {
      await fn();
      if (ok) message.success(ok);
      lamMoi();
      return true;
    } catch (e) {
      message.error(errMsg(e, "Thao tác thất bại"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <div className="py-24 text-center"><Spin size="large" /></div>;
  if (error || !lop) return <Empty className="py-24" description={errMsg(error, "Không tìm thấy lớp")} />;

  const tq = ct.tong_quan;
  const conLai = tq.tong_hv - tq.da_ghep;
  const pct = tq.tong_hv ? Math.round((tq.da_ghep / tq.tong_hv) * 100) : 0;
  const nhomDu = nhom.length > 0 && conLai === 0 && nhom.every((n) => n.giao_vien && (n.xe || !ct.bat_buoc_xe));
  const buoc = [
    hv.length ? "xong" : "dang",
    nhomDu ? "xong" : hv.length ? "dang" : "cho",
    daXacThuc ? "xong" : nhomDu || view === "tong_quan" ? "dang" : "cho",
    daXacThuc ? "xong" : "cho",
  ];
  // Đang ở màn làm việc thì bước 3 chưa "đang"; ở màn tổng quan thì bước 1–2 hiện như đã qua
  if (view !== "tong_quan" && buoc[2] === "dang") buoc[2] = "cho";
  const buocXem = view === "tong_quan" ? (daXacThuc ? 3 : 2) : view === "b2" ? 1 : 0;
  // Mỗi bước là 1 màn riêng: 1 = danh sách học viên, 2 = ghép giáo viên – xe, 3/4 = tổng quan
  const cuon = (k) => {
    setView(k === "s1" ? "b1" : k === "s2" ? "b2" : "tong_quan");
    refs.s1.current?.closest(".ant-layout-content, main")?.scrollTo?.({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const laB2 = view === "b2";
  const soThang = lop.ngay_khai_giang && lop.ngay_ket_thuc ? (dayjs(lop.ngay_ket_thuc).diff(dayjs(lop.ngay_khai_giang), "day") / 30).toFixed(1).replace(".0", "") : null;
  const ttLop = daXacThuc ? { label: "Đã xác thực", bg: "#DCF5E5", color: C.success } : lop.khai_giang_at ? { label: "Đang triển khai", bg: "#DCF5E5", color: C.success } : { label: "Chưa khai giảng", bg: "#FFEBD6", color: "#E8730C" };

  const tuDong = () => goi(() => tdTuDongGhep(lopId), "Đã ghép đề xuất — kiểm tra lại giáo viên / xe từng nhóm");
  const xoaNhom = (n) => Modal.confirm({
    title: `Xoá nhóm ${n.stt}?`, content: `${n.so_hv} học viên trong nhóm sẽ về trạng thái chưa ghép.`, okText: "Xoá", okButtonProps: { danger: true },
    onOk: () => goi(() => tdXoaNhom(lopId, n.id), "Đã xoá nhóm"),
  });
  const ganNhom = async (nhomId) => {
    if (await goi(() => tdGanNhom(lopId, checked, nhomId), nhomId ? `Đã đưa ${checked.length} học viên vào nhóm` : "Đã bỏ khỏi nhóm")) setChecked([]);
  };
  const xacThuc = () => {
    if (daXacThuc) {
      return Modal.confirm({ title: "Bỏ xác thực dữ liệu?", content: "Bỏ xác thực để sửa lại nhóm / giáo viên / xe.", okText: "Bỏ xác thực", onOk: () => goi(() => tdXacThuc(lopId, true), "Đã bỏ xác thực") });
    }
    if (!ct.du_dieu_kien_xac_thuc) {
      return Modal.warning({
        title: "Chưa xác thực được",
        content: <ul className="mt-2 list-disc pl-5">{ct.canh_bao.filter((c) => c.muc !== "ok").map((c, i) => <li key={i}>{c.text}</li>)}</ul>,
      });
    }
    Modal.confirm({ title: `Xác thực dữ liệu lớp ${tenLop(lop)}?`, content: "Sau khi xác thực, dữ liệu lớp được khoá để in báo cáo gửi Cục.", okText: "Xác thực", onOk: () => goi(() => tdXacThuc(lopId), "Đã xác thực dữ liệu") });
  };
  const luuThongTin = (sua) => goi(() => tdLuuThongTin(lopId, { ngay_ket_thuc: lop.ngay_ket_thuc, ghi_chu_tien_do: ghiChu, ...sua }));

  const columns = [
    { title: "STT", width: 52, align: "center", render: (_, __, i) => (trang - 1) * page.limit + i + 1 },
    { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 115 },
    { title: "Họ và tên", dataIndex: "ho_ten", width: 160, ellipsis: true },
    { title: "Ngày sinh", dataIndex: "ngay_sinh", width: 100, align: "center", render: (v) => fmtDate(v) },
    { title: "CCCD/CMND", dataIndex: "cccd", width: 125 },
    { title: "SĐT", dataIndex: "dien_thoai", width: 110 },
    { title: "Địa chỉ", dataIndex: "dia_chi", width: 150, ellipsis: true },
    { title: "Nhóm", width: 72, align: "center", render: (_, h) => (h.nhom_id ? <b style={{ color: C.sidebar }}>{nhomCua.get(h.nhom_id)?.stt}</b> : <span style={{ color: C.sub }}>—</span>) },
    { title: "Trạng thái", width: 120, align: "center", render: () => <span className="rounded-md px-2 py-0.5 text-[12px] font-bold" style={{ background: "#DCF5E5", color: C.success }}>Đủ điều kiện</span> },
  ];
  const navBtn = "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-[12px] disabled:opacity-40";

  return (
    <div className="relative -m-4 flex min-h-[calc(100vh-64px)] flex-col gap-3.5 overflow-hidden px-4 pb-5 pt-3 sm:px-5"
      style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 45%, ${C.bg} 100%)` }}>
      <img src={banner} alt="" aria-hidden
        className="pointer-events-none absolute -top-[18px] left-1/2 hidden h-[130px] w-auto max-w-none -translate-x-1/2 select-none lg:block"
        style={{ WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 85%, transparent 100%)", maskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 85%, transparent 100%)" }} />

      {/* Tiêu đề */}
      <div className="relative flex min-h-[64px] flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Tooltip title="Quay lại Khai giảng">
            <button type="button" onClick={() => navigate("/khai-giang")} aria-label="Quay lại"
              className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white text-[24px]" style={{ boxShadow: SHADOW, color: C.primary }}>
              <FaHouse />
            </button>
          </Tooltip>
          <div>
            <div className="text-[26px] font-extrabold leading-tight" style={{ color: C.title }}>Quản lý tiến độ đào tạo</div>
            <div className="text-[15px]" style={{ color: C.text }}>Theo dõi, phân công giáo viên – xe và quản lý lớp học</div>
          </div>
        </div>
        <button type="button" onClick={() => navigate("/khai-giang")} className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[14px] font-semibold"
          style={{ borderColor: C.border, color: C.sidebar }}>
          <FaArrowLeft /> Khai giảng
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white text-[20px]" style={{ boxShadow: SHADOW, color: C.primary }}><FaRegCalendarDays /></span>
          <div className="leading-tight" style={{ color: C.title }}>
            <div className="text-[14px]">{WEEKDAYS[now.day()]}, {now.format("DD/MM/YYYY")}</div>
            <div className="text-[22px] font-extrabold tabular-nums">{now.format("HH:mm:ss")}</div>
          </div>
        </div>
      </div>

      {/* Các bước */}
      <div className="relative flex items-start">
        {[
          { k: "s1", title: "Danh sách học viên", sub: "đã được lựa chọn" },
          { k: "s2", title: "Ghép GV - Xe", sub: `(${ct.hv_moi_nhom} học viên/1 GV-Xe)` },
          { k: "s3", title: "Tổng quan khóa học", sub: "và biên bản báo cáo" },
          { k: "s4", title: "Xác thực và gửi Cục", sub: "(in báo cáo)" },
        ].map((b, i) => (
          <Buoc key={b.k} so={i + 1} title={b.title} sub={b.sub} trangThai={buoc[i]} chon={i === buocXem} onClick={() => cuon(b.k)}
            trai={i > 0 ? noiTrai(buoc[i - 1], buoc[i]) : null} phai={i < 3 ? noiPhai(buoc[i], buoc[i + 1]) : null} />
        ))}
      </div>

      {view !== "tong_quan" ? (
      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* 1. Danh sách học viên */}
          <div ref={refs.s1} className={CARD} style={{ ...cardStyle, order: laB2 ? 2 : 1 }}>
            <SectionHead so={laB2 ? null : 1} icon={<FaUsers />} extra={
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-bold" style={{ color: C.success }}>
                <FaCircleCheck /> Đã ghép: {tq.da_ghep} / {tq.tong_hv} HV
              </span>}>
              {laB2 ? "Danh sách học viên — tick chọn rồi đưa vào nhóm" : "Danh sách học viên đã được lựa chọn"}
            </SectionHead>
            <div className="p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Input allowClear placeholder="Tìm kiếm theo tên, CCCD, SĐT..." prefix={<FaMagnifyingGlass style={{ color: C.sub }} />} className="!h-10 min-w-[220px] flex-1"
                  value={loc.search} onChange={(e) => { setLoc((l) => ({ ...l, search: e.target.value })); setPage((p) => ({ ...p, page: 1 })); }} />
                <Select allowClear placeholder="Tất cả cơ sở" value={loc.co_so} onChange={(v) => setLoc((l) => ({ ...l, co_so: v }))} className="!h-10 w-[140px]"
                  options={[...new Set(hv.map((h) => h.co_so).filter(Boolean))].map((v) => ({ value: v, label: v }))} />
                <Select allowClear placeholder="Tất cả hạng" value={loc.hang} onChange={(v) => setLoc((l) => ({ ...l, hang: v }))} className="!h-10 w-[120px]"
                  options={[...new Set(hv.map((h) => h.hang).filter(Boolean))].map((v) => ({ value: v, label: `Hạng ${v}` }))} />
                <Select allowClear placeholder="Tất cả trạng thái" value={loc.nhom} onChange={(v) => setLoc((l) => ({ ...l, nhom: v }))} className="!h-10 w-[150px]"
                  options={[{ value: "da", label: "Đã ghép nhóm" }, { value: "chua", label: "Chưa ghép nhóm" }]} />
                <Tooltip title="Làm mới">
                  <button type="button" onClick={lamMoi} aria-label="Làm mới" className="flex h-10 w-11 items-center justify-center rounded-lg border bg-white text-[16px]" style={{ borderColor: C.border, color: C.primary }}>
                    <FaArrowsRotate className={isFetching ? "animate-spin" : ""} />
                  </button>
                </Tooltip>
              </div>
              {checked.length > 0 && !daXacThuc && (
                <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-[14px]" style={{ background: C.soft, color: C.title }}>
                  Đã chọn <b>{checked.length}</b> học viên:
                  <Select size="small" placeholder="Đưa vào nhóm..." className="w-[220px]" disabled={busy} onChange={(v) => ganNhom(v)} value={null}
                    options={nhom.map((n) => ({ value: n.id, label: `Nhóm ${n.stt} — ${n.giao_vien || "chưa có GV"} (${n.so_hv} HV)` }))} />
                  <button type="button" onClick={() => ganNhom(null)} disabled={busy} className="rounded-md border bg-white px-2.5 py-0.5 font-semibold" style={{ borderColor: C.border, color: C.danger }}>Bỏ khỏi nhóm</button>
                  <button type="button" onClick={() => setChecked([])} className="ml-auto" style={{ color: C.sub }}><FaXmark /></button>
                </div>
              )}
              <Table rowKey="id" size="small" columns={columns} dataSource={rowsTrang} pagination={false} scroll={{ x: 1000 }}
                rowSelection={daXacThuc ? undefined : {
                  selectedRowKeys: checked, columnWidth: 44,
                  onChange: (keys) => { const t = rowsTrang.map((r) => r.id); setChecked((cu) => [...cu.filter((x) => !t.includes(x)), ...keys]); },
                }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Lớp chưa có học viên — xếp học viên ở màn Xếp lớp" /> }}
                components={{ header: { cell: (p) => <th {...p} style={{ ...p.style, background: C.bg2, color: C.title, fontWeight: 700, fontSize: 13 }} /> } }}
                className="[&_.ant-table-tbody>tr.ant-table-row>td]:!py-[6px] [&_.ant-table-tbody>tr.ant-table-row>td]:!text-[14px] [&_.ant-table-tbody>tr.ant-table-row>td]:!text-[#263B5E]" />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[14px]" style={{ color: C.text }}>Hiển thị {rows.length ? (trang - 1) * page.limit + 1 : 0} - {Math.min(trang * page.limit, rows.length)} trong tổng số {rows.length} học viên</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button type="button" className={navBtn} style={{ borderColor: C.border, color: C.title }} disabled={trang <= 1} onClick={() => setPage((p) => ({ ...p, page: 1 }))}><FaAnglesLeft /></button>
                  <Pagination size="small" current={trang} pageSize={page.limit} total={rows.length} showSizeChanger={false} onChange={(p) => setPage((s) => ({ ...s, page: p }))}
                    className="[&_.ant-pagination-item-active]:!border-[#0878F9] [&_.ant-pagination-item-active]:!bg-[#0878F9] [&_.ant-pagination-item-active_a]:!text-white" />
                  <button type="button" className={navBtn} style={{ borderColor: C.border, color: C.title }} disabled={trang >= soTrang} onClick={() => setPage((p) => ({ ...p, page: soTrang }))}><FaAnglesRight /></button>
                  <Select size="small" value={page.limit} onChange={(l) => setPage({ page: 1, limit: l })} className="w-[96px]" options={[8, 20, 50, 100].map((n) => ({ value: n, label: `${n}/trang` }))} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ghép giáo viên và xe */}
          <div ref={refs.s2} className={CARD} style={{ ...cardStyle, order: 1, display: laB2 ? undefined : "none" }}>
            <SectionHead so={2} icon={<FaUsers />} extra={!daXacThuc && (
              <>
                <button type="button" onClick={() => setNhomModal({ open: true, nhom: null })} className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[13px] font-bold text-white hover:bg-white/30">
                  <FaPlus /> Thêm nhóm
                </button>
                <button type="button" onClick={tuDong} disabled={busy || !conLai} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-bold disabled:opacity-60" style={{ color: C.sidebar }}>
                  {busy ? <Spin size="small" /> : <FaWandMagicSparkles />} Tự động ghép đề xuất
                </button>
              </>)}>
              Ghép giáo viên và xe ({ct.hv_moi_nhom} học viên/1 GV - Xe)
            </SectionHead>
            <div className="flex gap-3 overflow-x-auto p-3">
              {nhom.length ? nhom.map((n) => {
                const du = n.giao_vien && (n.xe || !ct.bat_buoc_xe) && n.so_hv > 0;
                return (
                  <div key={n.id} className="flex w-[200px] shrink-0 flex-col gap-1.5 rounded-xl border p-3" style={{ borderColor: du ? "#bfe6cc" : C.border, background: "#fff", boxShadow: SHADOW }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-extrabold" style={{ color: C.title }}>Nhóm {n.stt}</span>
                      <span className="text-[12px]" style={{ color: C.sub }}>{n.so_hv} HV</span>
                      <span className="ml-auto text-[16px]" style={{ color: du ? C.success : "#E8A10C" }}>{du ? <FaCircleCheck /> : <FaTriangleExclamation />}</span>
                      {!daXacThuc && (
                        <Dropdown trigger={["click"]} menu={{ items: [
                          { key: "s", icon: <FaPen />, label: "Sửa giáo viên / xe", onClick: () => setNhomModal({ open: true, nhom: n }) },
                          { key: "x", icon: <FaTrashCan />, danger: true, label: "Xoá nhóm", onClick: () => xoaNhom(n) },
                        ] }}>
                          <button type="button" aria-label="Thao tác nhóm" className="text-[14px]" style={{ color: C.sub }}><FaEllipsis /></button>
                        </Dropdown>
                      )}
                    </div>
                    <div className="flex items-center gap-2 truncate text-[13px]" style={{ color: n.giao_vien ? C.title : C.danger }}><FaUser style={{ color: C.primary }} />{n.giao_vien || "Chưa có giáo viên"}</div>
                    <div className="flex items-center gap-2 truncate text-[13px]" style={{ color: n.xe ? C.title : ct.bat_buoc_xe ? C.danger : C.sub }}>
                      <FaCarSide style={{ color: C.primary }} />{n.xe || (ct.bat_buoc_xe ? "Chưa có xe" : "Mô tô — không cần xe")}
                    </div>
                    <button type="button" onClick={() => setXemNhom(n)} className="mt-1 rounded-lg py-1 text-[13px] font-bold" style={{ background: C.soft, color: C.sidebar }}>Xem DS</button>
                  </div>
                );
              }) : (
                <div className="w-full py-6 text-center text-[14px]" style={{ color: C.sub }}>
                  Chưa có nhóm — bấm <b>Tự động ghép đề xuất</b> hoặc <b>Thêm nhóm</b>
                </div>
              )}
            </div>
          </div>

          {/* Sang bước kế tiếp */}
          <button type="button" onClick={() => cuon(laB2 ? "s3" : "s2")}
            className="flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left text-white transition hover:brightness-105"
            style={{ order: 3, background: `linear-gradient(110deg, ${C.sidebar}, ${C.primary})`, boxShadow: SHADOW }}>
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[15px] font-extrabold" style={{ color: C.sidebar }}>{laB2 ? 3 : 2}</span>
              <span className="leading-tight">
                <span className="block text-[17px] font-bold">{laB2 ? "Tiếp tục: Tổng quan khoá học & báo cáo" : "Tiếp tục: Ghép giáo viên – xe"}</span>
                <span className="block text-[13px] opacity-90">
                  {laB2
                    ? nhomDu ? "Đã ghép xong — xem tổng quan, xác thực và in báo cáo" : `Còn ${conLai} học viên chưa ghép / nhóm chưa đủ GV – xe — vẫn xem được tổng quan`
                    : `Chia ${tq.tong_hv} học viên thành nhóm ${ct.hv_moi_nhom} người, mỗi nhóm 1 giáo viên – 1 xe`}
                </span>
              </span>
            </span>
            <FaChevronRight className="text-[20px]" />
          </button>
        </div>

        {/* Cột phải */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className={CARD} style={cardStyle}>
            <SectionHead icon={<FaGraduationCap />}>Thông tin khoá học</SectionHead>
            <div className="flex flex-col gap-2.5 p-4 text-[15px]" style={{ color: C.text }}>
              <div className="flex items-center gap-2">
                <span className="min-w-0 truncate text-[22px] font-extrabold" style={{ color: C.title }} title={tenLop(lop)}>{tenLop(lop)}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: ttLop.bg, color: ttLop.color }}>
                  {daXacThuc ? <FaLock /> : <FaPlay />} {ttLop.label}
                </span>
              </div>
              <div className="flex items-center gap-2"><FaRegCalendarDays style={{ color: C.primary }} />Ngày khai giảng: <b style={{ color: C.title }}>{fmtDate(lop.ngay_khai_giang) || "—"}</b></div>
              <div className="flex flex-wrap items-center gap-2">
                <FaRegCalendarDays style={{ color: C.primary }} />Dự kiến kết thúc:
                <DatePicker size="small" format="DD/MM/YYYY" value={lop.ngay_ket_thuc ? dayjs(lop.ngay_ket_thuc) : null} placeholder="Chọn ngày" disabled={daXacThuc}
                  onChange={(v) => luuThongTin({ ngay_ket_thuc: v ? v.format("YYYY-MM-DD") : null })} className="w-[130px] [&_input]:!font-bold" />
                {soThang && <span>({soThang} tháng)</span>}
              </div>
              <div className="flex items-center gap-2"><FaUsers style={{ color: C.primary }} />Sĩ số lớp: <b style={{ color: C.title }}>{tq.tong_hv} học viên</b></div>
              <div className="flex items-center gap-2"><FaUserCheck style={{ color: C.success }} />Đã ghép: <b style={{ color: C.title }}>{tq.da_ghep} học viên</b></div>
              <div className="flex items-center gap-2"><FaClock style={{ color: C.primary }} />Còn lại: <b style={{ color: C.title }}>{conLai} học viên</b></div>
              <div className="flex items-center gap-3">
                <Progress percent={pct} showInfo={false} strokeColor={C.success} railColor={C.border} size={["100%", 12]} className="!m-0 flex-1" />
                <span className="text-[18px] font-extrabold" style={{ color: C.success }}>{pct}%</span>
              </div>
            </div>
          </div>

          <div className={CARD} style={cardStyle}>
            <SectionHead icon={<FaBell />}>Cảnh báo &amp; Ghi chú</SectionHead>
            <div className="flex flex-col gap-2 p-4">
              {ct.canh_bao.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.title }}>
                  <span className="mt-0.5 text-[16px]" style={{ color: MUC[c.muc].color }}>{MUC[c.muc].icon}</span>{c.text}
                </div>
              ))}
              <Input.TextArea rows={3} placeholder="Ghi chú (nếu có)..." value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} maxLength={1000}
                onBlur={() => ghiChu !== (lop.ghi_chu_tien_do || "") && luuThongTin({ ghi_chu_tien_do: ghiChu })} className="mt-1" />
            </div>
          </div>

        </div>
      </div>
      ) : (
        <TongQuanLop ct={ct} ghiChu={ghiChu} setGhiChu={setGhiChu} busy={busy} onXacThuc={xacThuc} onQuayLai={() => cuon("s2")}
          onLuuGhiChu={() => ghiChu !== (lop.ghi_chu_tien_do || "") && luuThongTin({ ghi_chu_tien_do: ghiChu })} />
      )}

      <NhomModal open={nhomModal.open} lopId={lopId} hang={lop.hang} nhom={nhomModal.nhom} goiY={goiY} batBuocXe={ct.bat_buoc_xe}
        onClose={() => setNhomModal({ open: false, nhom: null })} onSaved={() => { setNhomModal({ open: false, nhom: null }); lamMoi(); }} />

      <Modal open={!!xemNhom} onCancel={() => setXemNhom(null)} footer={null} width={640} destroyOnHidden
        title={xemNhom ? `Nhóm ${xemNhom.stt} — ${xemNhom.giao_vien || "chưa có giáo viên"}${xemNhom.xe ? ` · ${xemNhom.xe}` : ""}` : ""}>
        {xemNhom && (
          <Table rowKey="id" size="small" pagination={false} dataSource={hv.filter((h) => h.nhom_id === xemNhom.id)}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nhóm chưa có học viên — tick học viên ở mục 1 rồi chọn 'Đưa vào nhóm'" /> }}
            columns={[
              { title: "STT", width: 50, align: "center", render: (_, __, i) => i + 1 },
              { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 120 },
              { title: "Họ và tên", dataIndex: "ho_ten" },
              { title: "Ngày sinh", dataIndex: "ngay_sinh", width: 100, render: (v) => fmtDate(v) },
              ...(daXacThuc ? [] : [{
                title: "", width: 40, align: "center",
                render: (_, h) => (
                  <Tooltip title="Bỏ khỏi nhóm">
                    <button type="button" aria-label="Bỏ khỏi nhóm" style={{ color: C.danger }} onClick={() => goi(() => tdGanNhom(lopId, [h.id], null), "Đã bỏ khỏi nhóm")}><FaXmark /></button>
                  </Tooltip>
                ),
              }]),
            ]} />
        )}
      </Modal>

      <Modal open={xemBaoCao} onCancel={() => setXemBaoCao(false)} width="min(1000px, 96vw)" destroyOnHidden title={`Xem trước báo cáo lớp ${tenLop(lop)}`}
        footer={[
          <span key="t" className="mr-auto text-[13px]" style={{ color: C.text }}>
            {baoCao.map((b) => <span key={b.key} className="mr-3 inline-flex items-center gap-1">{b.san_sang ? <FaCircleCheck style={{ color: C.success }} /> : <FaTriangleExclamation style={{ color: "#E8A10C" }} />}{b.ten}</span>)}
          </span>,
        ]}>
        <iframe title="Xem trước báo cáo" className="h-[70vh] w-full rounded border" srcDoc={baoCaoLopHtml(ct)} />
      </Modal>
    </div>
  );
}
