import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Checkbox, DatePicker, Input, Modal, Radio, Select, Spin, Tooltip } from "antd";
import { FaPrint, FaFileLines, FaListOl } from "react-icons/fa6";
import dayjs from "dayjs";
import { getKgLop, getTdLop } from "../../apis/apiTiepSinh";
import { fmtDate } from "../tiep-sinh/tiepSinhShared";
import { inHtml } from "../../util/inAn";
import { baoCaoSoHtml, docCauHinh, luuCauHinh, maKhoaTuLop } from "./baoCaoSo";
import { C, tenLop } from "./xepLopShared";

function O({ label, children, className = "" }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[13px] font-semibold" style={{ color: C.text }}>{label}</span>
      {children}
    </label>
  );
}

/** In "Báo cáo đăng ký khoá đào tạo lái xe" + "Danh sách học viên khoá" theo mẫu gửi Sở */
export default function InBaoCaoSoModal({ open, ct, onClose, choIn = true }) {
  // Mở mới mỗi lần (cha chỉ render khi mở) -> khởi tạo luôn ở đây
  const [ch, setCh] = useState(() => ({ ...docCauHinh(), ngay_bao_cao: dayjs().format("YYYY-MM-DD") }));
  const [lopThem, setLopThem] = useState([]); // id các lớp gộp thêm vào cùng báo cáo
  const [maKhoa, setMaKhoa] = useState({}); // id lớp -> "K260055"
  const [chi, setChi] = useState("ca_hai");

  const sua = (k, v) => setCh((s) => ({ ...s, [k]: v }));

  const { data: dsLopRes } = useQuery({ queryKey: ["kg-lop", "in-bao-cao"], queryFn: () => getKgLop({}), enabled: open, staleTime: 60000 });
  const lopKhac = useMemo(() => (dsLopRes?.data?.data || []).filter((l) => l.id !== ct?.lop?.id && l.si_so > 0), [dsLopRes, ct]);
  const them = useQueries({ queries: lopThem.map((id) => ({ queryKey: ["td-lop", id], queryFn: () => getTdLop(id), staleTime: 30000 })) });
  const dangTai = them.some((q) => q.isLoading);

  const khoa = useMemo(() => {
    if (!ct) return [];
    const list = [ct, ...them.map((q) => q.data?.data).filter(Boolean)];
    return list.map((x) => ({ lop: x.lop, hoc_vien: x.hoc_vien, ma_khoa: maKhoa[x.lop.id] ?? maKhoaTuLop(x.lop) }));
  }, [ct, them, maKhoa]);

  const html = useMemo(() => (khoa.length ? baoCaoSoHtml(ch, khoa, chi === "ca_hai" ? undefined : chi) : ""), [ch, khoa, chi]);
  const thieu = khoa.filter((k) => !k.lop.ngay_khai_giang || !k.lop.ngay_ket_thuc).map((k) => tenLop(k.lop));

  const inNgay = () => {
    luuCauHinh(ch);
    inHtml(html);
  };

  return (
    <Modal open={open} onCancel={onClose} width="min(1280px, 97vw)" style={{ top: 16 }} destroyOnHidden
      title={<span className="flex items-center gap-2"><FaFileLines style={{ color: C.primary }} /> In báo cáo đăng ký khoá đào tạo lái xe (gửi Sở)</span>}
      footer={[
        <span key="g" className="mr-auto text-[13px]" style={{ color: thieu.length ? C.danger : C.sub }}>
          {thieu.length ? `Chưa có ngày khai giảng / ngày bế giảng: ${thieu.join(", ")}` : "Cấu hình in được lưu lại cho lần sau."}
        </span>,
        <button key="dong" type="button" onClick={onClose} className="mr-2 rounded-lg border px-4 py-1.5 font-semibold" style={{ borderColor: C.border, color: C.text }}>Đóng</button>,
        <Tooltip key="in" title={choIn ? "" : "Xác thực dữ liệu lớp trước khi in"}>
          <button type="button" disabled={!choIn || dangTai || !html} onClick={inNgay}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-1.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: `linear-gradient(180deg, ${C.light}, ${C.primary})`, color: "#fff" }}>
            <FaPrint /> In / Lưu PDF
          </button>
        </Tooltip>,
      ]}>
      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex max-h-[76vh] flex-col gap-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2">
            <O label="Số văn bản" className="col-span-2"><Input value={ch.so_van_ban} onChange={(e) => sua("so_van_ban", e.target.value)} placeholder="vd 435 (để trống = điền tay)" addonAfter={`/${dayjs(ch.ngay_bao_cao).format("YYYY")}/BC-LPT`} /></O>
            <O label="Ngày báo cáo"><DatePicker className="w-full" format="DD/MM/YYYY" value={ch.ngay_bao_cao ? dayjs(ch.ngay_bao_cao) : null} onChange={(v) => sua("ngay_bao_cao", v ? v.format("YYYY-MM-DD") : null)} /></O>
            <O label="Nơi ký"><Input value={ch.noi_ky} onChange={(e) => sua("noi_ky", e.target.value)} /></O>
            <O label="Mã cơ sở đào tạo"><Input value={ch.ma_csdt} onChange={(e) => sua("ma_csdt", e.target.value)} /></O>
          </div>
          <O label="Kính gửi"><Input value={ch.kinh_gui} onChange={(e) => sua("kinh_gui", e.target.value)} /></O>
          <O label="Căn cứ (Thực hiện …)"><Input.TextArea rows={2} value={ch.can_cu} onChange={(e) => sua("can_cu", e.target.value)} /></O>

          <div className="rounded-xl border p-3" style={{ borderColor: C.border, background: C.bg2 }}>
            <div className="mb-2 text-[13px] font-bold" style={{ color: C.title }}>Các khoá trong báo cáo</div>
            {khoa.map((k) => (
              <div key={k.lop.id} className="mb-1.5 grid grid-cols-[1fr_130px] items-center gap-2 text-[13px]">
                <span style={{ color: C.title }}>
                  <b>{tenLop(k.lop)}</b> — {k.hoc_vien.length} HV · KG {fmtDate(k.lop.ngay_khai_giang) || "—"} · BG {fmtDate(k.lop.ngay_ket_thuc) || "—"}
                </span>
                <Input size="small" addonBefore={ch.ma_csdt} value={k.ma_khoa} onChange={(e) => setMaKhoa((m) => ({ ...m, [k.lop.id]: e.target.value.toUpperCase() }))} />
              </div>
            ))}
            <Select mode="multiple" allowClear size="small" className="mt-1 w-full" placeholder="Gộp thêm lớp khác vào cùng báo cáo..." value={lopThem} onChange={setLopThem}
              loading={dangTai} options={lopKhac.map((l) => ({ value: l.id, label: `${tenLop(l)} (${l.si_so} HV)` }))} />
          </div>

          <O label="Số lượng học viên ghi vào cột">
            <Radio.Group value={ch.hinh_thuc_lt} onChange={(e) => sua("hinh_thuc_lt", e.target.value)}
              options={[{ value: "tu_hoc", label: "Tự học lý thuyết" }, { value: "tap_trung", label: "Học lý thuyết tập trung" }]} />
          </O>
          <Checkbox checked={ch.sh_lan_dau} onChange={(e) => sua("sh_lan_dau", e.target.checked)}>Ghi chú "SH lần đầu" cho học viên chưa có GPLX</Checkbox>
          <O label="Nơi nhận (mỗi dòng 1 nơi)"><Input.TextArea rows={3} value={ch.noi_nhan} onChange={(e) => sua("noi_nhan", e.target.value)} /></O>
          <div className="grid grid-cols-2 gap-2">
            <O label="Chức danh ký (dòng 1)"><Input value={ch.ky_1} onChange={(e) => sua("ky_1", e.target.value)} /></O>
            <O label="Chức danh ký (dòng 2)"><Input value={ch.ky_2} onChange={(e) => sua("ky_2", e.target.value)} /></O>
          </div>
          <O label="Người ký"><Input value={ch.nguoi_ky} onChange={(e) => sua("nguoi_ky", e.target.value)} /></O>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Radio.Group value={chi} onChange={(e) => setChi(e.target.value)} optionType="button" buttonStyle="solid" size="small"
            options={[
              { value: "ca_hai", label: "Báo cáo + danh sách" },
              { value: "bao_cao", label: <span className="inline-flex items-center gap-1"><FaFileLines /> Chỉ báo cáo</span> },
              { value: "danh_sach", label: <span className="inline-flex items-center gap-1"><FaListOl /> Chỉ danh sách học viên</span> },
            ]} />
          {dangTai ? <div className="py-20 text-center"><Spin /></div> : (
            <iframe title="Xem trước" srcDoc={html} className="h-[72vh] w-full rounded-lg border bg-[#f3f4f6]" style={{ borderColor: C.border }} />
          )}
        </div>
      </div>
    </Modal>
  );
}
