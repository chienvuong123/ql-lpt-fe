// Biên bản xác nhận chi phí phải nộp lên kế toán (dùng chung: tiếp sinh nộp KT + kế toán xem đợt gửi)
import dayjs from "dayjs";
import { CENTER_NAME, fmtDate, fmtTien } from "./tiepSinhShared";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Biên bản xác nhận chi phí phải nộp lên kế toán (HTML để in / xem trước) */
export function bienBanHtml({ rows, tu, den, nguoi, ghiChu, thoiGian }) {
  const tong = rows.reduce((s, r) => s + (r.so_tien || 0), 0);
  const t = dayjs(thoiGian || undefined);
  const body = rows
    .map(
      (r, i) => `<tr><td class="c">${i + 1}</td><td>${esc(r.ma_ho_so)}</td><td>${esc(r.ho_ten)}</td><td class="c">${esc(r.hang)}</td>
      <td class="c">${esc(fmtDate(r.ngay_dong_tien))}</td><td class="r">${esc(fmtTien(r.so_tien) || "—")}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Biên bản xác nhận chi phí phải nộp</title>
<style>
  @page { size: A4; margin: 15mm 14mm; }
  body { font-family: "Times New Roman", serif; font-size: 13pt; color: #000; }
  .top { display: flex; justify-content: space-between; text-align: center; }
  .top div { width: 48%; } .b { font-weight: bold; }
  h1 { text-align: center; font-size: 16pt; margin: 22px 0 4px; }
  .sub { text-align: center; font-style: italic; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #000; padding: 4px 6px; font-size: 12pt; }
  th { background: #eee; } .c { text-align: center; } .r { text-align: right; white-space: nowrap; }
  tfoot td { font-weight: bold; }
  .ky { display: flex; justify-content: space-around; margin-top: 26px; text-align: center; }
  .ky div { width: 40%; } .ky i { font-size: 11pt; } .ky .ten { margin-top: 70px; font-weight: bold; }
</style></head><body>
<div class="top">
  <div><div>${esc(CENTER_NAME.toUpperCase())}</div><div class="b">TỔ TIẾP SINH</div></div>
  <div><div class="b">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="b"><u>Độc lập - Tự do - Hạnh phúc</u></div></div>
</div>
<h1>BIÊN BẢN XÁC NHẬN CHI PHÍ PHẢI NỘP LÊN KẾ TOÁN</h1>
<div class="sub">Thời gian thu tiền: từ ngày ${esc(fmtDate(tu))} đến ngày ${esc(fmtDate(den))}</div>
<div>Người lập: <b>${esc(nguoi)}</b> — Thời gian gửi: ${esc(thoiGian ? t.format("HH:mm DD/MM/YYYY") : "(chưa gửi)")}</div>
<div>Tổng số học viên: <b>${rows.length}</b> — Tổng số tiền phải nộp: <b>${esc(fmtTien(tong))}</b></div>
${ghiChu ? `<div>Ghi chú: ${esc(ghiChu)}</div>` : ""}
<table>
  <thead><tr><th>STT</th><th>Mã hồ sơ</th><th>Họ và tên</th><th>Hạng</th><th>Ngày đóng tiền</th><th>Số tiền thu</th></tr></thead>
  <tbody>${body}</tbody>
  <tfoot><tr><td colspan="5" class="r">Tổng cộng</td><td class="r">${esc(fmtTien(tong))}</td></tr></tfoot>
</table>
<div style="text-align:right;margin-top:14px;font-style:italic">Ngày ${t.format("DD")} tháng ${t.format("MM")} năm ${t.format("YYYY")}</div>
<div class="ky">
  <div><div class="b">NGƯỜI NỘP</div><i>(Ký, ghi rõ họ tên)</i><div class="ten">${esc(nguoi)}</div></div>
  <div><div class="b">KẾ TOÁN</div><i>(Ký, ghi rõ họ tên)</i><div class="ten">&nbsp;</div></div>
</div>
</body></html>`;
}

