export const HANG_DAO_TAO_CONFIG = {
  B1: {
    thoiGian: { banNgay: 9, banDem: 3, tuDong: 0, tong: 12 },
    quangDuong: { banNgay: 590, banDem: 120, tuDong: 0, tong: 710 },
  },
  B11: {
    thoiGian: { banNgay: 9, banDem: 3, tuDong: 0, tong: 12 },
    quangDuong: { banNgay: 590, banDem: 120, tuDong: 0, tong: 710 },
  },
  "B.01": {
    thoiGian: { banNgay: 9, banDem: 3, tuDong: 0, tong: 12 },
    quangDuong: { banNgay: 590, banDem: 120, tuDong: 0, tong: 710 },
  },
  B2: {
    thoiGian: { banNgay: 15, banDem: 3, tuDong: 2, tong: 20 },
    quangDuong: { banNgay: 610, banDem: 120, tuDong: 80, tong: 810 },
  },
  B: {
    thoiGian: { banNgay: 15, banDem: 3, tuDong: 2, tong: 20 },
    quangDuong: { banNgay: 610, banDem: 120, tuDong: 80, tong: 810 },
  },
  C: {
    thoiGian: { banNgay: 20, banDem: 3, tuDong: 1, tong: 24 },
    quangDuong: { banNgay: 705, banDem: 90, tuDong: 30, tong: 825 },
  },
  C1: {
    thoiGian: { banNgay: 20, banDem: 3, tuDong: 1, tong: 24 },
    quangDuong: { banNgay: 705, banDem: 90, tuDong: 30, tong: 825 },
  },
};

const CUNG_DUONG_CONFIG = [
  {
    id: "chi_linh",
    ten: "Chí Linh",
    bounds: { latMin: 21.05, latMax: 21.25, lngMin: 106.3, lngMax: 106.65 },
  },
  {
    id: "kinh_mon",
    ten: "Kinh Môn",
    bounds: { latMin: 20.92, latMax: 21.05, lngMin: 106.4, lngMax: 106.62 },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function normalizeName(str = "") {
  return str.normalize("NFC").trim().replace(/\s+/g, " ");
}

export const normalizePlate = (plate) =>
  String(plate || "")
    .replace(/[-.\s]/g, "")
    .toUpperCase()
    .trim();

function getCourseYearFromCode(courseCode = "") {
  const match = String(courseCode)
    .trim()
    .match(/^K(\d{2})/i);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

function shouldCheckCungDuongByCourse(courseCode = "") {
  const year = getCourseYearFromCode(courseCode);
  return year !== null && year >= 25;
}

// ─── Check cung đường ────────────────────────────────────────────────────────

export function checkCungDuong(listCoordinate, bounds) {
  if (!Array.isArray(listCoordinate) || listCoordinate.length === 0)
    return false;
  return listCoordinate.some(
    (point) =>
      point.Latitude >= bounds.latMin &&
      point.Latitude <= bounds.latMax &&
      point.Longitude >= bounds.lngMin &&
      point.Longitude <= bounds.lngMax,
  );
}

export function evaluateCungDuong(dataSource) {
  const allCoords = dataSource?.flatMap((item) => item.ListCoordinate || []);
  const daDiQuaMotTrong = CUNG_DUONG_CONFIG.some(({ bounds }) =>
    checkCungDuong(allCoords, bounds),
  );
  if (!daDiQuaMotTrong) {
    return [
      {
        type: "error",
        label: "Cung đường Chí Linh / Kinh Môn",
        message: "Chưa đi qua cung đường Chí Linh hoặc Kinh Môn.",
      },
    ];
  }
  return [];
}

// ─── Check thời gian nghỉ giữa phiên ────────────────────────────────────────

export function evaluateNghiGiuaPhien(dataSource) {
  if (!dataSource || dataSource.length < 2) return [];

  const errors = [];
  const sorted = [...dataSource].sort(
    (a, b) => new Date(a.ThoiDiemDangNhap) - new Date(b.ThoiDiemDangNhap),
  );

  const formatTime = (d) =>
    d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  for (let i = 1; i < sorted.length; i++) {
    const phienTruoc = sorted[i - 1];
    const phienSau = sorted[i];
    const thoiGianXuat = new Date(phienTruoc.ThoiDiemDangXuat);
    const thoiGianNhap = new Date(phienSau.ThoiDiemDangNhap);
    if (isNaN(thoiGianXuat) || isNaN(thoiGianNhap)) continue;

    const khoangCachPhut = (thoiGianNhap - thoiGianXuat) / 1000 / 60;
    if (khoangCachPhut < 15) {
      errors.push({
        type: "warning",
        label: "Thời gian nghỉ giữa phiên",
        message: `Phiên ${i} và ${i + 1}: nghỉ chỉ ${khoangCachPhut.toFixed(0)} phút (${formatTime(thoiGianXuat)} → ${formatTime(thoiGianNhap)}), yêu cầu tối thiểu 15 phút.`,
      });
    }
  }
  return errors;
}

// ─── Check tốc độ trung bình từng phiên ─────────────────────────────────────

export function evaluateTocDoPhien(dataSource) {
  if (!dataSource || dataSource.length === 0) return [];

  const errors = [];
  const MIN_SPEED = 18;

  const formatTime = (str) => {
    if (!str) return "";
    const d = new Date(str);
    return isNaN(d)
      ? str
      : d.toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  dataSource.forEach((phien, idx) => {
    const km = phien.TongQuangDuong || phien.TongQD_raw || 0;
    const giay = phien.TongThoiGian || 0;
    if (giay === 0 || km === 0) return;

    const tocDoTrungBinh = km / (giay / 3600);
    if (tocDoTrungBinh < MIN_SPEED) {
      errors.push({
        type: "warning",
        label: "Tốc độ trung bình phiên",
        message: `Phiên ${idx + 1} (${formatTime(phien.ThoiDiemDangNhap)}): tốc độ ${tocDoTrungBinh.toFixed(1)} km/h, yêu cầu tối thiểu ${MIN_SPEED} km/h.`,
      });
    }
  });
  return errors;
}

// ─── [MỚI] Check sai giáo viên ───────────────────────────────────────────────

/**
 * @param {Array} dataSource - Mảng phiên hành trình
 * @param {object} studentCheckInfo - Thông tin học viên đăng ký { giaoVien: string }
 */
export function evaluateSaiGiaoVien(dataSource, studentCheckInfo) {
  if (!dataSource || dataSource.length === 0) return [];
  if (!studentCheckInfo?.giaoVien) return [];

  const errors = [];
  const registeredTeacher = normalizeName(studentCheckInfo.giaoVien);

  const formatTime = (str) => {
    if (!str) return "";
    const d = new Date(str);
    return isNaN(d)
      ? str
      : d.toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  dataSource.forEach((phien, idx) => {
    const sessionTeacher = normalizeName(phien.HoTenGV);

    if (!sessionTeacher) return;
    if (sessionTeacher.toUpperCase() !== registeredTeacher.toUpperCase()) {
      errors.push({
        type: "warning",
        label: "Sai giáo viên",
        message: `Phiên ${idx + 1} (${formatTime(phien.ThoiDiemDangNhap)}): giáo viên "${phien.HoTenGV}" không khớp với đăng ký "${studentCheckInfo.giaoVien}".`,
      });
    }
  });
  return errors;
}

// ─── [MỚI] Check sai biển số xe ──────────────────────────────────────────────

/**
 * @param {Array} dataSource - Mảng phiên hành trình
 * @param {object} studentCheckInfo - Thông tin học viên đăng ký { xeB1: string, xeB2: string }
 */
export function evaluateSaiBienSo(dataSource, studentCheckInfo) {
  if (!dataSource || dataSource.length === 0) return [];

  const allowedPlates = [
    normalizePlate(studentCheckInfo?.xeB1),
    normalizePlate(studentCheckInfo?.xeB2),
  ].filter(Boolean);

  if (allowedPlates.length === 0) return [];

  const errors = [];

  const formatTime = (str) => {
    if (!str) return "";
    const d = new Date(str);
    return isNaN(d)
      ? str
      : d.toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  dataSource.forEach((phien, idx) => {
    const sessionPlate = normalizePlate(phien.BienSo);
    if (!sessionPlate) return;
    if (!allowedPlates.includes(sessionPlate)) {
      errors.push({
        type: "warning",
        label: "Sai biển số xe",
        message: `Phiên ${idx + 1} (${formatTime(phien.ThoiDiemDangNhap)}): biển số "${phien.BienSo}" không nằm trong danh sách xe đăng ký (${allowedPlates.join(", ")}).`,
      });
    }
  });
  return errors;
}

// ─── Check phiên học dưới 5 phút ─────────────────────────────────────────────

export function evaluatePhienDuoi5Phut(dataSource) {
  if (!dataSource || dataSource.length === 0) return [];

  const errors = [];
  const MIN_MINUTES = 5;

  const formatTime = (str) => {
    if (!str) return "";
    const d = new Date(str);
    return isNaN(d)
      ? str
      : d.toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  dataSource.forEach((phien, idx) => {
    const giay = phien.TongThoiGian || 0;
    if (giay === 0) return; // bỏ qua phiên không có dữ liệu

    const phut = giay / 60;
    if (phut < MIN_MINUTES) {
      errors.push({
        type: "warning",
        label: "Phiên học quá ngắn",
        message: `Phiên ${idx + 1} (${formatTime(phien.ThoiDiemDangNhap)}): tổng thời gian chỉ ${phut.toFixed(1)} phút, yêu cầu tối thiểu ${MIN_MINUTES} phút.`,
      });
    }
  });

  return errors;
}

// ─── computeSummary ───────────────────────────────────────────────────────────

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

// ─── evaluate (tổng hợp) ──────────────────────────────────────────────────────

/**
 * @param {object} summaryData     - Kết quả từ computeSummary
 * @param {Array}  dataSource      - Raw data phiên hành trình
 * @param {Array}  loTrinh         - Dữ liệu lộ trình từ API LoTrinhOnline
 * @param {object} studentCheckInfo - Thông tin đăng ký: { giaoVien, xeB1, xeB2 }
 */
export function evaluate(
  summaryData,
  dataSource = [],
  loTrinh = [],
  studentCheckInfo = null,
) {
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

  // ── Các check bổ sung ────────────────────────────────────────────────────
  warnings.push(...evaluateNghiGiuaPhien(dataSource)); // nghỉ < 15 phút
  warnings.push(...evaluateTocDoPhien(dataSource)); // tốc độ < 18 km/h
  warnings.push(...evaluateSaiGiaoVien(dataSource, studentCheckInfo)); //sai giáo viên
  warnings.push(...evaluateSaiBienSo(dataSource, studentCheckInfo)); //sai biển số xe
  warnings.push(...evaluatePhienDuoi5Phut(dataSource)); //thêm dòng này

  const courseCode =
    dataSource?.[0]?.MaKhoaHoc ||
    dataSource?.[0]?.MaKhoa ||
    dataSource?.[0]?.KhoaHoc ||
    "";
  if (shouldCheckCungDuongByCourse(courseCode)) {
    warnings.push(...evaluateCungDuong(loTrinh)); // check cung đường
  }

  return { status: errors.length === 0 ? "pass" : "fail", errors, warnings };
}
