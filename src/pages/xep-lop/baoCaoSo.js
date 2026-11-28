// Bộ báo cáo gửi Sở (theo mẫu Word/Excel của trung tâm):
//  1. "BÁO CÁO ĐĂNG KÝ KHÓA ĐÀO TẠO LÁI XE" — A4 dọc, 1 hoặc nhiều khoá
//  2. "DANH SÁCH HỌC VIÊN KHÓA 31018K…" kèm theo — A4 ngang, mỗi khoá 1 danh sách
// Tự chia trang + tự căn lề (lề @page = 0) để trình duyệt không in thêm giờ / đường dẫn / số trang.
import dayjs from "dayjs";
import { fmtDate } from "../tiep-sinh/tiepSinhShared";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const KHOA_LUU = "bao_cao_so_cau_hinh";

export const CAU_HINH_MAC_DINH = {
  so_van_ban: "",
  noi_ky: "Hải Phòng",
  kinh_gui: "Sở Xây dựng thành phố Hải Phòng",
  can_cu: "Phương án đào tạo lái xe môtô hạng A1, A tại thông báo số 20/2026/TB-LPT ngày 30/06/2026",
  ma_csdt: "31018",
  hinh_thuc_lt: "tu_hoc", // tu_hoc | tap_trung
  sh_lan_dau: false,
  noi_nhan: "Như trên;\nPhòng CSGT CA Tp HP\nLưu ĐT.",
  ky_1: "KT. GIÁM ĐỐC",
  ky_2: "PHÓ GIÁM ĐỐC",
  nguoi_ky: "Phạm Văn Tạo",
};

export function docCauHinh() {
  try {
    return { ...CAU_HINH_MAC_DINH, ...JSON.parse(localStorage.getItem(KHOA_LUU) || "{}") };
  } catch {
    return { ...CAU_HINH_MAC_DINH };
  }
}
export function luuCauHinh(ch) {
  try {
    const { ngay_bao_cao, ...giu } = ch; // eslint-disable-line no-unused-vars
    localStorage.setItem(KHOA_LUU, JSON.stringify(giu));
  } catch {
    /* bỏ qua */
  }
}

/** Gợi ý mã khoá (vd "K260055") từ tên khoá của lớp */
export function maKhoaTuLop(lop) {
  const m = String(lop?.khoa || "").toUpperCase().match(/K\s*-?\s*(\d{6})/) || String(lop?.khoa || "").match(/(\d{6})/);
  return m ? `K${m[1]}` : String(lop?.khoa || "").toUpperCase().replace(/\s+/g, "");
}

// Xếp theo tên (chữ cuối) rồi họ đệm — như danh sách mẫu
const tenRieng = (ht) => String(ht || "").trim().split(/\s+/).pop();
const soSanhTen = (a, b) => tenRieng(a.ho_ten).localeCompare(tenRieng(b.ho_ten), "vi") || String(a.ho_ten).localeCompare(String(b.ho_ten), "vi");

const DAU_TRANG = `
  <table class="quoc-hieu"><tr>
    <td><div>CÔNG TY CỔ PHẦN TM&amp;SX LẬP PHƯƠNG THÀNH</div><div class="b gach">TRUNG TÂM GDNN&amp;SHLX LẬP PHƯƠNG THÀNH</div></td>
    <td><div class="b">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="b gach">Độc lập - Tự do - Hạnh phúc</div></td>
  </tr></table>`;

const kyTen = (ch) => `
  <div class="chu-ky"><div class="b">${esc(ch.ky_1)}</div><div class="b">${esc(ch.ky_2)}</div><div class="ten">${esc(ch.nguoi_ky)}</div></div>`;

function trangBaoCao(ch, khoa) {
  const ngay = dayjs(ch.ngay_bao_cao || undefined);
  const tapTrung = ch.hinh_thuc_lt === "tap_trung";
  const dong = khoa.map((k) => `<tr>
      <td class="c">${esc(k.ma_khoa_day_du)}</td><td class="c">${esc(k.lop.hang)}</td>
      <td class="c">${tapTrung ? k.hoc_vien.length : ""}</td><td class="c">${tapTrung ? "" : k.hoc_vien.length}</td>
      <td class="c">${esc(fmtDate(k.lop.ngay_khai_giang))}</td><td class="c">${esc(fmtDate(k.lop.ngay_ket_thuc))}</td><td></td></tr>`).join("");
  const noiNhan = String(ch.noi_nhan || "").split("\n").map((s) => s.trim()).filter(Boolean).map((s) => `<div>- ${esc(s)}</div>`).join("");
  return `<section class="trang doc">
    ${DAU_TRANG}
    <table class="so-ngay"><tr>
      <td>Số: ${esc(ch.so_van_ban) || "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}/${ngay.format("YYYY")}/BC-LPT</td>
      <td class="i">${esc(ch.noi_ky)}, ngày ${ngay.format("DD")} tháng ${ngay.format("MM")} năm ${ngay.format("YYYY")}</td>
    </tr></table>
    <h1>BÁO CÁO ĐĂNG KÝ KHÓA ĐÀO TẠO LÁI XE</h1>
    <p class="kinh-gui">Kính gửi : ${esc(ch.kinh_gui)}</p>
    <p class="noi-dung">Thực hiện ${esc(ch.can_cu)} của Trung tâm GDNN &amp; SHLX Lập Phương Thành, Trung tâm GDNN &amp; SHLX Lập Phương Thành đã tổ chức xét tuyển học viên và khai giảng các lớp như sau:</p>
    <table class="bang-khoa">
      <thead>
        <tr><th rowspan="2" style="width:22%">Mã khóa học</th><th rowspan="2" style="width:10%">Hạng giấy phép lái xe</th><th colspan="2">Số lượng học viên</th>
            <th rowspan="2" style="width:12%">Ngày khai giảng</th><th rowspan="2" style="width:12%">Ngày bế giảng</th><th rowspan="2">Ghi chú</th></tr>
        <tr><th style="width:11%">Học lý thuyết tập trung</th><th style="width:11%">Tự học lý thuyết</th></tr>
      </thead>
      <tbody>${dong}</tbody>
    </table>
    <p class="kem-theo">(có danh sách học viên kèm theo)</p>
    <table class="cuoi"><tr>
      <td class="noi-nhan"><div class="bi">Nơi nhận:</div>${noiNhan}</td>
      <td>${kyTen(ch)}</td>
    </tr></table>
  </section>`;
}

// Số dòng / trang danh sách (A4 ngang): trang đầu có tiêu đề nên ít dòng hơn
const DONG_TRANG_DAU = 21;
const DONG_TRANG_SAU = 25;
const DONG_TOI_DA_KEM_KY = 18; // trang cuối còn chỗ cho phần ký

function trangDanhSach(ch, k) {
  const ngay = dayjs(ch.ngay_bao_cao || undefined);
  const ds = [...k.hoc_vien].sort(soSanhTen);
  const cot = `<tr><th style="width:4%">STT</th><th style="width:19%">Họ và tên</th><th style="width:8%">Ngày sinh</th><th style="width:10%">Số CCCD/HC</th>
    <th>Nơi thường trú</th><th style="width:12%">Số GPLX đã có</th><th style="width:6%">Hạng GPLX đã có</th><th style="width:9%">Ghi chú</th></tr>`;
  const dong = (h, i) => `<tr><td class="c">${i + 1}</td><td>${esc(String(h.ho_ten || "").toUpperCase())}</td><td class="c">${esc(fmtDate(h.ngay_sinh))}</td>
    <td class="c">${esc(h.cccd)}</td><td>${esc(h.dia_chi)}</td><td class="c">${esc(h.gplx_so || "")}</td><td class="c">${esc(h.gplx_hang || "")}</td>
    <td class="c">${!h.gplx_so && ch.sh_lan_dau ? "SH lần đầu" : ""}</td></tr>`;

  // chia trang
  const phan = [];
  let i = 0;
  phan.push(ds.slice(0, DONG_TRANG_DAU));
  i = DONG_TRANG_DAU;
  while (i < ds.length) {
    phan.push(ds.slice(i, i + DONG_TRANG_SAU));
    i += DONG_TRANG_SAU;
  }
  const kyRieng = phan[phan.length - 1].length > (phan.length === 1 ? DONG_TRANG_DAU - 5 : DONG_TOI_DA_KEM_KY);

  let stt = 0;
  return phan.map((p, idx) => {
    const dau = idx === 0 ? `${DAU_TRANG}
      <h2>DANH SÁCH HỌC VIÊN KHÓA ${esc(k.ma_khoa_day_du)}${esc(k.lop.hang)}</h2>
      <p class="kem-bc">( Kèm theo BC số ${esc(ch.so_van_ban) || "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"}/${ngay.format("YYYY")}/BC-LPT ngày ${ngay.format("DD/MM/YYYY")} của Trung tâm GDNN và SHLX Lập Phương Thành)</p>` : "";
    const rows = p.map((h) => dong(h, stt++)).join("");
    const cuoi = idx === phan.length - 1 && !kyRieng ? `<div class="ky-ds">${kyTen(ch)}</div>` : "";
    return `<section class="trang ngang">${dau}<table class="bang-ds"><thead>${cot}</thead><tbody>${rows}</tbody></table>${cuoi}</section>`;
  }).join("") + (kyRieng ? `<section class="trang ngang"><div class="ky-ds">${kyTen(ch)}</div></section>` : "");
}

/**
 * ch: cấu hình in (số văn bản, ngày, nơi nhận, người ký...)
 * khoa: [{ lop, hoc_vien, ma_khoa }]  — ma_khoa dạng "K260055"
 * chi: "bao_cao" | "danh_sach" | undefined (cả hai)
 */
export function baoCaoSoHtml(ch, khoa, chi) {
  const ds = khoa.map((k) => ({ ...k, ma_khoa_day_du: `${ch.ma_csdt || ""}${k.ma_khoa || maKhoaTuLop(k.lop)}` }));
  const phan = [];
  if (chi !== "danh_sach") phan.push(trangBaoCao(ch, ds));
  if (chi !== "bao_cao") ds.forEach((k) => phan.push(trangDanhSach(ch, k)));
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Báo cáo đăng ký khoá đào tạo</title><style>
    @page { size: A4 portrait; margin: 0; }
    @page ngang { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: "Times New Roman", Times, serif; color: #000; }
    .trang { page-break-after: always; break-after: page; overflow: hidden; position: relative; }
    .trang:last-child { page-break-after: auto; break-after: auto; }
    .doc { width: 210mm; height: 296mm; padding: 15mm 12mm 15mm 20mm; font-size: 14pt; }
    .ngang { page: ngang; width: 297mm; height: 209mm; padding: 10mm 10mm 8mm 12mm; font-size: 11pt; }
    .b { font-weight: bold; } .i { font-style: italic; } .bi { font-weight: bold; font-style: italic; }
    .c { text-align: center; }
    .quoc-hieu { width: 100%; border-collapse: collapse; text-align: center; font-size: 12.5pt; }
    .ngang .quoc-hieu { font-size: 11pt; }
    .doc .quoc-hieu { font-size: 10.5pt; white-space: nowrap; }
    .doc .quoc-hieu td { padding: 0 4px; }
    .doc .quoc-hieu td:first-child { width: 47%; }
    .quoc-hieu td { width: 50%; vertical-align: top; padding: 0; }
    .gach { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 1px; }
    .so-ngay { width: 100%; margin-top: 8px; font-size: 13pt; }
    .so-ngay td { width: 50%; text-align: center; }
    h1 { text-align: center; font-size: 15pt; margin: 22px 0 14px; }
    h2 { text-align: center; font-size: 15pt; margin: 10px 0 2px; }
    .kinh-gui { text-align: center; margin: 0 0 14px; }
    .noi-dung { text-indent: 12mm; text-align: justify; line-height: 1.55; margin: 0 0 12px; }
    .bang-khoa { width: 100%; border-collapse: collapse; font-size: 13pt; }
    .bang-khoa th, .bang-khoa td { border: 1px solid #000; padding: 5px 4px; }
    .bang-khoa th { font-weight: bold; }
    .kem-theo { text-align: center; font-style: italic; margin: 6px 0 18px; }
    .cuoi { width: 100%; border-collapse: collapse; }
    .cuoi td { vertical-align: top; padding: 0; }
    .noi-nhan { width: 50%; font-size: 11.5pt; } .noi-nhan .bi { font-size: 12.5pt; margin-bottom: 2px; }
    .chu-ky { text-align: center; } .chu-ky .ten { margin-top: 26mm; font-weight: bold; font-style: italic; }
    .kem-bc { text-align: center; font-style: italic; font-size: 10.5pt; margin: 0 0 6px; }
    .bang-ds { width: 100%; border-collapse: collapse; }
    .bang-ds th, .bang-ds td { border: 1px solid #000; padding: 2px 4px; height: 6.2mm; }
    .bang-ds th { font-weight: bold; height: auto; padding: 4px; }
    .ky-ds { width: 34%; margin: 8mm 0 0 auto; font-size: 11pt; }
    .ky-ds .ten { margin-top: 20mm; }
  </style></head><body data-tu-chia-trang>${phan.join("")}</body></html>`;
}
