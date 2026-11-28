import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dropdown, Empty, Input, Modal, Pagination, Progress, Select, Spin, Table, Tooltip, message } from "antd";
import {
  FaHouse, FaRegCalendarDays, FaUsers, FaUserGroup, FaPlus, FaMagnifyingGlass, FaArrowsRotate, FaCircleCheck,
  FaGraduationCap, FaTrashCan, FaLocationDot, FaQrcode, FaRightLeft, FaPrint, FaRotateLeft, FaCheck, FaCircleInfo,
  FaEllipsisVertical, FaPen, FaXmark, FaAnglesLeft, FaAnglesRight, FaBookOpen, FaLayerGroup, FaCarSide,
} from "react-icons/fa6";
import { getXlDuDieuKien, getXlLop, getXlChiTietLop, xlThemVaoLop, xlBoKhoiLop, xlVaoKhoa, xlXoaLop, errMsg } from "../../apis/apiTiepSinh";
import { WEEKDAYS, fmtDate, useNow } from "../tiep-sinh/tiepSinhShared";
import { inHtml } from "../ke-toan/phieuThu";
import banner from "../../assets/ke-toan-banner.webp";
import LopModal from "./LopModal";
import QuetQrModal from "./QuetQrModal";
import { C, SHADOW, HEAD, TABLE_HEAD, tenLop, danhSachLopHtml } from "./xepLopShared";

const CARD = "rounded-[18px] border bg-white";
const cardStyle = { borderColor: C.border, boxShadow: SHADOW };

function Nut({ icon, title, sub, style, onClick, disabled, className = "" }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`flex h-[64px] items-center justify-center gap-3 rounded-2xl border px-4 transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${className}`}
      style={{ boxShadow: SHADOW, ...style }}>
      <span className="text-[26px]">{icon}</span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[16px] font-bold">{title}</span>
        {sub && <span className="text-[13px] font-medium opacity-90">{sub}</span>}
      </span>
    </button>
  );
}

function ThongKe({ icon, color, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-white px-5 py-3" style={{ borderColor: C.border, boxShadow: SHADOW }}>
      <span className="text-[36px]" style={{ color }}>{icon}</span>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold" style={{ color: C.text }}>{label}</div>
        <div className="text-[28px] font-extrabold leading-tight tabular-nums" style={{ color: C.title }}>{Number(value || 0).toLocaleString("vi-VN")}</div>
      </div>
    </div>
  );
}

function SoLieu({ value, label, bg, color }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl py-2" style={{ background: bg }}>
      <span className="text-[28px] font-extrabold leading-none tabular-nums" style={{ color }}>{value}</span>
      <span className="mt-1 text-[13px] font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

export default function XepLopHocVien() {
  const qc = useQueryClient();
  const now = useNow();
  const [lopId, setLopId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [loc, setLoc] = useState({ search: "", co_so: undefined, hang: undefined, dau_moi: undefined });
  const [page, setPage] = useState({ page: 1, limit: 10 });
  const [checked, setChecked] = useState([]);
  const [lopModal, setLopModal] = useState({ open: false, lop: null });
  const [qrOpen, setQrOpen] = useState(false);
  const [maQuet, setMaQuet] = useState(null); // mã quét được ngay trên trang (máy quét cầm tay)
  const [saving, setSaving] = useState(false);

  // Lớp dự kiến
  const { data: lopRes, isLoading: lopLoading } = useQuery({ queryKey: ["xl-lop"], queryFn: () => getXlLop(), staleTime: 0 });
  const dsLop = useMemo(() => lopRes?.data || [], [lopRes]);
  useEffect(() => {
    if (dsLop.length && !dsLop.some((l) => l.id === lopId)) setLopId(dsLop[0].id);
    if (!dsLop.length && lopId) setLopId(null);
  }, [dsLop, lopId]);
  const lop = dsLop.find((l) => l.id === lopId) || null;

  // Đổi lớp -> lọc sẵn theo hạng của lớp, bỏ các dòng đang tick
  useEffect(() => {
    setLoc((l) => ({ ...l, hang: lop?.hang || undefined }));
    setPage((p) => ({ ...p, page: 1 }));
    setChecked([]);
  }, [lop?.id, lop?.hang]);

  const { data: ctRes, isFetching: ctLoading } = useQuery({
    queryKey: ["xl-lop", lopId], queryFn: () => getXlChiTietLop(lopId), enabled: !!lopId, staleTime: 0,
  });
  const trongLop = ctRes?.data?.lop?.id === lopId ? ctRes.data.hoc_vien : [];

  // Học viên đủ điều kiện (kế toán đã thu đủ), chưa xếp lớp
  const params = useMemo(() => ({ ...loc, search: loc.search || undefined, ...page }), [loc, page]);
  const { data: dsRes, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["xl-du-dk", params], queryFn: () => getXlDuDieuKien(params), staleTime: 0, refetchInterval: 30000, placeholderData: keepPreviousData,
  });
  const dd = dsRes?.data;
  const rows = dd?.data || [];
  const total = dd?.pagination?.total || 0;
  const soTrang = Math.max(1, Math.ceil(total / page.limit));
  const boLoc = dd?.bo_loc || { co_so: [], hang: [], dau_moi: [] };
  const tk = dd?.thong_ke || {};

  // Máy quét cầm tay "gõ" mã rất nhanh rồi Enter: quét ở bất kỳ đâu trên trang -> mở popup xử lý luôn
  const quetRef = useRef({ buf: "", t: 0, nhanh: 0 });
  const trangThaiRef = useRef({});
  trangThaiRef.current = { lop, qrOpen, lopModalOpen: lopModal.open };
  useEffect(() => {
    const onKey = (e) => {
      const st = trangThaiRef.current;
      if (st.qrOpen || st.lopModalOpen || e.ctrlKey || e.altKey || e.metaKey) return;
      const q = quetRef.current;
      const now = Date.now();
      if (e.key === "Enter") {
        const code = q.buf.trim();
        const laMayQuet = code.length >= 6 && q.nhanh >= code.length - 2;
        quetRef.current = { buf: "", t: 0, nhanh: 0 };
        if (!laMayQuet) return;
        e.preventDefault();
        e.stopPropagation();
        // mã đã bị gõ vào ô tìm kiếm -> trả lại nội dung cũ
        setSearchText((v) => (v.endsWith(code) ? v.slice(0, -code.length) : v));
        if (!st.lop) return message.warning("Chọn hoặc tạo lớp trước khi quét QR");
        setMaQuet({ ma: code, t: now });
        setQrOpen(true);
        return;
      }
      if (e.key.length !== 1) return;
      const gap = now - q.t;
      quetRef.current = { buf: gap > 120 ? e.key : q.buf + e.key, t: now, nhanh: gap > 120 ? 0 : q.nhanh + (gap < 50 ? 1 : 0) };
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const lamMoi = () => {
    qc.invalidateQueries({ queryKey: ["xl-lop"] });
    qc.invalidateQueries({ queryKey: ["xl-du-dk"] });
  };
  const doiLoc = (k, v) => {
    setLoc((l) => ({ ...l, [k]: v }));
    setPage((p) => ({ ...p, page: 1 }));
  };

  const conTrong = lop ? Math.max(0, lop.suc_chua - lop.si_so) : 0;
  const pct = lop ? Math.round((lop.si_so / Math.max(1, lop.suc_chua)) * 100) : 0;

  const xacNhan = async () => {
    if (!lop) return message.warning("Chưa có lớp — bấm “Tạo lớp mới” trước");
    if (!checked.length) return message.warning("Tick chọn học viên trong danh sách đủ điều kiện");
    if (checked.length > conTrong) return message.warning(`Lớp chỉ còn ${conTrong} chỗ trống`);
    setSaving(true);
    try {
      await xlThemVaoLop(lop.id, checked);
      message.success(`Đã đưa ${checked.length} học viên vào lớp ${tenLop(lop)}`);
      setChecked([]);
      lamMoi();
    } catch (e) {
      message.error(errMsg(e, "Không đưa được vào lớp"));
    } finally {
      setSaving(false);
    }
  };

  const boKhoiLop = async (ids) => {
    try {
      await xlBoKhoiLop(lop.id, ids);
      message.success("Đã bỏ khỏi lớp");
      lamMoi();
    } catch (e) {
      message.error(errMsg(e, "Không bỏ được"));
    }
  };

  const vaoKhoa = () => {
    if (!lop) return;
    if (!lop.si_so) return message.warning("Lớp chưa có học viên nào");
    Modal.confirm({
      title: `Vào khoá lớp ${tenLop(lop)}?`,
      content: (
        <div>
          Lớp có <b>{lop.si_so}</b>/{lop.suc_chua} học viên. Sau khi vào khoá, lớp được chuyển sang mục <b>Danh sách lớp</b> và
          không thêm / bớt học viên ở đây được nữa.
        </div>
      ),
      okText: "Vào khoá",
      onOk: async () => {
        try {
          await xlVaoKhoa(lop.id);
          message.success(`Lớp ${tenLop(lop)} đã vào khoá — xem ở mục Danh sách lớp`);
          lamMoi();
        } catch (e) {
          message.error(errMsg(e, "Vào khoá thất bại"));
        }
      },
    });
  };

  const xoaLop = () => {
    Modal.confirm({
      title: `Xoá lớp dự kiến ${tenLop(lop)}?`,
      content: lop.si_so ? `${lop.si_so} học viên trong lớp sẽ quay về danh sách đủ điều kiện.` : "Lớp chưa có học viên.",
      okText: "Xoá lớp",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await xlXoaLop(lop.id);
          message.success("Đã xoá lớp");
          setLopId(null);
          lamMoi();
        } catch (e) {
          message.error(errMsg(e, "Xoá lớp thất bại"));
        }
      },
    });
  };

  const columns = [
    { title: "STT", width: 52, align: "center", render: (_, __, i) => (page.page - 1) * page.limit + i + 1 },
    { title: "Mã hồ sơ", dataIndex: "ma_ho_so", width: 110 },
    { title: "Họ và tên", dataIndex: "ho_ten", width: 160, ellipsis: true },
    { title: "Ngày sinh", dataIndex: "ngay_sinh", width: 100, align: "center", render: (v) => fmtDate(v) },
    { title: "CCCD/CMND", dataIndex: "cccd", width: 125 },
    { title: "SĐT", dataIndex: "dien_thoai", width: 110 },
    { title: "Địa chỉ", dataIndex: "dia_chi", width: 150, ellipsis: true },
    { title: "Hạng", dataIndex: "hang", width: 60, align: "center" },
    { title: "Đầu mối", dataIndex: "dau_moi", width: 110, ellipsis: true },
    { title: "Ngày nộp hồ sơ", dataIndex: "ngay_nop", width: 100, align: "center", render: (v) => fmtDate(v) },
    {
      title: "Trạng thái", width: 90, align: "center", fixed: "right",
      render: () => <span className="whitespace-nowrap rounded-md px-2 py-0.5 text-[12px] font-bold" style={{ background: "#DCF5E5", color: C.success }}>Đủ ĐK</span>,
    },
  ];

  const navBtn = "flex h-8 w-8 items-center justify-center rounded-md border bg-white text-[12px] transition hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="relative -m-4 flex min-h-[calc(100vh-64px)] flex-col gap-3.5 overflow-hidden px-4 pb-5 pt-3 sm:px-5"
      style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 45%, ${C.bg} 100%)` }}>
      <img src={banner} alt="" aria-hidden
        className="pointer-events-none absolute -top-[18px] left-1/2 hidden h-[130px] w-auto max-w-none -translate-x-1/2 select-none lg:block"
        style={{ WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 85%, transparent 100%)", maskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 85%, transparent 100%)" }} />

      {/* Tiêu đề */}
      <div className="relative flex min-h-[64px] flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white text-[28px]" style={{ boxShadow: SHADOW, color: C.primary }}>
            <FaHouse />
          </span>
          <div>
            <div className="text-[26px] font-extrabold leading-tight" style={{ color: C.title }}>Quản lý xếp lớp học viên</div>
            <div className="text-[15px]" style={{ color: C.text }}>Chọn học viên đủ điều kiện để đưa vào lớp học</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white text-[20px]" style={{ boxShadow: SHADOW, color: C.primary }}>
            <FaRegCalendarDays />
          </span>
          <div className="leading-tight" style={{ color: C.title }}>
            <div className="text-[14px]">{WEEKDAYS[now.day()]}, {now.format("DD/MM/YYYY")}</div>
            <div className="text-[22px] font-extrabold tabular-nums">{now.format("HH:mm:ss")}</div>
          </div>
        </div>
      </div>

      {/* Thống kê */}
      <div className="relative grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <ThongKe icon={<FaUsers />} color={C.primary} label="Chờ xếp lớp" value={tk.chua_xep} />
        <ThongKe icon={<FaBookOpen />} color={C.success} label="Đã vào lớp" value={tk.da_vao_lop} />
        <ThongKe icon={<FaLayerGroup />} color={C.light} label="Số lớp đang học" value={tk.lop_dang_hoc} />
        <ThongKe icon={<FaCarSide />} color="#0EA5C6" label="Số lớp dự kiến" value={tk.lop_du_kien} />
        <ThongKe icon={<FaGraduationCap />} color={C.purple} label="Tổng học viên" value={tk.tong} />
      </div>

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Cột trái: bộ lọc + danh sách đủ điều kiện */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 min-w-[260px] flex-1 overflow-hidden rounded-lg border bg-white focus-within:border-[#0878F9]" style={{ borderColor: C.border }}>
              <Input variant="borderless" allowClear placeholder="Tìm kiếm theo tên, CCCD, SĐT, mã hồ sơ..." value={searchText}
                prefix={<FaMagnifyingGlass style={{ color: C.sub }} />} className="!h-full"
                onChange={(e) => { setSearchText(e.target.value); if (!e.target.value) doiLoc("search", ""); }}
                onPressEnter={() => doiLoc("search", searchText.trim())} />
            </div>
            <Select allowClear placeholder="Tất cả cơ sở" value={loc.co_so} onChange={(v) => doiLoc("co_so", v)} className="!h-10 w-[150px]"
              options={boLoc.co_so.map((v) => ({ value: v, label: v }))} />
            <Select allowClear placeholder="Tất cả hạng" value={loc.hang} onChange={(v) => doiLoc("hang", v)} className="!h-10 w-[130px]"
              options={boLoc.hang.map((v) => ({ value: v, label: `Hạng ${v}` }))} />
            <Select allowClear showSearch placeholder="Tất cả đầu mối" value={loc.dau_moi} onChange={(v) => doiLoc("dau_moi", v)} className="!h-10 w-[160px]"
              options={boLoc.dau_moi.map((v) => ({ value: v, label: v }))} />
            <button type="button" onClick={lamMoi}
              className="flex h-10 items-center gap-2 rounded-lg border bg-white px-3.5 text-[14px] font-semibold transition hover:border-blue-400"
              style={{ borderColor: C.border, color: C.sidebar }}>
              <FaArrowsRotate className={isFetching ? "animate-spin" : ""} /> Làm mới
            </button>
          </div>

          <div className={`${CARD} flex min-w-0 flex-col overflow-hidden`} style={cardStyle}>
            <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-white" style={{ background: HEAD }}>
              <span className="flex flex-1 items-center gap-2.5 text-[17px] font-bold"><FaUsers /> Danh sách học viên đủ điều kiện ({total})</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-bold" style={{ color: C.success }}>
                <FaCircleCheck /> Đã đóng đủ học phí
              </span>
            </div>
            <div className="p-3">
              <Table rowKey="id" size="small" columns={columns} dataSource={rows} pagination={false}
                loading={isLoading || (isFetching && isPlaceholderData)} scroll={{ x: 1200 }}
                rowSelection={{
                  selectedRowKeys: checked, columnWidth: 44, fixed: true,
                  onChange: (keys) => {
                    const trang = rows.map((r) => r.id);
                    setChecked((cu) => [...cu.filter((id) => !trang.includes(id)), ...keys]);
                  },
                }}
                onRow={(r) => ({
                  onClick: () => setChecked((cu) => (cu.includes(r.id) ? cu.filter((x) => x !== r.id) : [...cu, r.id])),
                  className: "cursor-pointer",
                })}
                rowClassName={(r) => (checked.includes(r.id) ? "[&>td]:!bg-[#EAF3FF]" : "")}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có học viên đã đóng đủ học phí (hoặc đã xếp lớp hết)" /> }}
                components={{
                  header: {
                    cell: (props) => <th {...props} style={{ ...props.style, background: TABLE_HEAD, color: "#fff", fontWeight: 600, fontSize: 13, padding: "7px 6px", borderColor: TABLE_HEAD, borderInlineEnd: "1px solid rgba(255,255,255,0.18)" }} />,
                  },
                }}
                className="overflow-hidden rounded-xl [&_.ant-table-tbody>tr.ant-table-row>td]:!py-[8px] [&_.ant-table-tbody>tr.ant-table-row>td]:!text-[14px] [&_.ant-table-tbody>tr.ant-table-row>td]:!text-[#263B5E]" />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-[14px]" style={{ color: C.text }}>
                  Hiển thị {total ? (page.page - 1) * page.limit + 1 : 0} - {Math.min(page.page * page.limit, total)} trong tổng số {total} hồ sơ
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button type="button" className={navBtn} style={{ color: C.title, borderColor: C.border }} disabled={page.page <= 1} onClick={() => setPage((p) => ({ ...p, page: 1 }))}><FaAnglesLeft /></button>
                  <Pagination size="small" current={page.page} pageSize={page.limit} total={total} showSizeChanger={false}
                    onChange={(p) => setPage((s) => ({ ...s, page: p }))}
                    className="[&_.ant-pagination-item]:!h-8 [&_.ant-pagination-item]:!min-w-8 [&_.ant-pagination-item]:!rounded-md [&_.ant-pagination-item]:!border-[#D7E5F8] [&_.ant-pagination-item]:!leading-[30px] [&_.ant-pagination-item-active]:!border-[#0878F9] [&_.ant-pagination-item-active]:!bg-[#0878F9] [&_.ant-pagination-item-active_a]:!text-white" />
                  <button type="button" className={navBtn} style={{ color: C.title, borderColor: C.border }} disabled={page.page >= soTrang} onClick={() => setPage((p) => ({ ...p, page: soTrang }))}><FaAnglesRight /></button>
                  <Select value={page.limit} onChange={(l) => setPage({ page: 1, limit: l })} className="ml-1 w-[104px]"
                    options={[10, 20, 50, 100].map((n) => ({ value: n, label: `${n} / trang` }))} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: khoá học + học viên trong lớp */}
        <div className="flex min-w-0 flex-col gap-3">
          {/* Chọn lớp dự kiến + tạo lớp */}
          <div className="flex items-center gap-2">
            <Select value={lop ? lop.id : undefined} onChange={setLopId} loading={lopLoading} placeholder="Chưa có lớp dự kiến"
              className="h-11 min-w-0 flex-1 [&_.ant-select-selector]:!rounded-xl" popupMatchSelectWidth={false}
              options={dsLop.map((l) => ({ value: l.id, label: l }))}
              labelRender={({ value }) => {
                const l = dsLop.find((x) => x.id === value);
                return l ? (
                  <span className="flex items-center gap-2 font-bold" style={{ color: C.title }}>
                    <FaUserGroup style={{ color: C.primary }} /> {tenLop(l)}{l.ngay_khai_giang ? ` (${fmtDate(l.ngay_khai_giang)})` : ""}
                    <span className="ml-auto rounded-full px-2 text-[12px] tabular-nums" style={{ background: C.bg, color: C.text }}>{l.si_so}/{l.suc_chua}</span>
                  </span>
                ) : null;
              }}
              optionRender={({ data }) => {
                const l = data.label;
                return (
                  <span className="flex items-center gap-3">
                    <b style={{ color: C.title }}>{tenLop(l)}</b>
                    <span style={{ color: C.sub }}>{l.ngay_khai_giang ? fmtDate(l.ngay_khai_giang) : ""}</span>
                    <span className="ml-auto rounded-full px-2 text-[12px] tabular-nums" style={{ background: C.bg, color: C.text }}>{l.si_so}/{l.suc_chua}</span>
                  </span>
                );
              }} />
            <button type="button" onClick={() => setLopModal({ open: true, lop: null })}
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-[15px] font-bold text-white transition hover:brightness-105"
              style={{ background: "linear-gradient(180deg, #2fc46c, #148a3f)", color: "#fff", boxShadow: "0 6px 14px rgba(22,163,74,0.3)" }}>
              <FaPlus /> Tạo lớp mới
            </button>
          </div>
          <div className={`${CARD} p-4`} style={cardStyle}>
            {lop ? (
              <>
                <div className="mb-3 flex items-center gap-2.5">
                  <FaGraduationCap className="text-[26px]" style={{ color: C.sidebar }} />
                  <span className="flex-1 text-[18px] font-bold" style={{ color: C.title }}>Khóa học: Lái xe hạng {tenLop(lop)}</span>
                  <Dropdown trigger={["click"]} menu={{
                    items: [
                      { key: "sua", icon: <FaPen />, label: "Sửa lớp", onClick: () => setLopModal({ open: true, lop }) },
                      { key: "xoa", icon: <FaTrashCan />, danger: true, label: "Xoá lớp dự kiến", onClick: xoaLop },
                    ],
                  }}>
                    <button type="button" aria-label="Thao tác lớp" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-50" style={{ color: C.sub }}>
                      <FaEllipsisVertical />
                    </button>
                  </Dropdown>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <SoLieu value={lop.si_so} label="Đã chọn" bg="#DCF5E5" color={C.success} />
                  <SoLieu value={lop.suc_chua} label="Sức chứa tối đa" bg={C.soft} color={C.sidebar} />
                  <SoLieu value={conTrong} label="Còn trống" bg="#FFEBD6" color="#E8730C" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress percent={pct} showInfo={false} strokeColor={C.success} railColor={C.border} className="!m-0 flex-1" size={["100%", 12]} />
                  <span className="text-[16px] font-extrabold" style={{ color: C.success }}>{pct}%</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px]" style={{ color: C.text }}>
                  <span className="flex items-center gap-1.5"><FaRegCalendarDays style={{ color: C.primary }} />Ngày khai giảng: <b style={{ color: C.title }}>{fmtDate(lop.ngay_khai_giang) || "—"}</b></span>
                  <span className="flex items-center gap-1.5"><FaLocationDot style={{ color: C.primary }} />Cơ sở: <b style={{ color: C.title }}>{lop.co_so || "—"}</b></span>
                </div>
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<>Chưa có lớp dự kiến — bấm <b>Tạo lớp mới</b></>} />
            )}
          </div>

          <div className={`${CARD} flex min-h-0 flex-1 flex-col overflow-hidden`} style={cardStyle}>
            <div className="flex items-center gap-2.5 px-4 py-2.5 text-[16px] font-bold text-white" style={{ background: HEAD }}>
              <FaUsers />
              <span className="flex-1">Danh sách học viên trong lớp ({trongLop.length})</span>
              {lop && trongLop.length > 0 && (
                <Tooltip title="Bỏ tất cả học viên khỏi lớp">
                  <button type="button" aria-label="Bỏ tất cả" className="text-[17px] text-white hover:opacity-80"
                    onClick={() => Modal.confirm({ title: `Bỏ cả ${trongLop.length} học viên khỏi lớp ${tenLop(lop)}?`, okText: "Bỏ tất cả", okButtonProps: { danger: true }, onOk: () => boKhoiLop(trongLop.map((h) => h.id)) })}>
                    <FaTrashCan />
                  </button>
                </Tooltip>
              )}
            </div>
            <Table rowKey="id" size="small" pagination={false} dataSource={trongLop} loading={ctLoading} scroll={{ y: 360 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có học viên trong lớp" /> }}
              components={{ header: { cell: (props) => <th {...props} style={{ ...props.style, background: C.bg2, color: C.title, fontWeight: 700, fontSize: 13 }} /> } }}
              className="[&_.ant-table-tbody>tr.ant-table-row>td]:!text-[13px] [&_.ant-table-tbody>tr.ant-table-row>td]:!text-[#263B5E]"
              columns={[
                { title: "STT", width: 44, align: "center", render: (_, __, i) => i + 1 },
                { title: "Họ và tên", dataIndex: "ho_ten", ellipsis: true },
                { title: "Ngày sinh", dataIndex: "ngay_sinh", width: 92, align: "center", render: (v) => fmtDate(v) },
                { title: "CCCD", dataIndex: "cccd", width: 112 },
                {
                  title: "", width: 36, align: "center",
                  render: (_, r) => (
                    <Tooltip title="Bỏ khỏi lớp">
                      <button type="button" aria-label="Bỏ khỏi lớp" onClick={() => boKhoiLop([r.id])} className="text-[14px] hover:opacity-70" style={{ color: C.danger }}>
                        <FaXmark />
                      </button>
                    </Tooltip>
                  ),
                },
              ]} />
          </div>
        </div>
      </div>

      {/* Thông tin nhanh + thao tác */}
      <div className="relative flex flex-wrap items-stretch gap-3">
        <div className={`${CARD} min-w-[300px] px-4 py-3`} style={cardStyle}>
          <div className="mb-1 flex items-center gap-2 text-[17px] font-bold" style={{ color: C.title }}>
            <FaCircleInfo style={{ color: C.primary }} /> Thông tin nhanh
          </div>
          <div className="grid grid-cols-[auto_auto] gap-x-6 text-[14px]" style={{ color: C.text }}>
            <span>Tổng số hồ sơ đủ điều kiện:</span><b className="text-[16px]" style={{ color: C.title }}>{tk.tong ?? 0}</b>
            <span>Đang chọn: <b className="text-[16px]" style={{ color: C.primary }}>{checked.length}</b></span>
            <span>Chưa xếp lớp: <b className="text-[16px]" style={{ color: C.title }}>{tk.chua_xep ?? 0}</b></span>
          </div>
        </div>
        <Nut icon={<FaQrcode />} title="Quét QR" sub="thêm học viên" disabled={!lop} onClick={() => { setMaQuet(null); setQrOpen(true); }}
          style={{ background: C.soft, borderColor: "#b9d5fb", color: C.sidebar }} />
        <Nut icon={<FaRightLeft />} title="Vào khóa" sub="(Chuyển phụ trách)" disabled={!lop?.si_so} onClick={vaoKhoa}
          style={{ background: `linear-gradient(180deg, #a874ff, ${C.purple})`, borderColor: C.purple, color: "#fff" }} />
        <Nut icon={<FaPrint />} title="In danh sách" disabled={!lop} onClick={() => inHtml(danhSachLopHtml(lop, trongLop))}
          style={{ background: "#fff", borderColor: C.border, color: C.sidebar }} />
        <Nut icon={<FaRotateLeft />} title="Bỏ chọn tất cả" disabled={!checked.length} onClick={() => setChecked([])}
          style={{ background: "#fff", borderColor: C.border, color: C.sidebar }} />
        <Nut icon={saving ? <Spin size="small" /> : <FaCheck />} title={`Xác nhận đưa vào lớp${checked.length ? ` (${checked.length})` : ""}`}
          disabled={!lop || !checked.length || saving} onClick={xacNhan} className="flex-1"
          style={{ background: "linear-gradient(180deg, #2fc46c, #148a3f)", borderColor: "#148a3f", color: "#fff" }} />
      </div>

      <LopModal open={lopModal.open} lop={lopModal.lop} coSoGoiY={boLoc.co_so} hangGoiY={boLoc.hang}
        onClose={() => setLopModal({ open: false, lop: null })}
        onSaved={(l) => { setLopModal({ open: false, lop: null }); if (l?.id) setLopId(l.id); lamMoi(); }} />
      <QuetQrModal open={qrOpen} lop={lop} maBanDau={maQuet} onClose={() => { setQrOpen(false); setMaQuet(null); }} onAdded={lamMoi} />
    </div>
  );
}
