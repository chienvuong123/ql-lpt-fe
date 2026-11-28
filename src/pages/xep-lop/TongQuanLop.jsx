import { useState } from "react";
import { Input, Modal, Tooltip } from "antd";
import {
  FaGraduationCap, FaRegCalendarDays, FaUsers, FaChalkboardUser, FaCarSide, FaCircleCheck, FaTriangleExclamation, FaCircleXmark,
  FaClock, FaChartColumn, FaFileLines, FaEye, FaDownload, FaPenToSquare, FaShieldHalved, FaPrint, FaArrowLeft, FaListOl, FaLock, FaXmark,
} from "react-icons/fa6";
import dayjs from "dayjs";
import { inHtml } from "../../util/inAn";
import { fmtDate } from "../tiep-sinh/tiepSinhShared";
import { baoCaoLopHtml, dsBaoCao } from "./baoCaoLop";
import InBaoCaoSoModal from "./InBaoCaoSoModal";
import { C, SHADOW, HEAD, tenLop } from "./xepLopShared";

const CARD = "overflow-hidden rounded-2xl border bg-white";
const cardStyle = { borderColor: C.border, boxShadow: SHADOW };
const fmtGio = (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "");

function Head({ icon, children, extra }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 text-[16px] font-bold text-white" style={{ background: HEAD }}>
      <span className="text-[18px]">{icon}</span> {children}
      {extra && <span className="ml-auto">{extra}</span>}
    </div>
  );
}

function Tile({ icon, value, label, color, bg }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl px-2 py-3 text-center" style={{ background: bg }}>
      <span className="text-[26px]" style={{ color }}>{icon}</span>
      <span className="text-[26px] font-extrabold leading-tight tabular-nums" style={{ color: C.title }}>{value}</span>
      <span className="text-[13px] font-semibold" style={{ color: C.text }}>{label}</span>
    </div>
  );
}

const Dau = ({ ok }) => (ok ? <FaCircleCheck style={{ color: C.success }} /> : <FaTriangleExclamation style={{ color: "#E8A10C" }} />);

/** Bước 3–4: tổng quan khoá học, danh sách báo cáo, xác thực & in */
export default function TongQuanLop({ ct, ghiChu, setGhiChu, onLuuGhiChu, onXacThuc, onQuayLai, busy }) {
  const [xem, setXem] = useState(null); // { title, keys }
  const [inSo, setInSo] = useState(false); // báo cáo gửi Sở (theo mẫu)
  const { lop, nhom, tong_quan: tq } = ct;
  const daXacThuc = !!lop.xac_thuc_at;
  const baoCao = dsBaoCao(ct);
  const conLai = tq.tong_hv - tq.da_ghep;
  const pct = tq.tong_hv ? Math.round((tq.da_ghep / tq.tong_hv) * 100) : 0;
  const duGvXe = nhom.length > 0 && nhom.every((n) => n.giao_vien && (n.xe || !ct.bat_buoc_xe));
  const ghepXong = duGvXe && conLai === 0;
  const soThang = lop.ngay_khai_giang && lop.ngay_ket_thuc ? (dayjs(lop.ngay_ket_thuc).diff(dayjs(lop.ngay_khai_giang), "day") / 30).toFixed(1).replace(".0", "") : null;
  const loi = ct.canh_bao.filter((c) => c.muc !== "ok");
  const ghepLuc = nhom.map((n) => n.created_at).filter(Boolean).sort().pop();

  // Mốc tiến độ lấy từ dữ liệu có sẵn của lớp
  const moc = [
    { ok: true, text: "Tạo lớp & xếp học viên", luc: lop.created_at },
    lop.khai_giang_at && { ok: true, text: "Khai giảng khoá học", luc: lop.khai_giang_at },
    ghepLuc && { ok: ghepXong, text: ghepXong ? "Ghép giáo viên & xe" : "Đang ghép giáo viên & xe", luc: ghepLuc },
    daXacThuc && { ok: true, text: "Xác thực dữ liệu", luc: lop.xac_thuc_at },
  ].filter(Boolean);

  const inBaoCao = (keys) => inHtml(baoCaoLopHtml(ct, keys));

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
      {/* Cột trái */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className={CARD} style={cardStyle}>
          <Head icon={<FaGraduationCap />}>Thông tin khóa học</Head>
          <div className="flex flex-col gap-2 p-4 text-[14px]" style={{ color: C.text }}>
            <div className="flex items-center gap-2">
              <span className="min-w-0 truncate text-[24px] font-extrabold" style={{ color: C.title }}>{tenLop(lop)}</span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold"
                style={ghepXong ? { background: "#DCF5E5", color: C.success } : { background: "#FFEBD6", color: "#E8730C" }}>
                <Dau ok={ghepXong} /> {ghepXong ? "Đã ghép hoàn tất" : "Chưa ghép xong"}
              </span>
            </div>
            <div className="flex items-center gap-2"><FaRegCalendarDays style={{ color: C.primary }} />Ngày khai giảng: <b style={{ color: C.title }}>{fmtDate(lop.ngay_khai_giang) || "—"}</b></div>
            <div className="flex items-center gap-2"><FaRegCalendarDays style={{ color: C.primary }} />Ngày dự kiến kết thúc: <b style={{ color: C.title }}>{fmtDate(lop.ngay_ket_thuc) || "—"}</b>{soThang && <span>({soThang} tháng)</span>}</div>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <Tile icon={<FaUsers />} value={tq.tong_hv} label="Học viên" color={C.primary} bg={C.bg2} />
              <Tile icon={<FaChalkboardUser />} value={tq.giao_vien} label="Giáo viên" color={C.success} bg="#E6F7EC" />
              <Tile icon={<FaCarSide />} value={tq.xe} label="Xe tập lái" color={C.purple} bg="#F1EAFF" />
            </div>
            <div className="mt-1 rounded-xl p-3" style={{ background: C.bg2 }}>
              <div className="mb-1.5 flex items-center text-[14px] font-bold" style={{ color: C.title }}>
                Tóm tắt lớp học <span className="ml-auto text-[20px]"><Dau ok={ghepXong} /></span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2"><Dau ok={nhom.length > 0} />Chia thành {nhom.length} nhóm (mỗi nhóm {ct.hv_moi_nhom} HV)</span>
                <span className="flex items-center gap-2"><Dau ok={duGvXe} />{duGvXe ? `Đã phân công đủ GV${ct.bat_buoc_xe ? " và xe" : ""}` : `Còn nhóm chưa đủ GV${ct.bat_buoc_xe ? " / xe" : ""}`}</span>
                <span className="flex items-center gap-2"><Dau ok={!conLai} />{conLai ? `Còn ${conLai} học viên chờ phân nhóm` : "Không còn học viên chờ phân nhóm"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={CARD} style={cardStyle}>
          <Head icon={<FaClock />}>Tiến độ đào tạo</Head>
          <div className="flex flex-col p-4">
            {[...moc, { dang: true, text: daXacThuc ? "Đang theo dõi quá trình đào tạo" : "Chờ xác thực dữ liệu", luc: null }].map((m, i, arr) => (
              <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                {i < arr.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-16px)] w-[2px]" style={{ background: "#BFE6CC" }} />}
                <span className="z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[14px]"
                  style={m.dang ? { border: `3px solid ${C.primary}`, background: "#fff" } : { background: m.ok ? C.success : "#E8A10C", color: "#fff" }}>
                  {!m.dang && (m.ok ? <FaCircleCheck /> : <FaTriangleExclamation />)}
                </span>
                <div className="leading-snug">
                  <div className={m.dang ? "text-[15px] font-bold" : "text-[14px] font-medium"} style={{ color: m.dang ? C.primary : C.title }}>{m.text}</div>
                  <div className="text-[13px]" style={{ color: C.sub }}>
                    {m.dang ? (lop.ngay_ket_thuc ? `(Dự kiến kết thúc: ${fmtDate(lop.ngay_ket_thuc)})` : "(Chưa nhập ngày kết thúc)") : fmtGio(m.luc)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cột giữa */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className={CARD} style={cardStyle}>
          <Head icon={<FaChartColumn />}>Tổng quan khóa học</Head>
          <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-5">
            <Tile icon={<FaUsers />} value={tq.tong_hv} label="Tổng học viên" color={C.primary} bg={C.bg2} />
            <Tile icon={<FaListOl />} value={nhom.length} label="Nhóm học" color={C.success} bg="#E6F7EC" />
            <Tile icon={<FaChalkboardUser />} value={tq.giao_vien} label="Giáo viên" color={C.sidebar} bg={C.bg2} />
            <Tile icon={<FaCarSide />} value={tq.xe} label="Xe tập lái" color={C.purple} bg="#F1EAFF" />
            <Tile icon={<FaCircleCheck />} value={`${pct}%`} label="Hoàn thành ghép" color={C.success} bg="#E6F7EC" />
          </div>
        </div>

        <div className={CARD} style={cardStyle}>
          <Head icon={<FaFileLines />} extra={
            <button type="button" onClick={() => setXem({ title: "Tất cả báo cáo", keys: null })}
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-bold" style={{ color: C.sidebar }}>
              <FaEye /> Xem trước tất cả
            </button>}>
            Danh sách {baoCao.length + 1} loại báo cáo
          </Head>
          <div className="p-3">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr style={{ background: C.bg2, color: C.title }}>
                  {["STT", "Tên báo cáo", "Trạng thái", "Thao tác"].map((h) => <th key={h} className="border px-2 py-2 font-bold" style={{ borderColor: C.border }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#F4F9FF" }}>
                  <td className="border px-2 py-1.5 text-center" style={{ borderColor: C.border }}>1</td>
                  <td className="border px-3 py-1.5" style={{ borderColor: C.border, color: C.title }}>
                    <b>Báo cáo đăng ký khoá đào tạo lái xe (gửi Sở)</b>
                    <div className="text-[12px]" style={{ color: C.sub }}>kèm Danh sách học viên khoá — theo mẫu của trung tâm</div>
                  </td>
                  <td className="border px-2 py-1.5 text-center" style={{ borderColor: C.border }}>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold"
                      style={lop.ngay_khai_giang && lop.ngay_ket_thuc && tq.tong_hv ? { background: "#DCF5E5", color: C.success } : { background: "#FFF1DC", color: "#E8730C" }}>
                      <Dau ok={!!(lop.ngay_khai_giang && lop.ngay_ket_thuc && tq.tong_hv)} /> {lop.ngay_khai_giang && lop.ngay_ket_thuc && tq.tong_hv ? "Đã sẵn sàng" : "Thiếu ngày KG / BG"}
                    </span>
                  </td>
                  <td className="border px-2 py-1.5" style={{ borderColor: C.border }}>
                    <div className="flex justify-center gap-2">
                      <button type="button" onClick={() => setInSo(true)} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-semibold" style={{ borderColor: C.border, color: C.sidebar }}>
                        <FaEye /> Xem trước
                      </button>
                      <button type="button" onClick={() => setInSo(true)} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-semibold" style={{ borderColor: C.border, color: C.sidebar }}>
                        <FaDownload /> Tải PDF
                      </button>
                    </div>
                  </td>
                </tr>
                {baoCao.map((b, i) => (
                  <tr key={b.key}>
                    <td className="border px-2 py-1.5 text-center" style={{ borderColor: C.border }}>{i + 2}</td>
                    <td className="border px-3 py-1.5" style={{ borderColor: C.border, color: C.title }}>{b.ten}</td>
                    <td className="border px-2 py-1.5 text-center" style={{ borderColor: C.border }}>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold"
                        style={b.san_sang ? { background: "#DCF5E5", color: C.success } : { background: "#FFF1DC", color: "#E8730C" }}>
                        <Dau ok={b.san_sang} /> {b.san_sang ? "Đã sẵn sàng" : "Chưa đủ dữ liệu"}
                      </span>
                    </td>
                    <td className="border px-2 py-1.5" style={{ borderColor: C.border }}>
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => setXem({ title: b.ten, keys: [b.key] })}
                          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-semibold" style={{ borderColor: C.border, color: C.sidebar }}>
                          <FaEye /> Xem trước
                        </button>
                        <Tooltip title={daXacThuc ? "In / lưu thành PDF" : "Xác thực dữ liệu trước khi xuất báo cáo"}>
                          <button type="button" disabled={!daXacThuc} onClick={() => inBaoCao([b.key])}
                            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                            style={{ borderColor: C.border, color: C.sidebar }}>
                            <FaDownload /> Tải PDF
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={CARD} style={cardStyle}>
          <Head icon={<FaPenToSquare />}>Ghi chú</Head>
          <div className="px-3 pb-7 pt-3">
            <Input.TextArea rows={3} value={ghiChu} maxLength={1000} showCount placeholder="Nhập ghi chú (nếu có)..." disabled={daXacThuc}
              onChange={(e) => setGhiChu(e.target.value)} onBlur={onLuuGhiChu} />
          </div>
        </div>
      </div>

      {/* Cột phải */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="rounded-2xl border p-5 text-center" style={{ borderColor: loi.length ? "#F5D7A8" : "#BFE6CC", background: loi.length ? "#FFF8EE" : "#EEF9F2", boxShadow: SHADOW }}>
          {daXacThuc ? (
            <>
              <FaLock className="mx-auto text-[48px]" style={{ color: C.success }} />
              <div className="mt-2 text-[17px] font-extrabold" style={{ color: C.title }}>Dữ liệu đã được xác thực</div>
              <div className="mt-1 text-[14px]" style={{ color: C.text }}>
                Lúc {fmtGio(lop.xac_thuc_at)}{lop.nguoi_xac_thuc ? ` — ${lop.nguoi_xac_thuc}` : ""}. Đã sẵn sàng in báo cáo gửi Cục Đường bộ Việt Nam.
              </div>
            </>
          ) : !loi.length ? (
            <>
              <FaCircleCheck className="mx-auto text-[52px]" style={{ color: C.success }} />
              <div className="mt-2 text-[17px] font-extrabold" style={{ color: C.title }}>Dữ liệu đã đầy đủ và hợp lệ</div>
              <div className="mt-1 text-[14px]" style={{ color: C.text }}>Sẵn sàng xác thực và gửi dữ liệu sang Cục Đường bộ Việt Nam.</div>
            </>
          ) : (
            <>
              <FaTriangleExclamation className="mx-auto text-[46px]" style={{ color: "#E8A10C" }} />
              <div className="mt-2 text-[17px] font-extrabold" style={{ color: C.title }}>Dữ liệu chưa đầy đủ</div>
              <ul className="mt-2 flex flex-col gap-1 text-left text-[13px]" style={{ color: C.text }}>
                {loi.map((c, i) => (
                  <li key={i} className="flex gap-1.5"><span className="mt-0.5" style={{ color: c.muc === "error" ? C.danger : "#E8A10C" }}>{c.muc === "error" ? <FaCircleXmark /> : <FaTriangleExclamation />}</span>{c.text}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className={CARD} style={cardStyle}>
          <Head icon={<FaFileLines />}>Thao tác tiếp theo</Head>
          <div className="flex flex-col gap-3 p-4">
            <button type="button" onClick={onXacThuc} disabled={busy}
              className="flex h-[64px] items-center justify-center gap-3 rounded-2xl px-3 font-bold transition hover:brightness-105 disabled:opacity-50"
              style={daXacThuc ? { background: "#fff", color: C.danger, border: `2px solid ${C.danger}55` } : { background: "linear-gradient(180deg, #2fc46c, #148a3f)", color: "#fff", boxShadow: "0 6px 16px rgba(22,163,74,0.35)" }}>
              {daXacThuc ? <FaXmark className="text-[22px]" /> : <FaShieldHalved className="text-[26px]" />}
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[16px]">{daXacThuc ? "Bỏ xác thực" : "Xác thực dữ liệu"}</span>
                <span className="text-[12px] font-medium opacity-90">{daXacThuc ? "(để chỉnh sửa lại)" : "(khoá dữ liệu để in báo cáo)"}</span>
              </span>
            </button>
            <Tooltip title={daXacThuc ? "" : "Xác thực dữ liệu trước khi in báo cáo"}>
              <button type="button" onClick={() => setInSo(true)}
                className="flex h-[56px] w-full items-center justify-center gap-3 rounded-2xl border-2 bg-white text-[16px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: "#9cc3f5", color: C.sidebar }}>
                <FaPrint className="text-[20px]" /> In báo cáo gửi Sở (PDF)
              </button>
            </Tooltip>
            <button type="button" onClick={onQuayLai}
              className="flex h-[56px] items-center justify-center gap-3 rounded-2xl border-2 bg-white font-bold"
              style={{ borderColor: "#9cc3f5", color: C.sidebar }}>
              <FaArrowLeft className="text-[18px]" />
              <span className="flex flex-col items-start leading-tight"><span className="text-[15px]">Quay lại bước 2</span><span className="text-[12px] font-medium">(nếu cần chỉnh sửa)</span></span>
            </button>
          </div>
        </div>
      </div>

      {inSo && <InBaoCaoSoModal open ct={ct} choIn={daXacThuc} onClose={() => setInSo(false)} />}
      <Modal open={!!xem} onCancel={() => setXem(null)} width="min(1000px, 96vw)" destroyOnHidden footer={null} title={xem ? `Xem trước — ${xem.title}` : ""}>
        {xem && <iframe title="Xem trước báo cáo" className="h-[72vh] w-full rounded border" srcDoc={baoCaoLopHtml(ct, xem.keys)} />}
      </Modal>
    </div>
  );
}
