import dayjs from "dayjs";
import { CENTER_NAME, fmtDate } from "../tiep-sinh/tiepSinhShared";

// Bảng màu chung (giống màn Phòng Kế toán)
export const C = {
  sidebar: "#0646A8",
  primary: "#0878F9",
  light: "#2495FF",
  soft: "#DCEBFF",
  title: "#102D62",
  text: "#263B5E",
  sub: "#71839E",
  bg: "#EAF3FF",
  bg2: "#F5F9FF",
  border: "#D7E5F8",
  success: "#16A34A",
  warning: "#FF8B18",
  purple: "#873FF0",
  danger: "#EF4444",
};
export const SHADOW = "0 4px 16px rgba(30,100,190,0.12)";
export const HEAD = `linear-gradient(90deg, ${C.sidebar}, ${C.primary} 65%, ${C.light})`;
export const TABLE_HEAD = "#16357a";

export const tenLop = (l) => (l ? `${l.hang} - ${l.khoa}` : "");
export const tenLopDayDu = (l) => (l ? `${tenLop(l)}${l.ngay_khai_giang ? ` (${fmtDate(l.ngay_khai_giang)})` : ""}` : "");

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** HTML in danh sách học viên của lớp */
export function danhSachLopHtml(lop, hocVien = []) {
  const rows = hocVien
    .map(
      (h, i) => `<tr><td class="c">${i + 1}</td><td>${esc(h.ma_ho_so)}</td><td>${esc(h.ho_ten)}</td><td class="c">${esc(fmtDate(h.ngay_sinh))}</td>
        <td>${esc(h.cccd)}</td><td>${esc(h.dien_thoai)}</td><td>${esc(h.dia_chi)}</td><td class="c">${esc(h.hang)}</td><td>${esc(h.dau_moi)}</td><td></td></tr>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Danh sách lớp ${esc(tenLop(lop))}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: "Times New Roman", serif; font-size: 13px; color: #000; }
    .top { display: flex; justify-content: space-between; }
    h1 { text-align: center; font-size: 20px; margin: 14px 0 4px; }
    .sub { text-align: center; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 4px 6px; }
    th { background: #eee; }
    .c { text-align: center; }
    .ky { display: flex; justify-content: space-around; margin-top: 24px; text-align: center; }
  </style></head><body>
  <div class="top"><b>${esc(CENTER_NAME)}</b><span>Ngày in: ${dayjs().format("DD/MM/YYYY HH:mm")}</span></div>
  <h1>DANH SÁCH HỌC VIÊN LỚP ${esc(tenLop(lop).toUpperCase())}</h1>
  <div class="sub">Ngày khai giảng: <b>${esc(fmtDate(lop.ngay_khai_giang) || "—")}</b> · Cơ sở: <b>${esc(lop.co_so || "—")}</b> · Sĩ số: <b>${hocVien.length}</b>/${lop.suc_chua}</div>
  <table><thead><tr><th>STT</th><th>Mã hồ sơ</th><th>Họ và tên</th><th>Ngày sinh</th><th>CCCD</th><th>SĐT</th><th>Địa chỉ</th><th>Hạng</th><th>Đầu mối</th><th>Ghi chú</th></tr></thead>
  <tbody>${rows || `<tr><td colspan="10" class="c">Chưa có học viên</td></tr>`}</tbody></table>
  <div class="ky"><div><b>Người lập</b><br/><i>(Ký, ghi rõ họ tên)</i></div><div><b>Phụ trách đào tạo</b><br/><i>(Ký, ghi rõ họ tên)</i></div></div>
  </body></html>`;
}
