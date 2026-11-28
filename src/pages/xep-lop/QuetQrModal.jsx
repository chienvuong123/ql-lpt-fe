import { useEffect, useRef, useState } from "react";
import { DatePicker, Input, Modal, Spin, message } from "antd";
import {
  FaQrcode, FaCamera, FaCircleCheck, FaCircleXmark, FaXmark, FaUser, FaRegCalendarDays, FaIdCard, FaCar, FaFolder,
  FaPhone, FaUsers, FaNotesMedical, FaCheck, FaTriangleExclamation,
} from "react-icons/fa6";
import dayjs from "dayjs";
import jsQR from "jsqr";
import { getXlTraCuu, xlQuetQr, errMsg } from "../../apis/apiTiepSinh";
import { fmtDate } from "../tiep-sinh/tiepSinhShared";
import { C, SHADOW, tenLop } from "./xepLopShared";

function Dong({ icon, label, children }) {
  return (
    <div className="flex items-center gap-2.5 py-[3px]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[13px]" style={{ background: C.bg, color: C.primary }}>{icon}</span>
      <span className="w-[104px] shrink-0 text-[14px]" style={{ color: C.text }}>{label}</span>
      <span className="min-w-0 flex-1 break-words text-[14px] font-bold" style={{ color: C.title }}>{children || <span className="font-normal" style={{ color: C.sub }}>Chưa có</span>}</span>
    </div>
  );
}

function KhungTieuDe({ icon, children }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 text-[16px] font-bold" style={{ background: `linear-gradient(180deg, ${C.bg}, #fff)`, color: C.sidebar }}>
      <span className="text-[19px]" style={{ color: C.primary }}>{icon}</span> {children}
    </div>
  );
}

/**
 * Quét QR mã hồ sơ (in trên Đơn đề nghị) -> xem lại thông tin học viên + thời gian khám sức khoẻ -> Xác nhận vào lớp đang chọn.
 * Dùng được máy quét cầm tay (gõ mã + Enter vào ô) hoặc camera của máy.
 */
export default function QuetQrModal({ open, lop, maBanDau, onClose, onAdded }) {
  const [ma, setMa] = useState("");
  const [ketQua, setKetQua] = useState([]); // { ma, ok, text }
  const [camera, setCamera] = useState(false);
  const [hv, setHv] = useState(null); // học viên vừa quét, chờ xác nhận
  const [tgKham, setTgKham] = useState(null);
  const [dangTim, setDangTim] = useState(false);
  const [saving, setSaving] = useState(false);
  const [daThem, setDaThem] = useState(false); // đã tự động thêm vào lớp (HV đã có thông tin khám)
  const [layTu, setLayTu] = useState(null); // tên HV trước nếu thời gian khám lấy theo HV trước
  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const vuaQuet = useRef({ ma: "", t: 0 });

  useEffect(() => {
    if (!open) {
      setCamera(false);
      return;
    }
    setMa("");
    setKetQua([]);
    setHv(null);
    setDaThem(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  // Mở từ thao tác quét ngay trên trang -> xử lý luôn mã vừa quét
  useEffect(() => {
    if (open && maBanDau?.ma) timRef.current(maBanDau.ma);
  }, [open, maBanDau]);

  const ghi = (code, ok, text) => setKetQua((ds) => [{ ma: code, ok, text }, ...ds].slice(0, 30));

  // Thêm vào lớp (lưu kèm thời gian khám). tuDong = quét xong tự thêm, giữ popup để xem lại
  const khoaTruoc = lop ? `xl_kham_truoc_${lop.id}` : null;
  const docTruoc = () => {
    try {
      const v = JSON.parse(sessionStorage.getItem(khoaTruoc) || "null");
      return v?.tg ? { tg: dayjs(v.tg), ten: v.ten } : null;
    } catch {
      return null;
    }
  };
  const ghiTruoc = (tg, ten) => {
    try {
      sessionStorage.setItem(khoaTruoc, JSON.stringify({ tg: tg.format("YYYY-MM-DD HH:mm"), ten }));
    } catch {
      /* bỏ qua */
    }
  };

  const themVaoLop = async (d, tg, tuDong) => {
    setSaving(true);
    try {
      await xlQuetQr(lop.id, d.ma_ho_so, { thoi_gian_kham: tg ? tg.format("YYYY-MM-DD HH:mm") : undefined });
      ghi(d.ma_ho_so, true, `${d.ho_ten} — đã vào lớp ${tenLop(lop)}`);
      ghiTruoc(tg, d.ho_ten);
      message.success(`Đã thêm ${d.ho_ten} vào lớp ${tenLop(lop)}`);
      onAdded?.();
      if (tuDong) setDaThem(true);
      else setHv(null);
    } catch (e) {
      const loi = errMsg(e, "Không thêm được vào lớp");
      ghi(d.ma_ho_so, false, loi);
      message.error(loi);
      if (tuDong) setHv(null);
    } finally {
      setSaving(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Quét/gõ mã -> tra cứu. Không có trong danh sách -> báo không tìm thấy.
  // Có thông tin khám sức khoẻ -> tự thêm vào lớp; chưa có -> chờ nhập giờ khám + Xác nhận.
  const timMa = async (raw, { tuCamera = false } = {}) => {
    const code = String(raw || "").trim();
    if (!code) return;
    if (!lop) return message.warning("Chọn hoặc tạo lớp trước khi quét");
    if (dangTim || saving) return;
    if (hv && !daThem) return message.warning("Đang chờ xác nhận học viên trước — chọn thời gian khám rồi bấm Xác nhận, hoặc Hủy");
    const now = Date.now();
    if (tuCamera && vuaQuet.current.ma === code && now - vuaQuet.current.t < 3000) return; // camera đọc lặp cùng 1 mã
    vuaQuet.current = { ma: code, t: now };
    setDangTim(true);
    setMa("");
    try {
      const d = (await getXlTraCuu(code)).data;
      if (d.canh_bao) {
        const loi = `Không tìm thấy học viên trong danh sách (${d.ho_ten}: ${d.canh_bao.toLowerCase()})`;
        ghi(code, false, loi);
        message.error(loi);
        return;
      }
      // Có ngày khám -> dùng của HV; chưa có -> lấy theo HV quét trước đó (cùng lớp)
      const rieng = d.thoi_gian_kham ? dayjs(d.thoi_gian_kham) : d.ngay_kham ? dayjs(d.ngay_kham) : null;
      const truoc = rieng ? null : docTruoc();
      const tg = rieng || truoc?.tg || null;
      setDaThem(false);
      setLayTu(truoc ? truoc.ten || "học viên trước" : null);
      setHv(d);
      setTgKham(tg);
      if (tg) await themVaoLop(d, tg, true);
    } catch (e) {
      const loi = e?.response?.status === 404 ? "Không tìm thấy học viên" : errMsg(e, "Không tìm thấy học viên");
      ghi(code, false, loi);
      message.error(loi);
    } finally {
      setDangTim(false);
    }
  };

  const xacNhan = () => {
    if (!hv || saving) return;
    if (!tgKham) return message.warning("Chọn thời gian khám sức khỏe trước khi xác nhận");
    themVaoLop(hv, tgKham, false);
  };
  const huy = () => {
    if (hv) {
      setHv(null);
      setDaThem(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else onClose?.();
  };

  const timRef = useRef(timMa);
  timRef.current = timMa;

  // Camera: đọc khung hình liên tục bằng jsQR (tạm dừng khi đang xem học viên)
  useEffect(() => {
    if (!camera || (hv && !daThem)) return;
    let stream;
    let raf;
    let dung = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (dung) return stream.getTracks().forEach((t) => t.stop());
        const v = videoRef.current;
        v.srcObject = stream;
        await v.play();
        const doc = () => {
          if (dung) return;
          if (v.readyState === v.HAVE_ENOUGH_DATA) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
            if (code?.data) timRef.current(code.data, { tuCamera: true });
          }
          raf = requestAnimationFrame(doc);
        };
        doc();
      } catch {
        message.error("Không mở được camera — kiểm tra quyền truy cập camera của trình duyệt");
        setCamera(false);
      }
    })();
    return () => {
      dung = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camera, hv, daThem]);

  const coKham = !!tgKham;

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={hv ? "min(820px, 96vw)" : 540} destroyOnHidden centered
      styles={{ container: { padding: 0, overflow: "hidden", borderRadius: 24 }, body: { padding: 0 } }}>
      <div className="flex items-center gap-3 px-5 py-3 text-white" style={{ background: `linear-gradient(110deg, ${C.sidebar}, ${C.primary} 60%, ${C.light})` }}>
        <FaQrcode className="text-[24px]" />
        <span className="min-w-0 flex-1 truncate text-[18px] font-bold">Quét mã QR – {hv ? "Nhập thông tin học viên" : `Thêm vào lớp ${tenLop(lop) || ""}`}</span>
        <button type="button" onClick={onClose} aria-label="Đóng" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[16px]" style={{ color: C.sidebar }}>
          <FaXmark />
        </button>
      </div>

      {hv ? (
        <div className="flex flex-col gap-3 p-4" style={{ background: C.bg2 }}>
          {daThem && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-bold" style={{ background: "#DCF5E5", color: C.success }}>
              <FaCircleCheck className="text-[16px]" /> Đã tự động thêm {hv.ho_ten} vào lớp {tenLop(lop)}
              {layTu && <span className="font-semibold"> — thời gian khám lấy theo học viên trước ({layTu})</span>}
            </div>
          )}
          {!daThem && !tgKham && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold" style={{ background: "#FFF1DC", color: "#E8730C" }}>
              <FaTriangleExclamation /> Học viên đầu tiên chưa có thông tin khám sức khỏe — chọn thời gian khám rồi bấm Xác nhận (các học viên sau sẽ tự lấy theo)
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: C.border, boxShadow: SHADOW }}>
              <KhungTieuDe icon={<FaUser />}>Thông tin học viên</KhungTieuDe>
              <div className="px-4 pb-3 pt-1">
                <Dong icon={<FaUser />} label="Họ và tên:">{hv.ho_ten}</Dong>
                <Dong icon={<FaRegCalendarDays />} label="Ngày sinh:">{fmtDate(hv.ngay_sinh)}</Dong>
                <Dong icon={<FaIdCard />} label="CCCD:">{hv.cccd}</Dong>
                <Dong icon={<FaCar />} label="Hạng đăng ký:">{hv.hang}</Dong>
                <Dong icon={<FaFolder />} label="Mã hồ sơ:">{hv.ma_ho_so}</Dong>
                <Dong icon={<FaPhone />} label="SĐT học viên:">{hv.dien_thoai}</Dong>
                <Dong icon={<FaUsers />} label="Tên đầu mối:">{hv.dau_moi}</Dong>
                <Dong icon={<FaPhone />} label="SĐT đầu mối:">{hv.dau_moi_sdt}</Dong>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: C.border, boxShadow: SHADOW }}>
              <KhungTieuDe icon={<FaNotesMedical />}>Thông tin khám sức khỏe</KhungTieuDe>
              <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
                <div>
                  <div className="mb-1.5 text-[14px]" style={{ color: C.text }}>Thời gian khám sức khỏe</div>
                  <DatePicker showTime={{ format: "HH:mm", minuteStep: 5 }} format="DD/MM/YYYY  HH:mm" value={tgKham} onChange={setTgKham}
                    placeholder="Chọn ngày giờ khám" size="large" className="!h-11 w-full !rounded-lg [&_input]:!text-[15px] [&_input]:!font-semibold"
                    disabled={daThem || saving} />
                  {hv.kham_suc_khoe && <div className="mt-1.5 text-[13px]" style={{ color: C.sub }}>Hình thức: {hv.kham_suc_khoe}</div>}
                </div>
                {coKham ? (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-bold" style={{ background: "#DCF5E5", color: C.success }}>
                    <FaCircleCheck className="text-[17px]" /> {layTu ? "Lấy theo thời gian khám của học viên trước" : "Đã có thông tin khám sức khỏe"}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold" style={{ background: "#FFF1DC", color: "#E8730C" }}>
                    <FaTriangleExclamation className="text-[16px]" /> Chưa có thông tin khám sức khỏe
                  </div>
                )}
              </div>
            </div>
          </div>
          {daThem ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <Input ref={inputRef} size="large" placeholder="Quét / gõ mã hồ sơ tiếp theo..." value={ma} onChange={(e) => setMa(e.target.value)}
                onPressEnter={() => timMa(ma)} prefix={dangTim ? <Spin size="small" /> : <FaQrcode style={{ color: C.sub }} />} className="!h-11 !rounded-xl" />
              <button type="button" onClick={huy}
                className="flex h-11 items-center justify-center gap-3 rounded-xl border-2 bg-white px-8 font-bold transition hover:bg-[#F5F9FF]"
                style={{ borderColor: "#9cc3f5", color: C.sidebar, fontSize: 15 }}>
                <FaQrcode className="text-[16px]" /> Quét tiếp
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={huy}
              className="flex h-11 items-center justify-center gap-3 rounded-xl border-2 bg-white text-[15px] font-bold transition hover:bg-[#F5F9FF]"
              style={{ borderColor: "#9cc3f5", color: C.sidebar, fontSize: 15 }}>
              <FaXmark className="text-[16px]" /> Hủy
            </button>
            <button type="button" onClick={xacNhan} disabled={!tgKham || saving}
              className="flex h-11 items-center justify-center gap-3 rounded-xl text-[15px] font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(180deg, #2fc46c, #148a3f)", color: "#fff", boxShadow: "0 6px 16px rgba(22,163,74,0.35)", fontSize: 15 }}>
              {saving ? <Spin size="small" /> : <FaCheck className="text-[16px]" />} Xác nhận
            </button>
          </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-5" style={{ background: C.bg2 }}>
          <div className="text-[14px]" style={{ color: C.text }}>
            Quét mã QR in trên <b>Đơn đề nghị</b> của học viên (máy quét cầm tay hoặc camera), hoặc gõ mã hồ sơ rồi nhấn Enter.
          </div>
          <div className="flex gap-2">
            <Input ref={inputRef} size="large" placeholder="Mã hồ sơ..." value={ma} onChange={(e) => setMa(e.target.value)}
              onPressEnter={() => timMa(ma)} prefix={dangTim ? <Spin size="small" /> : <FaQrcode style={{ color: C.sub }} />} />
            <button type="button" onClick={() => setCamera((v) => !v)}
              className="flex shrink-0 items-center gap-2 rounded-lg border px-4 text-[14px] font-semibold"
              style={camera ? { background: C.primary, color: "#fff", borderColor: C.primary } : { background: "#fff", color: C.sidebar, borderColor: C.border }}>
              <FaCamera /> {camera ? "Tắt camera" : "Dùng camera"}
            </button>
          </div>
          {camera && <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-xl bg-black object-cover" />}
          <div className="max-h-[240px] overflow-auto rounded-xl border bg-white" style={{ borderColor: C.border }}>
            {ketQua.length ? (
              ketQua.map((k, i) => (
                <div key={i} className="flex items-start gap-2 border-b px-3 py-2 text-[14px] last:border-b-0" style={{ borderColor: C.border }}>
                  <span className="mt-0.5 shrink-0" style={{ color: k.ok ? C.success : C.danger }}>{k.ok ? <FaCircleCheck /> : <FaCircleXmark />}</span>
                  <span className="shrink-0 font-semibold" style={{ color: C.title }}>{k.ma}</span>
                  <span style={{ color: k.ok ? C.text : C.danger }}>{k.text}</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-[14px]" style={{ color: C.sub }}>Chưa quét mã nào</div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
