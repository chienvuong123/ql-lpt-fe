/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from "react";
import { Button, Descriptions, Empty, Image, Input, Modal, Segmented, Spin, Tag, Timeline, Tooltip, message } from "antd";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  ExclamationCircleFilled,
  PrinterFilled,
  ScanOutlined,
  CameraOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { FaRegCalendarAlt } from "react-icons/fa";
import { MdOutlineAccessTime } from "react-icons/md";
import dayjs from "dayjs";
import jsQR from "jsqr";
import { useQuery } from "@tanstack/react-query";
import { getChiTietHoSo } from "../../apis/apiTiepSinh";
import { inHtml } from "../../util/inAn";

export const BLUE = "#1d5fd6";
export const BLUE_DARK = "#0f3f9e";
export const CENTER_NAME = "Trung tâm GDNN&SHLX Lập Phương Thành";

export const TRANG_THAI_META = {
  cho_duyet: { label: "Chờ duyệt", color: "#1d6fe0", bg: "#e8f1ff", icon: <ClockCircleFilled /> },
  can_bo_sung: { label: "Cần bổ sung", color: "#e8780c", bg: "#fff3e6", icon: <ExclamationCircleFilled /> },
  da_duyet: { label: "Đã duyệt", color: "#16a34a", bg: "#e8f8ee", icon: <CheckCircleFilled /> },
  da_in: { label: "Đã in", color: "#7c3aed", bg: "#f2ecff", icon: <PrinterFilled /> },
  bo_hoc: { label: "Bỏ học", color: "#64748b", bg: "#eef1f5", icon: <StopOutlined /> },
};

export const NGUON_META = {
  google_sheet: { label: "HV tự khai", color: "cyan" },
  cccd: { label: "Quét CCCD", color: "geekblue" },
  may_tinh: { label: "Máy tính tại phòng", color: "purple" },
};

export const HANG_OPTIONS = [
  { value: "A1", label: "A1 - Mô tô đến 125 cm³" },
  { value: "A", label: "A - Mô tô trên 125 cm³" },
];

// Theo đúng lựa chọn trên Google Form "Lựa chọn loại hình học"
export const LOAI_HINH_OPTIONS = [
  { value: "Hạng A1", label: "Hạng A1", hang: "A1", giaKey: "gia_a1" },
  { value: "Hạng A - Xe côn tay (A)", label: "Hạng A - Xe côn tay (A)", hang: "A", giaKey: "gia_a_con_tay" },
  { value: "Hạng A - Xe tay ga (A.02)", label: "Hạng A - Xe tay ga (A.02)", hang: "A", giaKey: "gia_a_tay_ga" },
];
// Theo Google Form "Khám sức khoẻ"
export const KHAM_SK_TRUNG_TAM = "Khám theo lịch trung tâm";
export const KHAM_SK_TU_KHAM = "Tự khám - tự nộp";
export const KHAM_SK_OPTIONS = [
  { value: KHAM_SK_TRUNG_TAM, label: KHAM_SK_TRUNG_TAM },
  { value: "Tự khám - tự nộp", label: "Tự khám - tự nộp" },
];

export const loaiHinhMeta = (v) => LOAI_HINH_OPTIONS.find((o) => o.value === v) || null;
export const hangTuLoaiHinh = (v) => loaiHinhMeta(v)?.hang || (/^hạng\s*a1/i.test(v || "") ? "A1" : v ? "A" : null);
export const fmtTien = (n) => (n === null || n === undefined || n === "" ? "" : `${Number(n).toLocaleString("vi-VN")} đ`);
const soTien = (v) => {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  return s ? Number(s) : null;
};

/**
 * Số tiền phải thu = học phí theo loại hình + phí khám sức khoẻ (nếu khám theo lịch trung tâm).
 * hs.tong_thu (nhập tay / cột "Tổng thu" trên Sheet) được ưu tiên.
 * -> { tong, hocPhi, phiKham, thieuGia }
 */
export function tinhPhaiThu(hs, cfg = {}) {
  if (!hs) return null;
  const meta = loaiHinhMeta(hs.loai_hinh);
  const giaGoc = meta ? soTien(cfg[meta.giaKey]) : null;
  // Đã có GPLX ô tô -> giảm trừ học phí theo bảng giá
  const giamTru = hs.gplx_hang ? soTien(cfg.giam_tru_gplx) || 0 : 0;
  const hocPhi = giaGoc === null ? null : Math.max(0, giaGoc - giamTru);
  const phiKham = hs.kham_suc_khoe === KHAM_SK_TRUNG_TAM ? soTien(cfg.phi_kham_suc_khoe) : 0;
  const nhapTay = soTien(hs.tong_thu);
  // Tiền HV khác chuyển sang (chuyển học phí / phí khám) -> trừ vào số còn phải thu
  const duocChuyen = Number(hs.tien_duoc_chuyen) || 0;
  const conLai = (tong) => (tong === null ? null : tong - duocChuyen);
  if (nhapTay !== null) return { tong: nhapTay, hocPhi, phiKham, nhapTay: true, duocChuyen, conLai: conLai(nhapTay) };
  const thieuGia = hocPhi === null || phiKham === null;
  const tong = thieuGia ? null : hocPhi + phiKham;
  return {
    tong, hocPhi, phiKham, thieuGia, duocChuyen, conLai: conLai(tong),
    giamTru: giaGoc === null ? 0 : giaGoc - hocPhi,
    chuaCaiGiamTru: !!hs.gplx_hang && !soTien(cfg.giam_tru_gplx),
  };
}

/** Số tiền còn phải thu (đã trừ tiền được chuyển sang) */
export const conPhaiThu = (hs, cfg) => {
  const t = tinhPhaiThu(hs, cfg);
  return t ? t.conLai : null;
};

// ─── Đầu mối tuyển sinh ─────────────────────────────
export const DAU_MOI_MAC_DINH = "TT";
export const boDau = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Gợi ý đầu mối chuẩn cho tên HV tự ghi (vd "Hiếu" -> "Nguyễn Minh Hiếu").
 * Khớp khi mọi từ HV ghi đều có trong tên chuẩn (không phân biệt dấu). Trả [] nếu đã là tên chuẩn.
 */
export function goiYDauMoi(raw, list = []) {
  const q = boDau(raw);
  if (!q) return [];
  if (list.some((d) => d.ten === String(raw).trim())) return [];
  const tu = q.split(" ");
  return list
    .filter((d) => {
      const ten = boDau(d.ten).split(" ");
      return tu.every((t) => ten.includes(t));
    })
    .slice(0, 5)
    .map((d) => d.ten);
}

/** Kiểm tra số: { ok, msg } — CCCD 12 số, SĐT di động 10 số (chấp nhận +84) */
export function kiemTraSo(v, loai) {
  const raw = String(v || "").trim();
  if (!raw) return { ok: false, msg: "Chưa nhập" };
  let so = raw.replace(/[^\d]/g, "");
  if (loai === "sdt" && so.startsWith("84") && so.length === 11) so = `0${so.slice(2)}`;
  const can = loai === "sdt" ? 10 : 12;
  const ten = loai === "sdt" ? "SĐT" : "CCCD";
  if (/[^\d\s.+]/.test(raw)) return { ok: false, msg: `${ten} có ký tự không phải số: "${raw}"` };
  if (so.length > can) return { ok: false, msg: `${ten} "${raw}" thừa ${so.length - can} số (cần ${can} số)` };
  if (so.length < can) return { ok: false, msg: `${ten} "${raw}" thiếu ${can - so.length} số (cần ${can} số)` };
  if (loai === "sdt" && !so.startsWith("0")) return { ok: false, msg: `SĐT "${raw}" phải bắt đầu bằng 0` };
  return { ok: true, msg: so };
}

/** Tải ảnh chân dung, tên file = mã hồ sơ (vd 2611200001.jpg) */
export function taiAnhHoSo(hs) {
  if (!hs?.anh_chan_dung) return;
  const m = /^data:image\/(\w+)/.exec(hs.anh_chan_dung);
  const ext = m ? (m[1] === "jpeg" ? "jpg" : m[1]) : "jpg";
  const a = document.createElement("a");
  a.href = hs.anh_chan_dung;
  a.download = `${hs.ma_ho_so || hs.id}.${ext}`;
  a.click();
}

export const WEEKDAYS =["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export const fmtDate = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "");
export const fmtDateTime = (v) => (v ? dayjs(v).format("HH:mm - DD/MM/YYYY") : "");
export const fmtWait = (sec) => {
  const s = Math.max(0, Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h > 99 ? `${Math.floor(h / 24)} ngày` : `${p(h)}:${p(m)}:${p(ss)}`;
};

// ─── Trạng thái hiển thị thống nhất (4 loại) ─────────────────────────────
// Chờ duyệt (cam) · Bổ sung (vàng) · Duyệt (xanh, gồm cả đã in) · Bỏ học (đỏ)
export const TRANG_THAI_HIEN_THI = {
  cho_duyet: { label: "Chờ duyệt", color: "#c2410c", bg: "#ffedd5", icon: <ClockCircleFilled /> },
  bo_sung: { label: "Bổ sung", color: "#a16207", bg: "#fef3c7", icon: <ExclamationCircleFilled /> },
  duyet: { label: "Duyệt", color: "#15803d", bg: "#dcfce7", icon: <CheckCircleFilled /> },
  bo_hoc: { label: "Bỏ học", color: "#dc2626", bg: "#fee2e2", icon: <StopOutlined /> },
};

/** Bộ lọc trạng thái (giá trị gửi lên API) */
export const LOC_TRANG_THAI = [
  { value: "cho_duyet", label: "Chờ duyệt" },
  { value: "can_bo_sung", label: "Bổ sung" },
  { value: "duyet", label: "Duyệt" },
  { value: "bo_hoc", label: "Bỏ học" },
];

/** Hồ sơ -> 1 trong 4 trạng thái hiển thị (duyệt có điều kiện tính là "Bổ sung") */
export function trangThaiHienThi(hs) {
  const t = typeof hs === "string" ? hs : hs?.trang_thai;
  if (t === "bo_hoc") return "bo_hoc";
  if (t === "can_bo_sung" || (typeof hs === "object" && hs?.can_bo_sung_sau)) return "bo_sung";
  if (t === "da_duyet" || t === "da_in") return "duyet";
  return "cho_duyet";
}

/** Chi tiết phụ của trạng thái (tooltip / Excel) */
export function chiTietTrangThai(hs) {
  if (!hs || typeof hs !== "object") return "";
  const daIn = hs.trang_thai === "da_in" ? `đã in${hs.so_lan_in > 1 ? ` ${hs.so_lan_in} lần` : ""}` : "";
  const k = trangThaiHienThi(hs);
  if (k === "bo_sung") {
    const truoc = hs.trang_thai === "da_in" ? "Đã in" : hs.can_bo_sung_sau ? "Đã duyệt" : "";
    return [truoc, hs.ly_do_bo_sung ? `cần bổ sung: ${hs.ly_do_bo_sung}` : "cần bổ sung"].filter(Boolean).join(" — ");
  }
  if (k === "duyet") return daIn || "chưa in";
  if (k === "bo_hoc") return hs.ly_do_bo_hoc || "";
  return "";
}

/** Nhãn trạng thái. hs (cả hồ sơ) cho kết quả chính xác nhất; value = mã trạng thái thô */
export function StatusTag({ value, hs, size = "default", tooltip = true }) {
  const meta = TRANG_THAI_HIEN_THI[trangThaiHienThi(hs || value)];
  const ct = tooltip ? chiTietTrangThai(hs) : "";
  const tag = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${
        size === "large" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
  return ct ? <Tooltip title={ct}>{tag}</Tooltip> : tag;
}

// ─── Đồng hồ + ngày ─────────────────────────────────────
export function useNow() {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function HeaderBanner({ title, subtitle, icon, extra }) {
  const now = useNow();
  const name = sessionStorage.getItem("name") || sessionStorage.getItem("username") || "Nhân viên";
  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-4 text-white shadow-md"
      style={{ background: `linear-gradient(110deg, ${BLUE_DARK} 0%, ${BLUE} 55%, #4f8ff7 100%)` }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
      />
      <div className="relative flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xl font-bold sm:text-2xl">{title}</div>
            <div className="text-sm italic text-blue-100">{subtitle}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FaRegCalendarAlt className="text-xl text-blue-100" />
            <div className="leading-tight">
              <div className="text-blue-100">
                {WEEKDAYS[now.day()]}, {now.format("DD/MM/YYYY")}
              </div>
              <div className="flex items-center gap-1 text-lg font-bold tabular-nums">
                <MdOutlineAccessTime /> {now.format("HH:mm:ss")}
              </div>
            </div>
          </div>
          <div className="hidden h-10 w-px bg-white/30 sm:block" />
          <div className="leading-tight">
            <div className="font-semibold">{name}</div>
            <div className="flex items-center gap-1 text-xs text-blue-100">
              <span className="h-2 w-2 rounded-full bg-green-400" /> Tổ tiếp sinh · Trực tuyến
            </div>
          </div>
          {extra}
        </div>
      </div>
    </div>
  );
}

export function Panel({ title, icon, extra, children, className = "", bodyClassName = "p-4", headerStyle, titleClassName = "text-slate-800" }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm ${className}`}>
      {title && (
        <div
          className="flex items-center justify-between gap-2 border-b border-blue-50 px-4 py-3"
          style={headerStyle}
        >
          <div className={`flex items-center gap-2 text-base font-semibold ${titleClassName}`}>
            {icon && <span style={{ color: BLUE }}>{icon}</span>}
            {title}
          </div>
          {extra}
        </div>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

// ─── CCCD gắn chip: QR "cccd|cmnd|họ tên|ddmmyyyy|giới tính|địa chỉ|ddmmyyyy(ngày cấp)" ───
const ddmmyyyyToIso = (s) => {
  const m = String(s || "").match(/^(\d{2})(\d{2})(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

export function parseCccdQr(text) {
  const parts = String(text || "").trim().split("|");
  if (parts.length < 6 || !/^\d{12}$/.test(parts[0])) return null;
  return {
    cccd: parts[0],
    cmnd_cu: parts[1] || null,
    ho_ten: parts[2] || null,
    ngay_sinh: ddmmyyyyToIso(parts[3]),
    gioi_tinh: parts[4] || null,
    dia_chi: parts[5] || null,
    ngay_cap_cccd: ddmmyyyyToIso(parts[6]),
  };
}

/**
 * Quét QR trên CCCD: dùng camera (jsQR) hoặc máy quét cầm tay (gõ như bàn phím vào ô nhập).
 */
export function CccdScanModal({ open, onClose, onResult }) {
  const [mode, setMode] = useState("camera");
  const [text, setText] = useState("");
  const [camErr, setCamErr] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const inputRef = useRef(null);

  const handleText = (value) => {
    const data = parseCccdQr(value);
    if (!data) {
      message.error("Không đọc được dữ liệu CCCD. Hãy quét mã QR ở mặt trước thẻ CCCD gắn chip.");
      return false;
    }
    onResult(data);
    setText("");
    return true;
  };

  useEffect(() => {
    if (!open || mode !== "camera") return undefined;
    let stopped = false;
    setCamErr(null);
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        const tick = () => {
          if (stopped) return;
          const canvas = canvasRef.current;
          if (video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
            const w = video.videoWidth;
            const h = video.videoHeight;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
            if (code?.data && parseCccdQr(code.data)) {
              handleText(code.data);
              return;
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        setCamErr(err?.message || "Không mở được camera");
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  useEffect(() => {
    if (open && mode === "may_quet") setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, mode]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={560}
      title={
        <span className="flex items-center gap-2">
          <ScanOutlined style={{ color: BLUE }} /> Quét mã QR trên CCCD
        </span>
      }
    >
      <Segmented
        block
        value={mode}
        onChange={setMode}
        className="mb-3"
        options={[
          { value: "camera", label: "Camera / Webcam", icon: <CameraOutlined /> },
          { value: "may_quet", label: "Máy quét cầm tay", icon: <ScanOutlined /> },
        ]}
      />
      {mode === "camera" ? (
        <div>
          <div className="relative overflow-hidden rounded-xl bg-slate-900" style={{ aspectRatio: "16/10" }}>
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-1/2 w-2/5 rounded-xl border-4 border-dashed border-white/80" />
            </div>
            {camErr && (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white">
                {camErr}
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-2 text-center text-xs text-slate-500">
            Đưa mã QR ở góc trên bên phải mặt trước CCCD vào khung — hệ thống tự nhận dạng.
          </div>
        </div>
      ) : (
        <div>
          <Input.TextArea
            ref={inputRef}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPressEnter={(e) => {
              e.preventDefault();
              handleText(text);
            }}
            placeholder="Đặt con trỏ vào đây rồi quét mã QR trên CCCD bằng máy quét..."
          />
          <div className="mt-2 flex justify-end">
            <Button type="primary" onClick={() => handleText(text)} disabled={!text.trim()}>
              Đọc dữ liệu
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Ảnh ─────────────────────────────────────
/** Thu ảnh về khung 3x4, rộng tối đa 600px, JPEG ~85% */
export function toPortraitDataUrl(source, srcW, srcH) {
  const ratio = 3 / 4;
  let cw = srcW;
  let ch = srcW / ratio;
  if (ch > srcH) {
    ch = srcH;
    cw = srcH * ratio;
  }
  const sx = (srcW - cw) / 2;
  const sy = (srcH - ch) / 2;
  const outW = Math.min(600, Math.round(cw));
  const outH = Math.round(outW / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  canvas.getContext("2d").drawImage(source, sx, sy, cw, ch, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function fileToPortraitDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      try {
        resolve(toPortraitDataUrl(img, img.naturalWidth, img.naturalHeight));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được ảnh"));
    };
    img.src = url;
  });
}

// ─── In hồ sơ ─────────────────────────────────────
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildPrintHtml(hs) {
  const line = (label, value, extra = "") =>
    `<div class="row"><span class="lb">${label}</span><span class="val">${esc(value) || "&nbsp;"}</span>${extra}</div>`;
  const now = dayjs();
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(hs.ma_ho_so)} - ${esc(hs.ho_ten)}</title>
<style>
  @page { size: A4; margin: 18mm 18mm 16mm 22mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", serif; font-size: 14pt; color: #000; margin: 0; }
  .top { display: flex; justify-content: space-between; text-align: center; font-size: 12.5pt; }
  .top b { display: block; }
  .top .u { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 2px; }
  h1 { text-align: center; font-size: 15pt; margin: 22px 0 4px; }
  .sub { text-align: center; font-style: italic; margin-bottom: 18px; }
  .head { display: flex; gap: 18px; align-items: flex-start; }
  .photo { width: 30mm; height: 40mm; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10pt; text-align: center; flex-shrink: 0; overflow: hidden; }
  .photo img { width: 100%; height: 100%; object-fit: cover; }
  .row { display: flex; gap: 6px; margin: 7px 0; line-height: 1.35; }
  .lb { white-space: nowrap; }
  .val { flex: 1; border-bottom: 1px dotted #555; font-weight: bold; min-height: 1.3em; }
  .row .lb2 { white-space: nowrap; margin-left: 10px; }
  .row .val2 { width: 32%; border-bottom: 1px dotted #555; font-weight: bold; }
  p { margin: 9px 0; line-height: 1.45; text-align: justify; }
  .sign { display: flex; justify-content: space-between; margin-top: 18px; text-align: center; }
  .sign div { width: 46%; }
  .sign .space { height: 80px; }
  .foot { margin-top: 26px; font-size: 10.5pt; color: #333; border-top: 1px solid #999; padding-top: 6px; display: flex; justify-content: space-between; }
</style></head><body>
  <div class="top">
    <div><b>${esc(CENTER_NAME.toUpperCase())}</b><span class="u">TỔ TIẾP SINH</span></div>
    <div><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><span class="u">Độc lập - Tự do - Hạnh phúc</span></div>
  </div>
  <h1>ĐƠN ĐỀ NGHỊ HỌC, SÁT HẠCH ĐỂ CẤP GIẤY PHÉP LÁI XE</h1>
  <div class="sub">Kính gửi: ${esc(CENTER_NAME)}</div>
  <div class="head">
    <div class="photo">${hs.anh_chan_dung ? `<img alt="Ảnh học viên" src="${hs.anh_chan_dung}" />` : "Ảnh màu<br/>3 x 4"}</div>
    <div style="flex:1">
      ${line("Tôi là:", (hs.ho_ten || "").toUpperCase())}
      <div class="row"><span class="lb">Sinh ngày:</span><span class="val">${esc(fmtDate(hs.ngay_sinh))}</span><span class="lb2">Giới tính:</span><span class="val2">${esc(hs.gioi_tinh)}</span></div>
      ${line("Quốc tịch:", hs.quoc_tich || "Việt Nam")}
      ${line("Số định danh cá nhân (CCCD):", hs.cccd)}
    </div>
  </div>
  <div class="row"><span class="lb">Ngày cấp:</span><span class="val">${esc(fmtDate(hs.ngay_cap_cccd))}</span><span class="lb2">Nơi cấp:</span><span class="val2" style="width:45%">${esc(hs.noi_cap || "Cục Cảnh sát QLHC về TTXH")}</span></div>
  ${line("Nơi cư trú:", hs.dia_chi)}
  ${hs.noi_o_hien_tai ? line("Nơi ở hiện tại:", hs.noi_o_hien_tai) : ""}
  <div class="row"><span class="lb">Số điện thoại:</span><span class="val">${esc(hs.dien_thoai)}</span><span class="lb2">Email:</span><span class="val2">${esc(hs.email)}</span></div>
  <p>Đề nghị cho tôi được học, dự sát hạch để cấp giấy phép lái xe hạng: <b>${esc(hs.hang)}</b>
  ${hs.khoa_hoc ? ` — ${esc(hs.khoa_hoc)}` : ""}${hs.dia_diem_hoc ? `, địa điểm học: <b>${esc(hs.dia_diem_hoc)}</b>` : ""}.</p>
  <p>Tôi xin cam đoan những điều ghi trên là đúng sự thật, các giấy tờ kèm theo là hợp pháp. Nếu sai tôi xin hoàn toàn chịu trách nhiệm trước pháp luật và chấp hành nghiêm chỉnh nội quy, quy chế đào tạo của Trung tâm.</p>
  <div class="sign">
    <div><b>NGƯỜI TIẾP NHẬN</b><br/><i>(Ký, ghi rõ họ tên)</i><div class="space"></div><b>${esc(hs.nguoi_duyet || "")}</b></div>
    <div><i>Hải Phòng, ngày ${now.format("DD")} tháng ${now.format("MM")} năm ${now.format("YYYY")}</i><br/><b>NGƯỜI LÀM ĐƠN</b><br/><i>(Ký và ghi rõ họ tên)</i><div class="space"></div><b>${esc(hs.ho_ten)}</b></div>
  </div>
  <div class="foot"><span>Mã hồ sơ: <b>${esc(hs.ma_ho_so)}</b></span><span>Nộp: ${esc(fmtDateTime(hs.thoi_gian_khai))}</span><span>Duyệt: ${esc(fmtDateTime(hs.duyet_at))}</span></div>
</body></html>`;
}

/** In bằng iframe ẩn để không bị trình duyệt chặn popup */
export function printHoSo(hs) {
  inHtml(buildPrintHtml(hs));
}

// ─── Chi tiết hồ sơ (modal) ─────────────────────────────────────
const LOG_LABEL = {
  tao_moi: "Tạo hồ sơ",
  cap_nhat: "Cập nhật",
  chup_anh: "Chụp ảnh",
  duyet: "Duyệt",
  tra_bo_sung: "Trả bổ sung",
  mo_lai: "Mở lại",
  in: "In hồ sơ",
  chuyen_hoc_phi_di: "Chuyển học phí đi",
  chuyen_hoc_phi_den: "Nhận học phí chuyển đến",
  chuyen_hang: "Chuyển hạng",
  chuyen_phi_kham_di: "Chuyển phí khám đi",
  chuyen_phi_kham_den: "Nhận phí khám chuyển đến",
  hoan_phi_kham: "Hoàn phí khám",
  bo_hoc: "Bỏ học",
  nop_ke_toan: "Gửi kế toán",
  kt_duyet_thu: "Kế toán duyệt thu",
  thu_phi: "Kế toán thu phí",
};
const LOG_COLOR = {
  duyet: "green", tra_bo_sung: "orange", in: "purple", tao_moi: "blue",
  chuyen_hoc_phi_di: "red", chuyen_hoc_phi_den: "green", chuyen_hang: "blue",
  chuyen_phi_kham_di: "red", chuyen_phi_kham_den: "green", hoan_phi_kham: "orange", bo_hoc: "gray", nop_ke_toan: "cyan", kt_duyet_thu: "gold", thu_phi: "gold",
};

export function HoSoDetailModal({ id, open, onClose, footer }) {
  const { data, isLoading } = useQuery({
    queryKey: ["tiep-sinh-ho-so", id],
    queryFn: () => getChiTietHoSo(id),
    enabled: !!id && open,
    staleTime: 0,
  });
  const hs = data?.data;
  return (
    <Modal open={open} onCancel={onClose} width={860} footer={footer ?? null} destroyOnHidden
      title={hs ? <span>{hs.ho_ten} <span className="font-normal text-slate-500">· {hs.ma_ho_so}</span></span> : "Chi tiết hồ sơ"}>
      {isLoading ? (
        <div className="py-16 text-center"><Spin /></div>
      ) : !hs ? (
        <Empty />
      ) : (
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2">
            {hs.anh_chan_dung ? (
              <Image src={hs.anh_chan_dung} width={150} className="rounded-xl" />
            ) : (
              <div className="flex h-[200px] w-[150px] items-center justify-center rounded-xl bg-slate-100 text-slate-400">Chưa có ảnh</div>
            )}
            <StatusTag hs={hs} />
          </div>
          <div className="min-w-0 flex-1">
            <Descriptions size="small" column={2} bordered
              items={[
                { label: "Họ và tên", children: <b>{hs.ho_ten}</b> },
                { label: "Ngày sinh", children: fmtDate(hs.ngay_sinh) },
                { label: "Giới tính", children: hs.gioi_tinh },
                { label: "CCCD", children: hs.cccd },
                { label: "Ngày cấp", children: fmtDate(hs.ngay_cap_cccd) },
                { label: "SĐT", children: hs.dien_thoai },
                { label: "Địa chỉ", children: hs.dia_chi, span: 2 },
                { label: "Loại hình", children: hs.loai_hinh || hs.hang },
                { label: "Khám SK", children: `${hs.kham_suc_khoe || ""}${hs.ngay_kham ? ` · ngày khám ${fmtDate(hs.ngay_kham)}` : ""}` },
                ...(hs.gplx_hang || hs.gplx_so ? [{ label: "GPLX ô tô", children: `Hạng ${hs.gplx_hang || "?"} · số ${hs.gplx_so || "-"} · cấp ${fmtDate(hs.gplx_ngay_cap) || "-"}`, span: 2 }] : []),
                ...(hs.tien_duoc_chuyen ? [{ label: "Được chuyển", children: <span className="font-semibold text-green-600">{fmtTien(hs.tien_duoc_chuyen)}</span> }] : []),
                ...(hs.khoa_da_vao ? [{ label: "Đã vào khoá", children: hs.khoa_da_vao }] : []),
                ...(hs.trang_thai === "bo_hoc" ? [{ label: "Bỏ học", children: `${fmtDateTime(hs.bo_hoc_at)} — ${hs.ly_do_bo_hoc || ""}`, span: 2 }] : []),
                { label: "Nguồn", children: <Tag color={NGUON_META[hs.nguon]?.color}>{NGUON_META[hs.nguon]?.label || hs.nguon}</Tag> },
                { label: "Đầu mối", children: hs.dau_moi },
                { label: "Đối chiếu CCCD", children: hs.da_doi_chieu_cccd ? <Tag color="green">Đã đối chiếu</Tag> : <Tag>Chưa</Tag> },
                { label: "Thời gian khai", children: fmtDateTime(hs.thoi_gian_khai) },
                { label: "Người duyệt", children: hs.nguoi_duyet },
                ...(hs.ly_do_bo_sung ? [{ label: "Cần bổ sung", children: <span className="text-orange-600">{hs.ly_do_bo_sung}</span>, span: 2 }] : []),
                ...(hs.thieu_truong?.length ? [{ label: "Còn thiếu", children: <span className="text-red-500">{hs.thieu_truong.join(", ")}</span>, span: 2 }] : []),
              ]}
            />
            <div className="mb-2 mt-4 font-semibold">Lịch sử xử lý</div>
            <Timeline
              items={(hs.lich_su || []).map((l) => ({
                color: LOG_COLOR[l.hanh_dong] || "gray",
                children: (
                  <div className="text-sm">
                    <b>{LOG_LABEL[l.hanh_dong] || l.hanh_dong}</b>
                    <span className="text-slate-500"> · {fmtDateTime(l.created_at)}{l.nguoi ? ` · ${l.nguoi}` : ""}</span>
                    {l.so_tien ? (
                      <span className={`ml-2 font-semibold ${l.so_tien > 0 ? "text-green-600" : "text-red-500"}`}>
                        {l.so_tien > 0 ? "+" : "−"}{fmtTien(Math.abs(l.so_tien))}
                      </span>
                    ) : null}
                    {l.noi_dung && <div className="text-slate-600">{l.noi_dung}</div>}
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Hộp thoại nhập nội dung cần bổ sung */
export function TraBoSungModal({ open, onClose, onSubmit, loading, thieu = [] }) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (open) setValue(thieu.length ? `Bổ sung: ${thieu.join(", ")}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Trả hồ sơ yêu cầu bổ sung"
      okText="Trả hồ sơ"
      okButtonProps={{ danger: true, loading, disabled: !value.trim() }}
      onOk={() => onSubmit(value.trim())}
      destroyOnHidden
    >
      <Input.TextArea rows={4} value={value} onChange={(e) => setValue(e.target.value)}
        placeholder="Nội dung học viên cần bổ sung (giấy tờ, thông tin...)" />
    </Modal>
  );
}
