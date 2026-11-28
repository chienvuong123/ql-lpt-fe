import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatePicker, Dropdown, Empty, Input, Modal, Progress, Select, Spin, Table, Tooltip, message } from "antd";
import {
  FaGraduationCap, FaRegCalendarDays, FaLayerGroup, FaUsers, FaCalendarCheck, FaHourglassHalf, FaRocket, FaMagnifyingGlass,
  FaTableCellsLarge, FaList, FaCircleCheck, FaUser, FaEllipsis, FaPlus, FaPlay, FaPrint, FaPen, FaUserGroup, FaLocationDot,
  FaCarSide, FaChalkboardUser, FaListCheck, FaRegSquare, FaSquareCheck, FaDoorOpen,
} from "react-icons/fa6";
import dayjs from "dayjs";
import { getKgLop, kgSuaLop, kgKhaiGiang, getXlChiTietLop, errMsg } from "../../apis/apiTiepSinh";
import { WEEKDAYS, fmtDate, useNow } from "../tiep-sinh/tiepSinhShared";
import { inHtml } from "../../util/inAn";
import banner from "../../assets/ke-toan-banner.webp";
import KhaiGiangLopModal from "./KhaiGiangLopModal";
import { C, SHADOW, HEAD, TABLE_HEAD, tenLop, danhSachLopHtml, bodyTuLop } from "./xepLopShared";

const TABS = [
  { key: "san_sang", label: "Sẵn sàng khai giảng", icon: <FaRocket /> },
  { key: "cho_si_so", label: "Chờ đủ sĩ số", icon: <FaHourglassHalf /> },
  { key: "da_khai_giang", label: "Đã khai giảng", icon: <FaGraduationCap /> },
];
const TT = {
  san_sang: { label: "Sẵn sàng khai giảng", bg: "#DCF5E5", color: C.success },
  cho_si_so: { label: "Chờ đủ sĩ số", bg: "#FFEBD6", color: "#E8730C" },
  da_khai_giang: { label: "Đã khai giảng", bg: C.soft, color: C.sidebar },
};
// Màu nhãn hạng
const MAU_HANG = { A: ["#FFEBD6", "#E8730C"], A1: ["#FFEBD6", "#E8730C"], B1: ["#EDE3FF", "#873FF0"], B2: [C.soft, C.sidebar], C1: ["#F6E3FF", "#A23FD6"], C: ["#F6E3FF", "#A23FD6"] };
const mauHang = (h) => MAU_HANG[h] || ["#E2F3F8", "#0E8AA8"];

function HangTag({ hang, big }) {
  const [bg, color] = mauHang(hang);
  return (
    <span className={`inline-flex items-center justify-center rounded-lg font-extrabold ${big ? "h-9 min-w-[44px] px-2 text-[17px]" : "h-7 min-w-[36px] px-1.5 text-[14px]"}`}
      style={{ background: bg, color, border: `1px solid ${color}33` }}>
      {hang}
    </span>
  );
}

function TTTag({ value }) {
  const m = TT[value];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function StatCard({ icon, label, value, color, bg, dam }) {
  return (
    <div className="relative flex h-[92px] items-center gap-4 overflow-hidden rounded-2xl border border-white px-5"
      style={{ background: dam ? `linear-gradient(110deg, ${C.primary}, ${C.sidebar})` : bg, boxShadow: SHADOW }}>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[28px]"
        style={dam ? { background: "rgba(255,255,255,0.18)", color: "#fff" } : { background: "#fff", color, boxShadow: `0 4px 12px ${color}33` }}>
        {icon}
      </span>
      <div className="relative z-10 min-w-0">
        <div className="truncate text-[15px] font-bold" style={{ color: dam ? "#fff" : C.title }}>{label}</div>
        <div className="text-[30px] font-extrabold leading-tight tabular-nums" style={{ color: dam ? "#fff" : color }}>{Number(value || 0).toLocaleString("vi-VN")}</div>
      </div>
      <span className="pointer-events-none absolute -bottom-2 right-3 text-[64px]" style={{ color: dam ? "#fff" : color, opacity: 0.14 }}>{icon}</span>
    </div>
  );
}

function TheLop({ l, chon, onChon, menu }) {
  const tt = TT[l.trang_thai_kg];
  return (
    <div role="button" tabIndex={0} onClick={onChon} onKeyDown={(e) => e.key === "Enter" && onChon()}
      className="relative flex cursor-pointer flex-col gap-2 rounded-2xl border-2 bg-white p-4 transition hover:-translate-y-0.5"
      style={{ borderColor: chon ? C.primary : C.border, boxShadow: chon ? `0 8px 20px ${C.primary}33` : SHADOW }}>
      {chon && <FaCircleCheck className="absolute right-3 top-3 text-[22px]" style={{ color: C.primary }} />}
      <div className="flex items-center gap-2.5 pr-7">
        <HangTag hang={l.hang} />
        <span className="truncate text-[18px] font-extrabold" style={{ color: C.title }}>{tenLop(l)}</span>
      </div>
      <div className="flex items-center gap-2 text-[14px]" style={{ color: C.text }}>
        <FaUserGroup style={{ color: C.primary }} /> <b style={{ color: C.title }}>{l.si_so} / {l.suc_chua}</b> học viên
      </div>
      <div className="flex items-center gap-2">
        <Progress percent={Math.min(100, l.ty_le)} showInfo={false} strokeColor={l.si_so >= l.nguong_si_so ? C.success : C.warning}
          railColor={C.border} size={["100%", 8]} className="!m-0 flex-1" />
        <span className="w-10 text-right text-[13px] font-bold" style={{ color: C.success }}>{l.ty_le}%</span>
      </div>
      <div className="grid grid-cols-[18px_80px_1fr] items-center gap-x-1.5 gap-y-1 text-[13px]" style={{ color: C.text }}>
        <FaRegCalendarDays style={{ color: C.primary }} /><span>Khai giảng:</span><b style={{ color: C.title }}>{fmtDate(l.ngay_khai_giang) || "—"}</b>
        <FaUser style={{ color: C.primary }} /><span>Phụ trách:</span><b className="truncate" style={{ color: C.title }}>{l.nguoi_phu_trach || "—"}</b>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: tt.bg, color: tt.color }}>{tt.label}</span>
        <Dropdown trigger={["click"]} menu={menu}>
          <button type="button" aria-label="Thao tác" onClick={(e) => e.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[16px] hover:bg-blue-50" style={{ color: C.sidebar }}>
            <FaEllipsis />
          </button>
        </Dropdown>
      </div>
    </div>
  );
}

function CongViec({ cv, onToggle, khoa }) {
  const tuDong = cv.key === "hoc_vien" || cv.key === "phong_hoc";
  return (
    <div className="flex items-center gap-3 py-1.5">
      <button type="button" disabled={tuDong || khoa} onClick={onToggle} aria-label={cv.label}
        className="text-[20px] disabled:cursor-default" style={{ color: cv.done ? C.success : "#9AA9C0" }}
        title={tuDong ? "Tự đạt theo dữ liệu lớp" : cv.done ? "Bỏ đánh dấu" : "Đánh dấu đã xong"}>
        {cv.done ? <FaSquareCheck /> : <FaRegSquare />}
      </button>
      <span className="flex-1 text-[14px] font-medium" style={{ color: C.title }}>{cv.label}</span>
      <span className="rounded-md px-2 py-0.5 text-[12px] font-bold" style={cv.done ? { background: "#DCF5E5", color: C.success } : { background: "#FDE4E4", color: C.danger }}>
        {cv.done ? "Đã sẵn sàng" : cv.cho}
      </span>
    </div>
  );
}

export default function KhaiGiang() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const now = useNow();
  const [tab, setTab] = useState("san_sang");
  const [searchText, setSearchText] = useState("");
  const [loc, setLoc] = useState({ search: "", hang: undefined, thang: undefined });
  const [view, setView] = useState("grid");
  const [chonId, setChonId] = useState(null);
  const [modal, setModal] = useState({ open: false, lop: null });
  const [dangKg, setDangKg] = useState(false);

  const { data: res, isLoading, isFetching } = useQuery({
    queryKey: ["kg-lop", loc], queryFn: () => getKgLop({ ...loc, search: loc.search || undefined }), staleTime: 0, refetchInterval: 30000, placeholderData: keepPreviousData,
  });
  const dd = res?.data;
  const tatCa = useMemo(() => dd?.data || [], [dd]);
  const tk = dd?.thong_ke || {};
  const dem = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, tatCa.filter((l) => l.trang_thai_kg === t.key).length])), [tatCa]);
  const rows = useMemo(() => tatCa.filter((l) => l.trang_thai_kg === tab), [tatCa, tab]);
  useEffect(() => {
    if (rows.length && !rows.some((l) => l.id === chonId)) setChonId(rows[0].id);
    if (!rows.length) setChonId(null);
  }, [rows, chonId]);
  const lop = tatCa.find((l) => l.id === chonId) || null;
  const goiY = useMemo(() => ({
    hang: dd?.hang || [],
    co_so: tatCa.map((l) => l.co_so),
    nguoi_phu_trach: tatCa.map((l) => l.nguoi_phu_trach),
    phong_hoc: tatCa.map((l) => l.phong_hoc),
  }), [dd, tatCa]);

  const lamMoi = () => {
    qc.invalidateQueries({ queryKey: ["kg-lop"] });
    qc.invalidateQueries({ queryKey: ["xl-lop"] });
  };

  const toggle = async (l, cv) => {
    const field = { xe: "cv_xe", giao_vien: "cv_giao_vien", tai_lieu: "cv_tai_lieu" }[cv.key];
    if (!field) return;
    if (!cv.done && cv.key === "xe" && !l.xe_thuc_hanh) return (message.info("Nhập xe thực hành trước"), setModal({ open: true, lop: l }));
    if (!cv.done && cv.key === "giao_vien" && !l.giao_vien) return (message.info("Nhập giáo viên giảng dạy trước"), setModal({ open: true, lop: l }));
    try {
      await kgSuaLop(l.id, bodyTuLop(l, { [field]: !l[field] }));
      lamMoi();
    } catch (e) {
      message.error(errMsg(e, "Không cập nhật được"));
    }
  };

  const inDs = async (l) => {
    try {
      const r = await getXlChiTietLop(l.id);
      inHtml(danhSachLopHtml(r.data.lop, r.data.hoc_vien));
    } catch (e) {
      message.error(errMsg(e, "Không in được danh sách"));
    }
  };

  const khaiGiang = (l) => {
    const thieu = l.cong_viec.filter((c) => !c.done);
    if (thieu.length) {
      Modal.confirm({
        title: `Lớp ${tenLop(l)} chưa đủ điều kiện khai giảng`,
        content: <ul className="mt-2 list-disc pl-5">{thieu.map((c) => <li key={c.key}><b>{c.label}</b>: {c.cho}</li>)}</ul>,
        okText: "Chỉnh sửa lớp",
        cancelText: "Đóng",
        onOk: () => setModal({ open: true, lop: l }),
      });
      return;
    }
    Modal.confirm({
      title: `Khai giảng lớp ${tenLop(l)}?`,
      content: <>Lớp có <b>{l.si_so}</b>/{l.suc_chua} học viên, khai giảng {fmtDate(l.ngay_khai_giang) || "hôm nay"}. Sau khi khai giảng không thêm/bớt học viên hay sửa lớp được nữa.</>,
      okText: "Khai giảng",
      onOk: async () => {
        setDangKg(true);
        try {
          await kgKhaiGiang(l.id);
          message.success(`Đã khai giảng lớp ${tenLop(l)}`);
          lamMoi();
        } catch (e) {
          message.error(errMsg(e, "Khai giảng thất bại"));
        } finally {
          setDangKg(false);
        }
      },
    });
  };

  const menuLop = (l) => ({
    items: [
      { key: "td", icon: <FaListCheck />, label: "Tiến độ đào tạo", onClick: ({ domEvent }) => { domEvent.stopPropagation(); navigate(`/lop-hoc/${l.id}`); } },
      { key: "sua", icon: <FaPen />, label: "Chỉnh sửa", disabled: !!l.khai_giang_at, onClick: ({ domEvent }) => { domEvent.stopPropagation(); setModal({ open: true, lop: l }); } },
      { key: "in", icon: <FaPrint />, label: "In danh sách", onClick: ({ domEvent }) => { domEvent.stopPropagation(); inDs(l); } },
      { key: "kg", icon: <FaPlay />, label: "Khai giảng", disabled: !!l.khai_giang_at, onClick: ({ domEvent }) => { domEvent.stopPropagation(); khaiGiang(l); } },
    ],
  });

  const doiLoc = (k, v) => setLoc((s) => ({ ...s, [k]: v }));
  const daKg = !!lop?.khai_giang_at;

  return (
    <div className="relative -m-4 flex min-h-[calc(100vh-64px)] flex-col gap-3.5 overflow-hidden px-4 pb-5 pt-3 sm:px-5"
      style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 45%, ${C.bg} 100%)` }}>
      <img src={banner} alt="" aria-hidden
        className="pointer-events-none absolute -top-[18px] left-1/2 hidden h-[130px] w-auto max-w-none -translate-x-1/2 select-none lg:block"
        style={{ WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 85%, transparent 100%)", maskImage: "linear-gradient(90deg, transparent 0%, #000 30%, #000 85%, transparent 100%)" }} />

      {/* Tiêu đề */}
      <div className="relative flex min-h-[64px] flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white text-[28px]" style={{ boxShadow: SHADOW, color: C.sidebar }}>
            <FaGraduationCap />
          </span>
          <div>
            <div className="text-[26px] font-extrabold leading-tight" style={{ color: C.title }}>Khai giảng khóa học</div>
            <div className="text-[15px]" style={{ color: C.text }}>Quản lý danh sách lớp và tổ chức khai giảng</div>
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
        <StatCard dam icon={<FaLayerGroup />} label="Tổng lớp tạm" value={tk.lop_tam} />
        <StatCard icon={<FaUsers />} label="Tổng học viên" value={tk.hoc_vien} color={C.success} bg="linear-gradient(110deg,#DDF6E7,#F2FBF5)" />
        <StatCard icon={<FaCalendarCheck />} label="Đủ điều kiện KG" value={tk.san_sang} color={C.purple} bg="linear-gradient(110deg,#EDE3FF,#F7F2FF)" />
        <StatCard icon={<FaHourglassHalf />} label="Chờ đủ sĩ số" value={tk.cho_si_so} color="#E8730C" bg="linear-gradient(110deg,#FFEBD6,#FFF6EC)" />
        <StatCard icon={<FaGraduationCap />} label="Đã khai giảng" value={tk.da_khai_giang} color={C.sidebar} bg="linear-gradient(110deg,#DCEBFF,#F2F8FF)" />
      </div>

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Danh sách lớp */}
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-end gap-1">
            {TABS.map((t) => {
              const on = tab === t.key;
              return (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
                  className="flex h-12 items-center gap-2.5 rounded-t-2xl px-5 text-[16px] font-bold transition"
                  style={on ? { background: `linear-gradient(180deg, ${C.primary}, ${C.sidebar})`, color: "#fff" } : { background: "#DCE8F8", color: C.title }}>
                  {t.icon} {t.label} ({dem[t.key] || 0})
                </button>
              );
            })}
          </div>
          <div className="flex flex-1 flex-col gap-3 rounded-b-2xl rounded-tr-2xl border bg-white p-4" style={{ borderColor: C.border, boxShadow: SHADOW }}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 min-w-[240px] flex-1 overflow-hidden rounded-lg border bg-white focus-within:border-[#0878F9]" style={{ borderColor: C.border }}>
                <Input variant="borderless" allowClear placeholder="Tìm lớp theo tên, hạng, người phụ trách..." value={searchText}
                  prefix={<FaMagnifyingGlass style={{ color: C.sub }} />} className="!h-full"
                  onChange={(e) => { setSearchText(e.target.value); if (!e.target.value) doiLoc("search", ""); }}
                  onPressEnter={() => doiLoc("search", searchText.trim())} />
              </div>
              <Select allowClear placeholder="Hạng: Tất cả" value={loc.hang} onChange={(v) => doiLoc("hang", v)} className="!h-10 w-[150px]"
                options={(dd?.hang || []).map((h) => ({ value: h, label: `Hạng: ${h}` }))} />
              <DatePicker picker="month" format="[Tháng] MM/YYYY" placeholder="Tất cả tháng" className="!h-10 w-[170px]"
                value={loc.thang ? dayjs(`${loc.thang}-01`) : null} onChange={(v) => doiLoc("thang", v ? v.format("YYYY-MM") : undefined)} />
              <div className="ml-auto flex overflow-hidden rounded-lg border" style={{ borderColor: C.border }}>
                {[["grid", <FaTableCellsLarge key="g" />, "Dạng thẻ"], ["list", <FaList key="l" />, "Dạng bảng"]].map(([k, ic, t]) => (
                  <Tooltip key={k} title={t}>
                    <button type="button" onClick={() => setView(k)} aria-label={t} className="flex h-10 w-11 items-center justify-center text-[16px]"
                      style={view === k ? { background: C.primary, color: "#fff" } : { background: "#fff", color: C.sidebar }}>
                      {ic}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 text-center"><Spin /></div>
            ) : view === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {rows.map((l) => <TheLop key={l.id} l={l} chon={l.id === chonId} onChon={() => (l.id === chonId ? navigate(`/lop-hoc/${l.id}`) : setChonId(l.id))} menu={menuLop(l)} />)}
                {tab !== "da_khai_giang" && (
                  <button type="button" onClick={() => setModal({ open: true, lop: null })}
                    className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition hover:bg-[#F5F9FF]"
                    style={{ borderColor: "#9cc3f5", color: C.sidebar }}>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full text-[22px] text-white" style={{ background: C.primary }}><FaPlus /></span>
                    <span className="text-[17px] font-bold">Tạo lớp khai giảng mới</span>
                  </button>
                )}
                {!rows.length && tab === "da_khai_giang" && <Empty className="col-span-full py-10" description="Chưa có lớp nào khai giảng" />}
              </div>
            ) : (
              <Table rowKey="id" size="middle" dataSource={rows} pagination={false} loading={isFetching} scroll={{ x: 900 }}
                onRow={(l) => ({ onClick: () => setChonId(l.id), onDoubleClick: () => navigate(`/lop-hoc/${l.id}`), className: "cursor-pointer" })}
                rowClassName={(l) => (l.id === chonId ? "[&>td]:!bg-[#EAF3FF]" : "")}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có lớp" /> }}
                components={{ header: { cell: (p) => <th {...p} style={{ ...p.style, background: TABLE_HEAD, color: "#fff", fontWeight: 600 }} /> } }}
                columns={[
                  { title: "Hạng", dataIndex: "hang", width: 70, align: "center", render: (v) => <HangTag hang={v} /> },
                  { title: "Lớp", width: 160, render: (_, l) => <b style={{ color: C.title }}>{tenLop(l)}</b> },
                  { title: "Sĩ số", width: 150, render: (_, l) => <span><b>{l.si_so}</b>/{l.suc_chua} ({l.ty_le}%)</span> },
                  { title: "Khai giảng", dataIndex: "ngay_khai_giang", width: 110, align: "center", render: (v) => fmtDate(v) || "—" },
                  { title: "Phụ trách", dataIndex: "nguoi_phu_trach", width: 160, render: (v) => v || "—" },
                  { title: "Phòng học", dataIndex: "phong_hoc", width: 150, render: (v) => v || "—" },
                  { title: "Trạng thái", width: 170, align: "center", render: (_, l) => <TTTag value={l.trang_thai_kg} /> },
                ]} />
            )}
          </div>
        </div>

        {/* Chi tiết lớp đang chọn */}
        <div className="flex min-w-0 flex-col gap-3 self-start">
          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: C.border, boxShadow: SHADOW }}>
            {lop ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: HEAD }}>
                  <FaGraduationCap className="text-[22px]" />
                  <span className="min-w-0 flex-1 truncate text-[19px] font-extrabold">{tenLop(lop)}</span>
                  <Tooltip title="Mở quản lý tiến độ đào tạo của lớp">
                    <button type="button" onClick={() => navigate(`/lop-hoc/${lop.id}`)} className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-bold text-white hover:bg-white/30">
                      Tiến độ →
                    </button>
                  </Tooltip>
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-bold" style={{ color: TT[lop.trang_thai_kg].color }}>
                    <FaCircleCheck /> {TT[lop.trang_thai_kg].label}
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center gap-2 border-b px-4 py-3" style={{ borderColor: C.border }}>
                  <div className="flex items-center gap-2.5">
                    <FaUsers className="text-[26px]" style={{ color: C.primary }} />
                    <div><div className="text-[24px] font-extrabold leading-none" style={{ color: C.title }}>{lop.si_so}</div><div className="text-[12px]" style={{ color: C.text }}>Học viên</div></div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <FaUserGroup className="text-[24px]" style={{ color: C.primary }} />
                    <div><div className="text-[24px] font-extrabold leading-none" style={{ color: C.title }}>{lop.suc_chua}</div><div className="text-[12px]" style={{ color: C.text }}>Sĩ số tối đa</div></div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Progress type="circle" percent={Math.min(100, lop.ty_le)} size={50} strokeColor={C.success} strokeWidth={10}
                      format={(p) => <span className="text-[12px] font-bold" style={{ color: C.success }}>{p}%</span>} />
                    <div><div className="text-[22px] font-extrabold leading-none" style={{ color: C.title }}>{lop.ty_le}%</div><div className="text-[12px]" style={{ color: C.text }}>Tỷ lệ</div></div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="mb-1.5 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[15px] font-bold" style={{ background: C.bg, color: C.title }}>
                    <FaUserGroup style={{ color: C.sidebar }} /> Thông tin lớp học
                  </div>
                  <div className="grid grid-cols-[20px_130px_1fr] items-center gap-x-2 gap-y-1.5 px-2 text-[14px]" style={{ color: C.text }}>
                    <FaGraduationCap style={{ color: C.primary }} /><span>Hạng đào tạo:</span><b style={{ color: C.title }}>{lop.hang}</b>
                    <FaRegCalendarDays style={{ color: C.primary }} /><span>Ngày dự kiến KG:</span><b style={{ color: C.title }}>{fmtDate(lop.ngay_khai_giang) || "—"}</b>
                    <FaUser style={{ color: C.primary }} /><span>Người phụ trách:</span><b style={{ color: C.title }}>{lop.nguoi_phu_trach || "—"}</b>
                    <FaDoorOpen style={{ color: C.primary }} /><span>Phòng học:</span><b style={{ color: C.title }}>{lop.phong_hoc || "—"}</b>
                    <FaCarSide style={{ color: C.primary }} /><span>Xe thực hành:</span><b style={{ color: C.title }}>{lop.xe_thuc_hanh || "—"}</b>
                    <FaChalkboardUser style={{ color: C.primary }} /><span>Giáo viên:</span><b style={{ color: C.title }}>{lop.giao_vien || "—"}</b>
                    <FaLocationDot style={{ color: C.primary }} /><span>Cơ sở:</span><b style={{ color: C.title }}>{lop.co_so || "—"}</b>
                  </div>
                  <div className="mb-1 mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-[15px] font-bold" style={{ background: C.bg, color: C.title }}>
                    <FaListCheck style={{ color: C.sidebar }} /> Công việc chuẩn bị khai giảng
                  </div>
                  <div className="px-2">
                    {lop.cong_viec.map((cv) => <CongViec key={cv.key} cv={cv} khoa={daKg} onToggle={() => toggle(lop, cv)} />)}
                  </div>
                  {daKg && (
                    <div className="mt-2 rounded-lg px-3 py-2 text-[13px] font-semibold" style={{ background: C.soft, color: C.sidebar }}>
                      Đã khai giảng lúc {dayjs(lop.khai_giang_at).format("HH:mm DD/MM/YYYY")}{lop.nguoi_khai_giang ? ` — ${lop.nguoi_khai_giang}` : ""}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Empty className="py-16" image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn một lớp" />
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3">
            <button type="button" disabled={!lop || daKg || dangKg} onClick={() => khaiGiang(lop)}
              className="flex h-[60px] items-center justify-center gap-2.5 whitespace-nowrap rounded-2xl px-4 text-[16px] font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(180deg, #2fc46c, #148a3f)", color: "#fff", boxShadow: "0 6px 16px rgba(22,163,74,0.35)" }}>
              {dangKg ? <Spin size="small" /> : <FaPlay />} {daKg ? "Đã khai giảng" : "Chuẩn bị khai giảng"}
            </button>
            <button type="button" disabled={!lop} onClick={() => inDs(lop)}
              className="flex h-[60px] w-[84px] flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-white text-[14px] font-bold disabled:opacity-50"
              style={{ borderColor: "#9cc3f5", color: C.sidebar }}>
              <FaPrint className="text-[18px]" /> In DS
            </button>
            <button type="button" disabled={!lop || daKg} onClick={() => setModal({ open: true, lop })}
              className="flex h-[60px] w-[84px] flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-white text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: "#9cc3f5", color: C.sidebar }}>
              <FaPen className="text-[18px]" /> Chỉnh sửa
            </button>
          </div>
        </div>
      </div>

      <KhaiGiangLopModal open={modal.open} lop={modal.lop} goiY={goiY} onClose={() => setModal({ open: false, lop: null })}
        onSaved={(l) => { setModal({ open: false, lop: null }); if (l?.id) { setChonId(l.id); setTab(l.trang_thai_kg); } lamMoi(); }} />
    </div>
  );
}
