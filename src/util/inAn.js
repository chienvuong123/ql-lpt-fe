// In ấn: bỏ dòng tiêu đề / chân trang trình duyệt tự in thêm (giờ in, tên tài liệu, đường dẫn, số trang).
//
// Trình duyệt chỉ in các dòng đó vào lề trên/dưới của trang. Cách làm:
//  1. Đưa lề trên/dưới của @page về 0 (lề trái/phải giữ nguyên) -> không còn chỗ cho tiêu đề/chân trang.
//  2. Tạo lại lề trên/dưới bằng thead/tfoot rỗng của 1 bảng bọc toàn bộ nội dung — thead/tfoot
//     được lặp lại ở MỌI trang in nên tài liệu nhiều trang (hợp đồng) trang nào cũng giữ đúng lề.

const LE_MAC_DINH = "10mm";

/** Áp dụng cho document của iframe in, gọi ngay trước print() */
export function boTieuDeTrinhDuyet(doc) {
  if (!doc?.body || doc.body.querySelector(":scope > table.__in-le")) return;
  let tren = null;
  let duoi = null;
  let coPage = false;
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const r of Array.from(rules)) {
      if (r.type !== 6 /* CSSRule.PAGE_RULE */) continue;
      coPage = true;
      const st = r.style;
      if (st.marginTop) tren = st.marginTop;
      if (st.marginBottom) duoi = st.marginBottom;
      st.setProperty("margin-top", "0", "important");
      st.setProperty("margin-bottom", "0", "important");
    }
  }
  tren = tren && tren !== "0px" && tren !== "0" ? tren : LE_MAC_DINH;
  duoi = duoi && duoi !== "0px" && duoi !== "0" ? duoi : LE_MAC_DINH;

  const css = doc.createElement("style");
  css.textContent = `
    ${coPage ? "" : `@page { margin: 0 ${LE_MAC_DINH} !important; }`}
    table.__in-le { width: 100% !important; border-collapse: collapse !important; border: 0 !important; margin: 0 !important; table-layout: fixed; }
    table.__in-le > thead > tr > td, table.__in-le > tfoot > tr > td, table.__in-le > tbody > tr > td.__in-le-nd {
      border: 0 !important; padding: 0 !important; background: none !important; font: inherit; text-align: left; vertical-align: top;
    }
  `;
  doc.head.appendChild(css);

  const bang = doc.createElement("table");
  bang.className = "__in-le";
  bang.innerHTML = `<thead><tr><td><div style="height:${tren}"></div></td></tr></thead>
    <tfoot><tr><td><div style="height:${duoi}"></div></td></tr></tfoot><tbody><tr><td class="__in-le-nd"></td></tr></tbody>`;
  const o = bang.querySelector("td.__in-le-nd");
  while (doc.body.firstChild) o.appendChild(doc.body.firstChild);
  doc.body.appendChild(bang);
}

/** In 1 đoạn HTML bằng iframe ẩn (không bị chặn popup), đã bỏ tiêu đề/chân trang trình duyệt */
export function inHtml(html) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  const go = () => {
    boTieuDeTrinhDuyet(doc);
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  const imgs = Array.from(doc.images).filter((i) => !i.complete);
  if (!imgs.length) return setTimeout(go, 150);
  let con = imgs.length;
  const xong = () => --con === 0 && go();
  imgs.forEach((i) => { i.onload = xong; i.onerror = xong; });
}
