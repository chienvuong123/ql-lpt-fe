// Phiếu thu theo mẫu "01_TT_Phieu_thu" (MISA, A4 dọc, Nợ 1111 / Có 1311)
import dayjs from "dayjs";
import { fmtTien } from "../tiep-sinh/tiepSinhShared";

export const HINH_THUC = { tien_mat: "Tiền mặt", chuyen_khoan: "Chuyển khoản" };
// Địa chỉ người nộp khi Phòng tiếp sinh nộp (theo mẫu)
const DIA_CHI_TIEP_SINH = "P. Lê Thanh Nghị - TP. Hải Phòng";
// Liệt kê mã hồ sơ ngay trong "Lý do nộp" khi ít; nhiều thì in bảng kê kèm theo
const TOI_DA_MA_TRONG_LY_DO = 8;

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const soVnd = (n) => `${Number(n || 0).toLocaleString("vi-VN")} VND`;

/** "Hạng A - Xe tay ga (A.02)" -> "Mô tô A.02" */
export const tenKhoa = (r) => {
  const m = String(r?.loai_hinh || "").match(/\(([^)]+)\)\s*$/);
  if (m) return `Mô tô ${m[1]}`;
  if (/a1/i.test(r?.loai_hinh || "")) return "Mô tô A1";
  return r?.loai_hinh || (r?.hang ? `Mô tô ${r.hang}` : "");
};

// ─── Đọc số tiền bằng chữ ─────────────────────────────
const CHU_SO = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
function docBaSo(n, day) {
  const tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10;
  const out = [];
  if (day || tr) out.push(`${CHU_SO[tr]} trăm`);
  if (ch > 1) out.push(`${CHU_SO[ch]} mươi`);
  else if (ch === 1) out.push("mười");
  else if ((day || tr) && dv) out.push("lẻ");
  if (dv) out.push(dv === 5 && ch ? "lăm" : dv === 1 && ch > 1 ? "mốt" : dv === 4 && ch > 1 ? "tư" : CHU_SO[dv]);
  return out.join(" ");
}
export function docSoTien(so) {
  let n = Math.floor(Number(so) || 0);
  if (!n) return "Không đồng";
  const donVi = ["", " nghìn", " triệu", " tỷ"];
  const nhom = [];
  while (n > 0) {
    nhom.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts = [];
  for (let i = nhom.length - 1; i >= 0; i--) {
    if (!nhom[i]) continue;
    parts.push(docBaSo(nhom[i], i < nhom.length - 1) + (donVi[i] ?? ""));
  }
  const s = `${parts.join(" ")} đồng`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CSS = `
  @page { size: A4 portrait; margin: 12mm 14mm; }
  body { font-family: "Times New Roman", serif; font-size: 12pt; color: #000; margin: 0; }
  .trang { page-break-after: always; } .trang:last-child { page-break-after: auto; }
  .head { display: grid; grid-template-columns: 1fr 1.2fr 1fr; align-items: start; }
  .title { text-align: center; font-size: 16pt; font-weight: bold; margin-top: 4px; }
  .ngay { text-align: center; font-weight: bold; font-style: italic; margin-top: 6px; }
  .tk { line-height: 1.55; padding-left: 18px; } .tk td { padding: 0 6px 0 0; }
  .body { margin-top: 10px; line-height: 1.75; }
  .lbl { display: inline-block; min-width: 0; }
  .b { font-weight: bold; } .i { font-style: italic; }
  .ngay2 { text-align: right; font-style: italic; font-size: 11pt; margin: 12px 40px 0 0; }
  .ky { display: grid; grid-template-columns: repeat(5, 1fr); text-align: center; margin-top: 4px; }
  .ky .t { font-weight: bold; } .ky .g { font-style: italic; font-size: 11pt; }
  .ky .ten { margin-top: 64px; font-weight: bold; min-height: 18px; }
  .nhan { margin-top: 14px; }
  h2 { text-align: center; font-size: 14pt; margin: 0 0 4px; }
  .sub { text-align: center; font-style: italic; margin-bottom: 8px; }
  table.bk { width: 100%; border-collapse: collapse; }
  table.bk th, table.bk td { border: 1px solid #000; padding: 3px 6px; font-size: 11.5pt; }
  table.bk th { background: #eee; } .c { text-align: center; } .r { text-align: right; white-space: nowrap; }
`;

/**
 * 1 phiếu thu.
 * d: { so_phieu, created_at, nguoi_nop, dia_chi, ly_do, so_tien, kem_theo, nguoi_lap }
 */
function phieuHtml(d) {
  const t = dayjs(d.created_at || undefined);
  return `<section class="trang">
  <div class="head">
    <div></div>
    <div>
      <div class="title">PHIẾU THU</div>
      <div class="ngay">Ngày ${t.format("DD")} tháng ${t.format("MM")} năm ${t.format("YYYY")}</div>
    </div>
    <table class="tk">
      <tr><td>Quyển số:</td><td>${esc(d.quyen_so || "")}</td></tr>
      <tr><td>Số:</td><td class="b">${esc(d.so_phieu)}</td></tr>
      <tr><td>Nợ:</td><td>1111</td></tr>
      <tr><td>Có:</td><td>1311</td></tr>
    </table>
  </div>
  <div class="body">
    <div>Họ tên người nộp tiền: <span class="b">${esc(d.nguoi_nop)}</span></div>
    <div>Địa chỉ: ${esc(d.dia_chi || "")}</div>
    <div>Lý do nộp: ${esc(d.ly_do)}</div>
    <div>Số tiền: <span class="b">${esc(soVnd(d.so_tien))}</span></div>
    <div>Viết bằng chữ: <span class="b i">${esc(docSoTien(d.so_tien))}</span></div>
    <div>Kèm theo: ${esc(d.kem_theo || "...............")} chứng từ gốc</div>
  </div>
  <div class="ngay2">Ngày ${t.format("DD")} tháng ${t.format("MM")} năm ${t.format("YYYY")}</div>
  <div class="ky">
    <div><div class="t">Giám đốc</div><div class="g">(Ký, họ tên, đóng dấu)</div><div class="ten"></div></div>
    <div><div class="t">Kế toán trưởng</div><div class="g">(Ký, họ tên)</div><div class="ten"></div></div>
    <div><div class="t">Người nộp tiền</div><div class="g">(Ký, họ tên)</div><div class="ten">${esc(d.ten_nguoi_nop || "")}</div></div>
    <div><div class="t">Người lập phiếu</div><div class="g">(Ký, họ tên)</div><div class="ten">${esc(d.nguoi_lap || "")}</div></div>
    <div><div class="t">Thủ quỹ</div><div class="g">(Ký, họ tên)</div><div class="ten"></div></div>
  </div>
  <div class="nhan">Đã nhận đủ số tiền (Viết bằng chữ): ......................................................................................</div>
</section>`;
}

/** Bảng kê mã hồ sơ kèm phiếu thu (khi nộp nhiều hồ sơ) */
function bangKeHtml(soPhieu, maDot, list) {
  const tong = list.reduce((s, r) => s + (r.so_tien_thu || 0), 0);
  return `<section class="trang">
  <h2>BẢNG KÊ HỒ SƠ KÈM PHIẾU THU ${esc(soPhieu)}</h2>
  <div class="sub">Phòng tiếp sinh nộp hạng Moto${maDot ? ` — đợt ${esc(maDot)}` : ""}</div>
  <table class="bk">
    <thead><tr><th>STT</th><th>Mã hồ sơ</th><th>Họ và tên</th><th>Hạng</th><th>Khoá học</th><th>Số tiền</th></tr></thead>
    <tbody>${list
      .map((r, i) => `<tr><td class="c">${i + 1}</td><td>${esc(r.ma_ho_so)}</td><td>${esc(r.ho_ten)}</td><td class="c">${esc(r.hang || "")}</td><td>${esc(tenKhoa(r))}</td><td class="r">${esc(fmtTien(r.so_tien_thu))}</td></tr>`)
      .join("")}</tbody>
    <tfoot><tr><td colspan="5" class="r b">Tổng cộng (${list.length} hồ sơ)</td><td class="r b">${esc(fmtTien(tong))}</td></tr></tfoot>
  </table>
</section>`;
}

const trang = (sections) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>Phiếu thu</title><style>${CSS}</style></head><body>${sections.join("\n")}</body></html>`;

/**
 * Phiếu thu khi kế toán duyệt thu đợt gửi của Phòng tiếp sinh (1 phiếu cho nhiều hồ sơ).
 * phieu: { so_phieu, created_at, nguoi_thu, so_tien, ho_so: [{ ma_ho_so, ho_ten, hang, loai_hinh, so_tien_thu }] }
 * dot:   { ma_dot, nguoi } (người gửi bên tiếp sinh)
 */
export function phieuThuDotHtml(phieu, dot) {
  const ma = phieu.ho_so.map((r) => r.ma_ho_so);
  const itMa = ma.length <= TOI_DA_MA_TRONG_LY_DO;
  const nguoiNop = dot?.nguoi ? `${dot.nguoi} - Phòng tiếp sinh` : "Phòng tiếp sinh";
  const sections = [
    phieuHtml({
      so_phieu: phieu.so_phieu,
      created_at: phieu.created_at,
      nguoi_nop: nguoiNop,
      ten_nguoi_nop: dot?.nguoi || "",
      dia_chi: DIA_CHI_TIEP_SINH,
      ly_do: itMa
        ? `Phòng tiếp sinh nộp hạng Moto theo mã hồ sơ ${ma.join(", ")}`
        : `Phòng tiếp sinh nộp hạng Moto theo mã hồ sơ (${ma.length} hồ sơ — bảng kê đính kèm)${dot?.ma_dot ? `, đợt ${dot.ma_dot}` : ""}`,
      so_tien: phieu.so_tien,
      kem_theo: itMa ? "" : "01",
      nguoi_lap: phieu.nguoi_thu,
    }),
  ];
  if (!itMa) sections.push(bangKeHtml(phieu.so_phieu, dot?.ma_dot, phieu.ho_so));
  return trang(sections);
}

/** Nhiều phiếu đợt (in lại) */
export const phieuThuDotNhieuHtml = (list) =>
  trang(list.map(({ phieu, dot }) => phieuThuDotHtml(phieu, dot).match(/<body>([\s\S]*)<\/body>/)[1]));

/** Phiếu thu lẻ cho 1 học viên (thu phí ở màn kế toán) */
export function phieuThuHtml(hs, p) {
  return trang([
    phieuHtml({
      so_phieu: p.so_phieu,
      created_at: p.created_at,
      nguoi_nop: hs.ho_ten,
      ten_nguoi_nop: hs.ho_ten,
      dia_chi: hs.dia_chi,
      ly_do: `Nộp học phí hạng Moto (${tenKhoa(hs)}) theo mã hồ sơ ${hs.ma_ho_so}${p.ghi_chu ? ` — ${p.ghi_chu}` : ""}`,
      so_tien: p.so_tien,
      nguoi_lap: p.nguoi_thu,
    }),
  ]);
}

/** In bằng iframe ẩn để không bị trình duyệt chặn popup */
export function inHtml(html) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 150);
}
