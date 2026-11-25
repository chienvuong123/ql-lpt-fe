// Bộ hồ sơ in cho học viên (4 phiếu). Máy chủ điền thông tin vào đúng file Word mẫu của trung tâm;
// trình duyệt hiển thị / in chính file Word đó (docx-preview).
// Riêng Đơn đề nghị (có khung dán ảnh + ô "có/không" là hình vẽ nổi mà docx-preview không vẽ được)
// dùng bản HTML dựng theo đúng bố cục mẫu Word.
import axios from "axios";
import dayjs from "dayjs";
import QRCode from "qrcode";
import { baseURL } from "../../constants/base";

// Mã chung — máy chủ tự chọn file mẫu hạng A hoặc A1 theo hồ sơ
export const MAU_DON = [
  { key: "phieu_xac_nhan", ten: "Phiếu xác nhận học viên" },
  { key: "don_de_nghi", ten: "Đơn đề nghị học lái xe" },
  { key: "tu_hoc", ten: "Đơn đăng ký tự học các môn lý thuyết" },
  { key: "hop_dong", ten: "Hợp đồng đào tạo lái xe" },
];

/** Mặc định in đủ 4 phiếu (đúng thứ tự) */
export const mauTheoHang = () => MAU_DON.map((m) => m.key);

const sapXep = (keys) => MAU_DON.map((m) => m.key).filter((k) => keys.includes(k));

function taiDocx(id, key) {
  return axios.get(`${baseURL}/tiep-sinh/ho-so/${id}/mau-don/${key}`, { responseType: "blob" });
}

// ─── Đơn đề nghị (HTML) ─────────────────────────────
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const d = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "");
const val = (v, dots = "...............................") => (v ? `<b>${esc(v)}</b>` : dots);
// khung dán ảnh 3x4 để trống (không in ảnh chân dung lên đơn) — 1 khung bên trái như mẫu Word, bên phải là QR mã hồ sơ
const PHOTO = `<div class="photo">Ảnh màu<br/>3 cm x 4 cm<br/>chụp không quá 06 tháng</div>`;

function donDeNghiHtml(hs, { qr } = {}) {
  return `<section class="docx mau-page">
    ${qr ? `<div class="qr"><img src="${qr}" alt="QR mã hồ sơ"/><div>${esc(hs.ma_ho_so)}</div></div>` : ""}
    <div class="qh"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/><b class="u">Độc lập - Tự do - Hạnh phúc</b></div>
    <div class="photos">${PHOTO}</div>
    <h1>ĐƠN ĐỀ NGHỊ HỌC LÁI XE</h1>
    <p class="center">Kính gửi: Trung tâm GDNN &amp; SHLX Lập Phương Thành</p>
    <div class="lh">
      <p>Tôi là: ${val((hs.ho_ten || "").toUpperCase())} &nbsp;&nbsp;&nbsp; Ngày, tháng, năm sinh: ${val(d(hs.ngay_sinh))}</p>
      <p>Số Căn cước công dân hoặc Căn cước: ${val(hs.cccd)}</p>
      <p>Ngày cấp: ${val(d(hs.ngay_cap_cccd))} &nbsp;&nbsp;&nbsp; nơi cấp: ${val(hs.noi_cap || "Cục Cảnh sát QLHC về TTXH")}</p>
      <p>Đã có giấy phép lái xe số: ${val(hs.gplx_so, "......................................................")} &nbsp;hạng: ${val(hs.gplx_hang, "..........................")}</p>
      <p>do:................................................................................ cấp ngày: ${val(d(hs.gplx_ngay_cap), "..... /..... / ...........")}</p>
      <p>Đề nghị cho tôi được học lái xe hạng: ${val(hs.hang, ".......")}</p>
      <p class="justify">Vi phạm hành chính trong lĩnh vực giao thông đường bộ với hình thức tước quyền sử dụng giấy phép lái xe: &nbsp;<span class="box"></span> có &nbsp;&nbsp;<span class="box"></span> không</p>
      <p class="justify">Tôi xin cam đoan những điều ghi trên là đúng sự thật, nếu sai tôi xin hoàn toàn chịu trách nhiệm.</p>
    </div>
    <div class="sign"><i>Hải Phòng, ngày ........ tháng ........ năm ..............</i><br/><b>NGƯỜI LÀM ĐƠN</b><br/><i>(Ký và ghi rõ họ, tên)</i><div class="space"></div><b>${esc(hs.ho_ten)}</b></div>
  </section>`;
}

const MAU_HTML = { don_de_nghi: donDeNghiHtml };

// CSS dùng chung cho xem trước và bản in
const MAU_CSS = `
  .mau-don img { max-width: none !important; } /* Tailwind preflight bóp ảnh nổi (logo) về 0 */
  .mau-don section.docx { color: #000; }
  /* index.css ép "* { font-family: Inter !important }" -> mẫu đơn dùng lại Times New Roman như file Word */
  .mau-don section.docx, .mau-don section.docx * { font-family: "Times New Roman", Times, serif !important; }
  .mau-don .mau-html { background: gray; padding: 30px 30px 0; display: flex; flex-direction: column; align-items: center; }
  .mau-don .mau-page { position: relative; box-sizing: border-box; background: #fff; width: 210mm; min-height: 297mm; padding: 15mm 18mm 15mm 25mm;
    margin-bottom: 30px; box-shadow: 0 0 10px rgba(0,0,0,.5); font-size: 13.5pt; line-height: 1.3; }
  .mau-page .qh { text-align: center; font-size: 13pt; }
  /* QR mã hồ sơ góc phải trên */
  .mau-page .qr { position: absolute; top: 10mm; right: 18mm; width: 23mm; text-align: center; font-size: 9pt; font-weight: bold; line-height: 1.2; }
  .mau-page .qr img { display: block; width: 23mm; height: 23mm; }
  .mau-page .u { text-decoration: underline; }
  .mau-page .photos { display: flex; justify-content: space-between; margin: 14px 10px 0; }
  .mau-page .photo { width: 30mm; height: 40mm; border: 1px solid #000; display: flex; align-items: center; justify-content: center;
    text-align: center; font-size: 9.5pt; }
  .mau-page h1 { text-align: center; font-size: 15pt; font-weight: bold; margin: 18px 0 6px; }
  .mau-page .center { text-align: center; margin: 0 0 14px; }
  .mau-page .lh p { line-height: 1.75; margin: 0; }
  .mau-page .justify { text-align: justify; }
  .mau-page .box { display: inline-block; width: 14px; height: 12px; border: 1px solid #000; vertical-align: middle; }
  .mau-page .sign { margin-left: 50%; text-align: center; margin-top: 10px; }
  .mau-page .sign .space { height: 70px; }
`;

function ganCss(doc) {
  if (doc.getElementById("mau-don-css")) return;
  const st = doc.createElement("style");
  st.id = "mau-don-css";
  st.textContent = MAU_CSS;
  doc.head.appendChild(st);
}

const RENDER_OPTS = {
  className: "docx",
  inWrapper: true,
  ignoreWidth: false,
  ignoreHeight: false,
  ignoreLastRenderedPageBreak: true,
  breakPages: true,
  renderHeaders: true,
  renderFooters: true,
  experimental: true,
  useBase64URL: true, // ảnh (logo) nhúng base64 để in trong iframe không bị mất
};

/**
 * Hiển thị các mẫu đã điền vào container (xem trước / bản in).
 * Trả về false nếu bị huỷ (isCancelled) giữa chừng.
 */
export async function renderForms(container, hs, keys, { isCancelled } = {}) {
  const { renderAsync } = await import("docx-preview");
  const list = sapXep(keys);
  const blobs = await Promise.all(list.map((k) => (MAU_HTML[k] ? null : taiDocx(hs.id, k).then((r) => r.data))));
  if (isCancelled?.()) return false;
  // QR chứa mã hồ sơ (in lên Đơn đề nghị)
  const qr = list.includes("don_de_nghi") && hs.ma_ho_so
    ? await QRCode.toDataURL(String(hs.ma_ho_so), { margin: 1, width: 240, errorCorrectionLevel: "M" })
    : null;
  const doc = container.ownerDocument;
  container.classList.add("mau-don");
  container.innerHTML = "";
  for (let i = 0; i < list.length; i++) {
    const box = doc.createElement("div");
    container.appendChild(box);
    if (MAU_HTML[list[i]]) {
      box.className = "docx-wrapper mau-html";
      box.innerHTML = MAU_HTML[list[i]](hs, { qr });
    } else {
      // Mỗi file Word: tiền tố class riêng + CSS đặt ngay trong box (docx-preview xoá sạch styleContainer
      // mỗi lần gọi, và các file trùng tên style -> dùng chung sẽ đè định dạng của nhau)
      const cls = `docx-m${i}`;
      await renderAsync(blobs[i], box, box, { ...RENDER_OPTS, className: cls });
      box.querySelectorAll(`.${cls}-wrapper`).forEach((w) => w.classList.add("docx-wrapper"));
      box.querySelectorAll(`section.${cls}`).forEach((s) => s.classList.add("docx"));
    }
    if (isCancelled?.()) return false;
  }
  ganCss(doc); // sau cùng: không bị docx-preview xoá
  return true;
}

// Lề trên/dưới do @page đảm nhận -> mẫu dài nhiều trang (hợp đồng) trang nào cũng có lề;
// lề trái/phải giữ theo file Word (padding của section)
export const PRINT_CSS = `
  @page { size: A4; margin: 15mm 0 15mm 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .mau-don .docx-wrapper { background: #fff !important; padding: 0 !important; display: block !important; }
  .mau-don .docx-wrapper > section.docx { box-shadow: none !important; margin: 0 auto !important; padding-top: 0 !important;
    padding-bottom: 0 !important; min-height: 0 !important; page-break-after: always; break-after: page; }
  .mau-don > div:last-child > .docx-wrapper > section.docx:last-child,
  .mau-don > div.mau-html:last-child > section.docx:last-child { page-break-after: auto; break-after: auto; }
`;

/** In các mẫu đã điền bằng iframe ẩn (không bị chặn popup) */
export async function printForms(hs, keys) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(hs.ma_ho_so || "Ho so")}</title></head><body></body></html>`);
  doc.close();
  try {
    await renderForms(doc.body, hs, keys);
    const st = doc.createElement("style");
    st.textContent = PRINT_CSS; // sau CSS của docx-preview để ghi đè nền xám / bóng đổ
    doc.head.appendChild(st);
    await doc.fonts?.ready;
    await new Promise((r) => setTimeout(r, 200));
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  } finally {
    setTimeout(() => iframe.remove(), 1500);
  }
}

/** Tải file Word đã điền sẵn thông tin */
export async function downloadWord(id, key) {
  const res = await taiDocx(id, key);
  const cd = res.headers["content-disposition"] || "";
  const m = cd.match(/filename\*=UTF-8''([^;]+)/);
  const name = m ? decodeURIComponent(m[1]) : `${key}.docx`;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
