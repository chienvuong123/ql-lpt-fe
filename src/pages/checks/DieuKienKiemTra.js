export const HANG_DAO_TAO_CONFIG = {
  B1: {
    thoiGian: { banNgay: 9, banDem: 3, tuDong: 0, tong: 12 },
    quangDuong: { banNgay: 590, banDem: 120, tuDong: 0, tong: 710 },
  },
  B11: {
    thoiGian: { banNgay: 9, banDem: 3, tuDong: 0, tong: 12 },
    quangDuong: { banNgay: 590, banDem: 120, tuDong: 0, tong: 710 },
  },
  B2: {
    thoiGian: { banNgay: 15, banDem: 3, tuDong: 2, tong: 20 },
    quangDuong: { banNgay: 610, banDem: 120, tuDong: 80, tong: 810 },
  },
  C: {
    thoiGian: { banNgay: 20, banDem: 3, tuDong: 1, tong: 24 },
    quangDuong: { banNgay: 705, banDem: 90, tuDong: 30, tong: 825 },
  },
};

/**
 * Tính toán tổng hợp từ danh sách hành trình
 * @param {Array} dataSource - Mảng các phiên hành trình từ API
 * @param {string} hangDaoTao - Hạng đào tạo (B1, B11, B2, C)
 */
export function computeSummary(dataSource, hangDaoTao = "") {
  if (!dataSource || dataSource.length === 0) {
    return {
      tongThoiGianGio: 0,
      tongQuangDuong: 0,
      thoiGianBanDemGio: 0,
      quangDuongBanDem: 0,
      thoiGianBanNgayGio: 0,
      quangDuongBanNgay: 0,
      thoiGianTuDongGio: 0,
      quangDuongTuDong: 0,
      hangDaoTao,
    };
  }

  // Đếm số lần xuất hiện của mỗi biển số để tìm xe tự động
  const bienSoCount = dataSource.reduce((acc, item) => {
    if (item.BienSo) acc[item.BienSo] = (acc[item.BienSo] || 0) + 1;
    return acc;
  }, {});

  const danhSachBienSo = Object.entries(bienSoCount);
  let bienSoTuDong = null;

  if (danhSachBienSo.length > 1) {
    let minCount = Infinity;
    danhSachBienSo.forEach(([bs, count]) => {
      if (count < minCount) {
        minCount = count;
        bienSoTuDong = bs;
      }
    });
  }

  const totals = dataSource.reduce(
    (acc, item) => {
      const isTuDong = bienSoTuDong && item.BienSo === bienSoTuDong;
      const thoiGianPhut = item.TongThoiGian || 0;
      const quangDuong = item.TongQuangDuong || item.TongQD || 0;

      acc.tongThoiGianPhut += thoiGianPhut;
      acc.tongQuangDuong += quangDuong;
      acc.thoiGianBanDemPhut += item.ThoiGianBanDem || 0;
      acc.quangDuongBanDem += item.QuangDuongBanDem || 0;

      if (isTuDong) {
        acc.thoiGianTuDongPhut += thoiGianPhut;
        acc.quangDuongTuDong += quangDuong;
      } else {
        acc.thoiGianTuDongPhut += item.ThoiGianTuDong || 0;
        acc.quangDuongTuDong += item.QuangDuongTuDong || 0;
      }

      // Phân loại ban đêm qua ThoiDiemDangNhap nếu không có ThoiGianBanDem
      if (!item.ThoiGianBanDem && item.ThoiDiemDangNhap) {
        const hour = new Date(item.ThoiDiemDangNhap).getHours();
        if (hour >= 18) {
          acc.thoiGianBanDemPhut += thoiGianPhut;
          acc.quangDuongBanDem += quangDuong;
        }
      }

      return acc;
    },
    {
      tongThoiGianPhut: 0,
      tongQuangDuong: 0,
      thoiGianBanDemPhut: 0,
      quangDuongBanDem: 0,
      thoiGianTuDongPhut: 0,
      quangDuongTuDong: 0,
    },
  );

  const tongThoiGianGio = totals.tongThoiGianPhut / 60;
  const thoiGianBanDemGio = totals.thoiGianBanDemPhut / 60;
  const thoiGianTuDongGio = totals.thoiGianTuDongPhut / 60;
  const thoiGianBanNgayGio = Math.max(
    tongThoiGianGio - thoiGianBanDemGio - thoiGianTuDongGio,
    0,
  );
  const quangDuongBanNgay = Math.max(
    totals.tongQuangDuong - totals.quangDuongBanDem - totals.quangDuongTuDong,
    0,
  );

  const finalHang = dataSource[0]?.HangDaoTao || hangDaoTao;

  return {
    tongThoiGianGio,
    tongQuangDuong: totals.tongQuangDuong,
    thoiGianBanDemGio,
    quangDuongBanDem: totals.quangDuongBanDem,
    thoiGianBanNgayGio,
    quangDuongBanNgay,
    thoiGianTuDongGio,
    quangDuongTuDong: totals.quangDuongTuDong,
    hangDaoTao: finalHang,
  };
}

/**
 * Đánh giá pass/fail và trả về danh sách lỗi + cảnh báo
 * @param {object} summaryData - Kết quả từ computeSummary
 * @param {Array} dataSource - Raw data để kiểm tra thêm
 */
export function evaluate(summaryData, dataSource = []) {
  const errors = [];
  const warnings = [];

  const yeuCauHang =
    HANG_DAO_TAO_CONFIG[summaryData.hangDaoTao] || HANG_DAO_TAO_CONFIG.B1;

  const fmtTime = (gio) => {
    const g = Math.floor(gio);
    const p = Math.round((gio - g) * 60);
    return `${g}h ${p.toString().padStart(2, "0")}'`;
  };

  const rules = [
    // ---- ERRORS ----
    {
      type: "error",
      label: "Thời gian ban đêm",
      condition: summaryData.thoiGianBanDemGio < yeuCauHang.thoiGian.banDem,
      getMessage: () => {
        const thieu =
          yeuCauHang.thoiGian.banDem - summaryData.thoiGianBanDemGio;
        return `Thời gian ban đêm thiếu ${fmtTime(thieu)} (yêu cầu ${fmtTime(yeuCauHang.thoiGian.banDem)}, thực tế ${fmtTime(summaryData.thoiGianBanDemGio)}).`;
      },
    },
    {
      type: "error",
      label: "Quãng đường ban đêm",
      condition: summaryData.quangDuongBanDem < yeuCauHang.quangDuong.banDem,
      getMessage: () => {
        const thieu =
          yeuCauHang.quangDuong.banDem - summaryData.quangDuongBanDem;
        return `Quãng đường ban đêm thiếu ${thieu.toFixed(2)} km (yêu cầu ${yeuCauHang.quangDuong.banDem} km, thực tế ${summaryData.quangDuongBanDem.toFixed(2)} km).`;
      },
    },
    {
      type: "error",
      label: "Thời gian số tự động",
      condition: summaryData.thoiGianTuDongGio < yeuCauHang.thoiGian.tuDong,
      getMessage: () => {
        const thieu =
          yeuCauHang.thoiGian.tuDong - summaryData.thoiGianTuDongGio;
        return `Thời gian lái xe số tự động thiếu ${fmtTime(thieu)} (yêu cầu ${fmtTime(yeuCauHang.thoiGian.tuDong)}, thực tế ${fmtTime(summaryData.thoiGianTuDongGio)}).`;
      },
    },
    {
      type: "error",
      label: "Quãng đường số tự động",
      condition: summaryData.quangDuongTuDong < yeuCauHang.quangDuong.tuDong,
      getMessage: () => {
        const thieu =
          yeuCauHang.quangDuong.tuDong - summaryData.quangDuongTuDong;
        return `Quãng đường lái xe số tự động thiếu ${thieu.toFixed(2)} km (yêu cầu ${yeuCauHang.quangDuong.tuDong} km, thực tế ${summaryData.quangDuongTuDong.toFixed(2)} km).`;
      },
    },
    {
      type: "error",
      label: "Tổng thời lượng",
      condition: summaryData.tongThoiGianGio < yeuCauHang.thoiGian.tong,
      getMessage: () => {
        const thieu = yeuCauHang.thoiGian.tong - summaryData.tongThoiGianGio;
        return `Tổng thời lượng thiếu ${fmtTime(thieu)} (yêu cầu ${fmtTime(yeuCauHang.thoiGian.tong)}, thực tế ${fmtTime(summaryData.tongThoiGianGio)}).`;
      },
    },
    {
      type: "error",
      label: "Tổng quãng đường",
      condition: summaryData.tongQuangDuong < yeuCauHang.quangDuong.tong,
      getMessage: () => {
        const thieu = yeuCauHang.quangDuong.tong - summaryData.tongQuangDuong;
        return `Tổng quãng đường thiếu ${thieu.toFixed(2)} km (yêu cầu ${yeuCauHang.quangDuong.tong} km, thực tế ${summaryData.tongQuangDuong.toFixed(2)} km).`;
      },
    },

    // ---- WARNINGS ----
    {
      type: "warning",
      label: "Thiếu tên giáo viên",
      condition: !dataSource.some((item) => item.HoTenGV),
      getMessage: () => "Không có tên giáo viên để kiểm tra tính nhất quán.",
    },
    {
      type: "warning",
      label: "Thời gian ban ngày",
      condition: (() => {
        const yc = yeuCauHang.thoiGian.banNgay;
        if (yc === 0) return false;
        return summaryData.thoiGianBanNgayGio / yc < 0.8;
      })(),
      getMessage: () => {
        const yc = yeuCauHang.thoiGian.banNgay;
        const tt = summaryData.thoiGianBanNgayGio;
        const thieu = yc - tt;
        const pct = ((1 - tt / yc) * 100).toFixed(1);
        return `Thời gian ban ngày thiếu ${pct}% (thiếu ${fmtTime(thieu)}, yêu cầu ${fmtTime(yc)}).`;
      },
    },
    {
      type: "warning",
      label: "Quãng đường ban ngày",
      condition: (() => {
        const yc = yeuCauHang.quangDuong.banNgay;
        if (yc === 0) return false;
        return summaryData.quangDuongBanNgay / yc < 0.8;
      })(),
      getMessage: () => {
        const yc = yeuCauHang.quangDuong.banNgay;
        const tt = summaryData.quangDuongBanNgay;
        const thieu = yc - tt;
        const pct = ((1 - tt / yc) * 100).toFixed(1);
        return `Quãng đường ban ngày thiếu ${pct}% (thiếu ${thieu.toFixed(2)} km, yêu cầu ${yc} km).`;
      },
    },
  ];

  rules.forEach((rule) => {
    if (rule.condition) {
      const issue = {
        type: rule.type,
        label: rule.label,
        message: rule.getMessage(),
      };
      if (rule.type === "error") errors.push(issue);
      else warnings.push(issue);
    }
  });

  return { status: errors.length === 0 ? "pass" : "fail", errors, warnings };
}
