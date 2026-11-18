// In các mẫu đơn tiếp sinh (bố cục theo file Word của trung tâm) + tải file Word đã điền
import axios from "axios";
import dayjs from "dayjs";
import { baseURL } from "../../constants/base";

export const MAU_DON = [
  { key: "don_de_nghi", ten: "Đơn đề nghị học lái xe" },
  { key: "tu_hoc_a1", ten: "Đơn đăng ký tự học lý thuyết hạng A1" },
  { key: "tu_hoc_a", ten: "Đơn đăng ký tự học lý thuyết hạng A (TT14)" },
];

/** Mặc định: đơn đề nghị + đơn tự học đúng hạng */
export const mauTheoHang = (hang) => ["don_de_nghi", String(hang || "").toUpperCase() === "A" ? "tu_hoc_a" : "tu_hoc_a1"];

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const d = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "");
const val = (v, dots = "...............................") => (v ? `<b>${esc(v)}</b>` : dots);

const QUOC_HIEU = `<div class="qh"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/><b class="u">Độc lập - Tự do - Hạnh phúc</b></div>`;

function ngayLam() {
  const n = dayjs();
  return `Hải Phòng, ngày ${n.format("DD")} tháng ${n.format("MM")} năm ${n.format("YYYY")}`;
}

function photoBox(hs) {
  return `<div class="photo">${hs.anh_chan_dung ? `<img alt="Ảnh học viên" src="${hs.anh_chan_dung}"/>` : "Ảnh màu<br/>3 cm x 4 cm<br/>chụp không quá 06 tháng"}</div>`;
}

function donDeNghi(hs) {
  return `<section class="page">
    ${QUOC_HIEU}
    <div class="photos">${photoBox(hs)}${photoBox(hs)}</div>
    <h1>ĐƠN ĐỀ NGHỊ HỌC LÁI XE</h1>
    <p class="center">Kính gửi: Trung tâm GDNN &amp; SHLX Lập Phương Thành</p>
    <div class="body lh">
      <p>Tôi là: ${val((hs.ho_ten || "").toUpperCase())} &nbsp;&nbsp;&nbsp; Ngày, tháng, năm sinh: ${val(d(hs.ngay_sinh))}</p>
      <p>Số Căn cước công dân hoặc Căn cước: ${val(hs.cccd)}</p>
      <p>Ngày cấp: ${val(d(hs.ngay_cap_cccd))} &nbsp;&nbsp;&nbsp; nơi cấp: ${val(hs.noi_cap || "Cục Cảnh sát QLHC về TTXH")}</p>
      <p>Đã có giấy phép lái xe số:......................................................hạng..........................</p>
      <p>do:................................................................................ cấp ngày: ..... /..... / ...........</p>
      <p>Đề nghị cho tôi được học lái xe hạng: ${val(hs.hang, ".......")}</p>
      <p class="justify">Vi phạm hành chính trong lĩnh vực giao thông đường bộ với hình thức tước quyền sử dụng giấy phép lái xe: &nbsp;<span class="box"></span> có &nbsp;&nbsp;<span class="box"></span> không</p>
      <p class="justify">Tôi xin cam đoan những điều ghi trên là đúng sự thật, nếu sai tôi xin hoàn toàn chịu trách nhiệm.</p>
    </div>
    <div class="sign"><i>${ngayLam()}</i><br/><b>NGƯỜI LÀM ĐƠN</b><br/><i>(Ký và ghi rõ họ, tên)</i><div class="space"></div><b>${esc(hs.ho_ten)}</b></div>
  </section>`;
}

function donTuHoc(hs, hang) {
  const isA = hang === "A";
  const canCu = isA
    ? "Căn cứ quy định tại điểm a khoản 1 Điều 4 Thông tư số 14/2025/TT-BXD ngày 30/06/2025 của Bộ Xây dựng: “Người có nhu cầu được đào tạo để cấp giấy phép lái xe mô tô hạng A1, A, B1 đối với nội dung học lý thuyết phải học đủ chương trình đào tạo theo quy định tại Thông tư 14/2025/TT-BXD và được lựa chọn một trong các hình thức đào tạo: tự học các môn lý thuyết theo quy định của Chính phủ về hoạt động đào tạo lái xe hoặc học tập trung tại cơ sở đào tạo lái xe”."
    : "Căn cứ quy định tại điểm a khoản 1 Điều 5 Thông tư số 35/2024/TT-BGTVT ngày 15/11/2024 của Bộ Giao thông vận tải: “Người có nhu cầu cấp giấy phép lái xe mô tô hạng A1, A, B1 đối với nội dung học lý thuyết phải học đủ chương trình đào tạo theo quy định và được lựa chọn một trong các hình thức đào tạo: tự học các môn lý thuyết theo quy định của pháp luật về hoạt động đào tạo và sát hạch lái xe hoặc học tập trung tại cơ sở đào tạo lái xe”.";
  const gio = isA ? [16, 4] : [8, 2];
  return `<section class="page">
    <table class="head"><tr>
      <td><b>TRUNG TÂM GDNN&amp;SHLX</b><br/><b class="u">LẬP PHƯƠNG THÀNH</b></td>
      <td>${QUOC_HIEU}</td>
    </tr></table>
    <h1>ĐƠN ĐĂNG KÝ TỰ HỌC CÁC MÔN LÝ THUYẾT HẠNG ${isA ? "A" : "A1"}</h1>
    <div class="body">
      <p>Họ và tên: ${val((hs.ho_ten || "").toUpperCase(), "…………………………………")} &nbsp;&nbsp;&nbsp; Ngày sinh: ${val(d(hs.ngay_sinh), "……………………")}</p>
      <p>Khóa học: ${val(hs.khoa_hoc, "……………………………………")}</p>
      <p class="justify indent">${canCu}</p>
      <p class="justify indent">Do điều kiện công việc không thể sắp xếp đến học lý thuyết tại Trung tâm, nên tôi xin được đăng ký tự học các môn Lý thuyết trong nội dung chương trình đào tạo như sau:</p>
      <table class="grid">
        <tr><th style="width:8%">TT</th><th>Môn học</th><th style="width:24%">Thời gian học (giờ)</th><th style="width:18%">Ghi chú</th></tr>
        <tr><td class="c">1</td><td>Pháp luật về giao thông đường bộ</td><td class="c">${gio[0]}</td><td></td></tr>
        <tr><td class="c">2</td><td>Kỹ thuật lái xe</td><td class="c">${gio[1]}</td><td></td></tr>
      </table>
      <p class="justify indent">Tôi đã được Trung tâm hướng dẫn và cung cấp tài liệu các môn lý thuyết để tự học tại website của trung tâm: lapphuongthanh.vn</p>
      <p class="indent">Nếu được tự học các môn lý thuyết nêu trên tôi xin cam kết:</p>
      <p class="justify indent">1. Tự học và hoàn thiện đầy đủ nội dung các môn học theo đúng các quy định của Trung tâm và các quy định hiện hành của pháp luật; Nếu vi phạm tôi xin hoàn toàn chịu trách nhiệm về việc xử lý theo quy định của Trung tâm và các cơ quan liên quan.</p>
      <p class="justify indent">2. Chấp hành đầy đủ các nội quy, quy định học tập của Trung tâm, tham gia đầy đủ các buổi khai giảng, hướng dẫn … theo kế hoạch mà Trung tâm đã bố trí./.</p>
      <p class="justify indent">3. Tôi cam đoan viết đơn này hoàn toàn trong tình trạng tỉnh táo không bị ép buộc.</p>
      <p class="indent">Trân trọng cảm ơn!</p>
    </div>
    <div class="sign"><i>${ngayLam()}</i><br/><b>Người làm đơn</b><br/><i>(Ký ghi rõ họ và tên)</i><div class="space"></div><b>${esc(hs.ho_ten)}</b></div>
  </section>`;
}

export function buildFormsHtml(hs, keys) {
  const pages = keys
    .map((k) => (k === "don_de_nghi" ? donDeNghi(hs) : k === "tu_hoc_a" ? donTuHoc(hs, "A") : k === "tu_hoc_a1" ? donTuHoc(hs, "A1") : ""))
    .join("");
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(hs.ma_ho_so)} - ${esc(hs.ho_ten)}</title>
<style>
  @page { size: A4; margin: 15mm 18mm 15mm 25mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", serif; font-size: 13.5pt; color: #000; margin: 0; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .qh { text-align: center; font-size: 13pt; }
  .u { text-decoration: underline; }
  .head { width: 100%; border-collapse: collapse; text-align: center; font-size: 12.5pt; }
  .head td { vertical-align: top; width: 50%; }
  .photos { display: flex; justify-content: space-between; margin: 14px 10px 0; }
  .photo { width: 30mm; height: 40mm; border: 1px solid #000; display: flex; align-items: center; justify-content: center;
           text-align: center; font-size: 9.5pt; overflow: hidden; }
  .photo img { width: 100%; height: 100%; object-fit: cover; }
  h1 { text-align: center; font-size: 15pt; margin: 18px 0 6px; }
  .center { text-align: center; margin: 0 0 14px; }
  .body p { margin: 6px 0; }
  .lh p { line-height: 1.75; margin: 0; }
  .justify { text-align: justify; }
  .indent { text-indent: 1cm; }
  .box { display: inline-block; width: 14px; height: 12px; border: 1px solid #000; vertical-align: middle; }
  .grid { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .grid th, .grid td { border: 1px solid #000; padding: 4px 6px; }
  .grid .c { text-align: center; }
  .sign { margin-left: 50%; text-align: center; margin-top: 10px; }
  .sign .space { height: 70px; }
  @media screen {
    body { background: #e5e7eb; }
    .page { background: #fff; width: 210mm; min-height: 297mm; padding: 15mm 18mm 15mm 25mm; margin: 0 auto 10px; }
  }
</style></head><body>${pages}</body></html>`;
}

/** In bằng iframe ẩn (không bị chặn popup) */
export function printForms(hs, keys) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(buildFormsHtml(hs, keys));
  doc.close();
  const go = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  };
  const imgs = [...doc.images].filter((i) => !i.complete);
  if (!imgs.length) setTimeout(go, 150);
  else {
    let left = imgs.length;
    imgs.forEach((i) => (i.onload = i.onerror = () => --left === 0 && go()));
  }
}

/** Tải file Word đã điền sẵn thông tin */
export async function downloadWord(id, key) {
  const res = await axios.get(`${baseURL}/tiep-sinh/ho-so/${id}/mau-don/${key}`, { responseType: "blob" });
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
