// Bộ báo cáo của 1 lớp (in / xem trước): mỗi báo cáo 1 trang riêng
import dayjs from "dayjs";
import { CENTER_NAME, fmtDate } from "../tiep-sinh/tiepSinhShared";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const tenLop = (l) => `${l.hang} - ${l.khoa}`;

/** Danh sách báo cáo + có đủ dữ liệu để in chưa */
export function dsBaoCao(ct) {
  const { hoc_vien: hv = [], nhom = [] } = ct || {};
  return [
    { key: "hoc_vien", ten: "Danh sách học viên của lớp", san_sang: hv.length > 0 },
    { key: "phan_cong", ten: "Danh sách phân công giáo viên – xe theo nhóm", san_sang: nhom.length > 0 && hv.every((h) => h.nhom_id) },
    { key: "giao_vien", ten: "Danh sách giáo viên giảng dạy", san_sang: nhom.some((n) => n.giao_vien) },
    { key: "xe", ten: "Danh sách xe tập lái", san_sang: !ct?.bat_buoc_xe || nhom.some((n) => n.xe) },
    { key: "tong_quan", ten: "Biên bản tổng quan khoá học", san_sang: hv.length > 0 && !!ct?.lop?.ngay_khai_giang },
  ];
}

const dauTrang = (lop, tieuDe) => `
  <div class="top"><b>${esc(CENTER_NAME.toUpperCase())}</b></div>
  <h1>${esc(tieuDe)}</h1>
  <div class="sub">Lớp <b>${esc(tenLop(lop))}</b> · Khai giảng: <b>${esc(fmtDate(lop.ngay_khai_giang) || "—")}</b>
    · Dự kiến kết thúc: <b>${esc(fmtDate(lop.ngay_ket_thuc) || "—")}</b>${lop.co_so ? ` · Cơ sở: <b>${esc(lop.co_so)}</b>` : ""}</div>`;

const kyTen = (trai = "Người lập", phai = "Phụ trách đào tạo") => `
  <div class="ngay">Ngày ${dayjs().format("DD")} tháng ${dayjs().format("MM")} năm ${dayjs().format("YYYY")}</div>
  <div class="ky"><div><b>${trai}</b><i>(Ký, ghi rõ họ tên)</i></div><div><b>${phai}</b><i>(Ký, ghi rõ họ tên)</i></div></div>`;

export function baoCaoLopHtml(ct, chon) {
  const { lop, hoc_vien: hv = [], nhom = [] } = ct;
  const nhomCua = new Map(nhom.map((n) => [n.id, n]));
  const keys = chon || dsBaoCao(ct).map((b) => b.key);
  const trang = [];

  if (keys.includes("hoc_vien")) {
    trang.push(`${dauTrang(lop, "DANH SÁCH HỌC VIÊN CỦA LỚP")}
      <table><thead><tr><th>STT</th><th>Mã hồ sơ</th><th>Họ và tên</th><th>Ngày sinh</th><th>CCCD</th><th>SĐT</th><th>Địa chỉ</th><th>Nhóm</th></tr></thead><tbody>
      ${hv.map((h, i) => `<tr><td class="c">${i + 1}</td><td>${esc(h.ma_ho_so)}</td><td>${esc(h.ho_ten)}</td><td class="c">${esc(fmtDate(h.ngay_sinh))}</td>
        <td>${esc(h.cccd)}</td><td>${esc(h.dien_thoai)}</td><td>${esc(h.dia_chi)}</td><td class="c">${esc(nhomCua.get(h.nhom_id)?.stt ?? "")}</td></tr>`).join("")}
      </tbody></table><p>Tổng số: <b>${hv.length}</b> học viên.</p>${kyTen()}`);
  }
  if (keys.includes("phan_cong")) {
    const khoi = nhom.map((n) => {
      const ds = hv.filter((h) => h.nhom_id === n.id);
      return `<tr class="nhom"><td colspan="5">Nhóm ${n.stt} — Giáo viên: <b>${esc(n.giao_vien || "(chưa phân công)")}</b> — Xe: <b>${esc(n.xe || "—")}</b> — ${ds.length} học viên</td></tr>
        ${ds.map((h, i) => `<tr><td class="c">${i + 1}</td><td>${esc(h.ma_ho_so)}</td><td>${esc(h.ho_ten)}</td><td class="c">${esc(fmtDate(h.ngay_sinh))}</td><td>${esc(h.cccd)}</td></tr>`).join("")}`;
    }).join("");
    trang.push(`${dauTrang(lop, "DANH SÁCH PHÂN CÔNG GIÁO VIÊN – XE THEO NHÓM")}
      <table><thead><tr><th>STT</th><th>Mã hồ sơ</th><th>Họ và tên</th><th>Ngày sinh</th><th>CCCD</th></tr></thead><tbody>${khoi}</tbody></table>${kyTen()}`);
  }
  if (keys.includes("giao_vien")) {
    const gv = [...new Map(nhom.filter((n) => n.giao_vien).map((n) => [n.giao_vien.trim().toLowerCase(), n.giao_vien])).values()];
    trang.push(`${dauTrang(lop, "DANH SÁCH GIÁO VIÊN GIẢNG DẠY")}
      <table><thead><tr><th>STT</th><th>Họ và tên giáo viên</th><th>Nhóm phụ trách</th><th>Xe</th><th>Số học viên</th></tr></thead><tbody>
      ${gv.map((g, i) => {
        const ns = nhom.filter((n) => n.giao_vien && n.giao_vien.trim().toLowerCase() === g.trim().toLowerCase());
        return `<tr><td class="c">${i + 1}</td><td>${esc(g)}</td><td class="c">${ns.map((n) => n.stt).join(", ")}</td>
          <td>${esc(ns.map((n) => n.xe).filter(Boolean).join(", "))}</td><td class="c">${ns.reduce((s, n) => s + n.so_hv, 0)}</td></tr>`;
      }).join("")}</tbody></table>${kyTen()}`);
  }
  if (keys.includes("xe")) {
    const xe = [...new Map(nhom.filter((n) => n.xe).map((n) => [n.xe.toUpperCase().replace(/[^A-Z0-9]/g, ""), n])).values()];
    trang.push(`${dauTrang(lop, "DANH SÁCH XE TẬP LÁI")}
      <table><thead><tr><th>STT</th><th>Biển số xe</th><th>Hạng</th><th>Giáo viên</th><th>Nhóm</th></tr></thead><tbody>
      ${xe.length ? xe.map((n, i) => `<tr><td class="c">${i + 1}</td><td>${esc(n.xe)}</td><td class="c">${esc(lop.hang)}</td><td>${esc(n.giao_vien)}</td><td class="c">${n.stt}</td></tr>`).join("")
        : `<tr><td colspan="5" class="c">Lớp mô tô — không phân công xe tập lái riêng</td></tr>`}
      </tbody></table>${kyTen()}`);
  }
  if (keys.includes("tong_quan")) {
    const daGhep = hv.filter((h) => h.nhom_id).length;
    const soThang = lop.ngay_khai_giang && lop.ngay_ket_thuc ? (dayjs(lop.ngay_ket_thuc).diff(dayjs(lop.ngay_khai_giang), "day") / 30).toFixed(1) : null;
    trang.push(`${dauTrang(lop, "BIÊN BẢN TỔNG QUAN KHOÁ HỌC")}
      <table class="tt"><tbody>
        <tr><td>Hạng đào tạo</td><td><b>${esc(lop.hang)}</b></td><td>Khoá</td><td><b>${esc(lop.khoa)}</b></td></tr>
        <tr><td>Ngày khai giảng</td><td>${esc(fmtDate(lop.ngay_khai_giang) || "—")}</td><td>Dự kiến kết thúc</td><td>${esc(fmtDate(lop.ngay_ket_thuc) || "—")}${soThang ? ` (${soThang} tháng)` : ""}</td></tr>
        <tr><td>Người phụ trách</td><td>${esc(lop.nguoi_phu_trach || "—")}</td><td>Phòng học</td><td>${esc(lop.phong_hoc || "—")}</td></tr>
        <tr><td>Sĩ số lớp</td><td>${hv.length}/${lop.suc_chua}</td><td>Đã ghép nhóm</td><td>${daGhep}</td></tr>
        <tr><td>Số nhóm GV – xe</td><td>${nhom.length}</td><td>Số giáo viên / xe</td><td>${new Set(nhom.map((n) => n.giao_vien).filter(Boolean)).size} / ${new Set(nhom.map((n) => n.xe).filter(Boolean)).size}</td></tr>
        <tr><td>Ghi chú</td><td colspan="3">${esc(lop.ghi_chu_tien_do || "")}</td></tr>
      </tbody></table>
      ${lop.xac_thuc_at ? `<p>Dữ liệu đã được xác thực lúc ${esc(dayjs(lop.xac_thuc_at).format("HH:mm DD/MM/YYYY"))}${lop.nguoi_xac_thuc ? ` bởi ${esc(lop.nguoi_xac_thuc)}` : ""}.</p>` : ""}
      ${kyTen("Người lập", "Giám đốc trung tâm")}`);
  }

  return `<!doctype html><html><head><meta charset="utf-8"><title>Báo cáo lớp ${esc(tenLop(lop))}</title><style>
    @page { size: A4; margin: 14mm 12mm; }
    body { font-family: "Times New Roman", serif; font-size: 12.5pt; color: #000; margin: 0; }
    .trang { page-break-after: always; break-after: page; } .trang:last-child { page-break-after: auto; break-after: auto; }
    .top { font-size: 11.5pt; }
    h1 { text-align: center; font-size: 15pt; margin: 14px 0 4px; }
    .sub { text-align: center; margin-bottom: 10px; font-size: 11.5pt; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 3px 5px; font-size: 11pt; vertical-align: top; }
    th { background: #eee; } .c { text-align: center; }
    tr.nhom td { background: #f1f1f1; }
    table.tt td { padding: 6px 8px; font-size: 12pt; }
    .ngay { text-align: right; font-style: italic; margin-top: 14px; }
    .ky { display: flex; justify-content: space-around; text-align: center; margin-top: 6px; }
    .ky > div { width: 40%; display: flex; flex-direction: column; } .ky i { font-size: 10.5pt; margin-bottom: 70px; }
  </style></head><body>${trang.map((t) => `<div class="trang">${t}</div>`).join("")}</body></html>`;
}
