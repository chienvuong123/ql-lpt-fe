/**
 * DieuKienKiemTra.js
 *
 * Logic kiểm tra:
 *  1. Tên giáo viên: HoTenGV trong mỗi phiên học phải khớp với giaoVien trong dataCheck
 *  2. Biển số xe:
 *     - Nếu chỉ có xeB1 (xeB2 rỗng): tất cả phiên phải dùng biển số xeB1
 *     - Nếu có cả xeB1 và xeB2: tất cả phiên phải dùng một trong hai biển số đó
 *       (và BẮT BUỘC phải có phiên dùng xeB1 VÀ phải có phiên dùng xeB2)
 */

// ─── Chuẩn hoá biển số để so sánh ─────────────────────────────────────────────
// API trả về "34A02665", DB lưu "34A-026.65" → chuẩn hoá bằng cách bỏ dấu gạch/chấm/cách
function normalizePlate(plate) {
  if (!plate) return "";
  return plate
    .replace(/[-.\s]/g, "")
    .toUpperCase()
    .trim();
}

// ─── Chuẩn hoá tên để so sánh (bỏ dấu thừa, uppercase) ───────────────────────
function normalizeName(name) {
  if (!name) return "";
  return name.trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * computeSummary: tổng hợp thông tin từ danh sách phiên học
 * @param {Array} dataSource  - mảng phiên học từ API HanhTrinh
 */
export function computeSummary(dataSource) {
  const totalSessions = dataSource.length;
  const teacherSet = new Set(
    dataSource.map((s) => normalizeName(s.HoTenGV)).filter(Boolean),
  );
  const plateSet = new Set(
    dataSource.map((s) => normalizePlate(s.BienSo)).filter(Boolean),
  );

  return {
    totalSessions,
    teachers: [...teacherSet],
    plates: [...plateSet],
  };
}

/**
 * evaluate: kiểm tra điều kiện dựa trên summary và thông tin học viên (studentInfo)
 *
 * studentInfo lấy từ dataCheck (record tìm theo maDangKy), gồm:
 *   - giaoVien: tên giáo viên đăng ký
 *   - xeB1: biển số xe B1 (có thể rỗng)
 *   - xeB2: biển số xe B2 (có thể rỗng)
 *
 * @param {Object} summary     - kết quả từ computeSummary
 * @param {Array}  dataSource  - mảng phiên học gốc (nếu cần chi tiết)
 * @param {Object} studentInfo - thông tin học viên từ dataCheck
 */
export function evaluate(summary, dataSource, studentInfo) {
  const errors = [];
  const warnings = [];

  // ── Không có studentInfo → không thể kiểm tra ──────────────────────────────
  if (!studentInfo) {
    errors.push({
      type: "error",
      label: "Không tìm thấy thông tin học viên",
      message:
        "Không tìm thấy thông tin học viên trong danh sách. Vui lòng kiểm tra mã đăng ký.",
    });
    return { status: "fail", errors, warnings };
  }

  const registeredTeacher = normalizeName(studentInfo.giaoVien);
  const registeredPlateB1 = normalizePlate(studentInfo.xeB1);
  const registeredPlateB2 = normalizePlate(studentInfo.xeB2);
  const hasTwoPlates = !!registeredPlateB2; // true nếu có cả xeB2

  // ══════════════════════════════════════════════════════════════════════════════
  // KIỂM TRA 1: Tên giáo viên
  // Tất cả phiên học phải có HoTenGV khớp với giaoVien đã đăng ký
  // ══════════════════════════════════════════════════════════════════════════════
  const wrongTeacherSessions = dataSource.filter(
    (s) => normalizeName(s.HoTenGV) !== registeredTeacher,
  );

  if (wrongTeacherSessions.length > 0) {
    const wrongNames = [
      ...new Set(wrongTeacherSessions.map((s) => s.HoTenGV || "(trống)")),
    ].join(", ");
    errors.push({
      type: "error",
      label: "Sai giáo viên",
      message: `Đăng ký với GV: "${studentInfo.giaoVien}", nhưng hành trình có phiên dạy bởi: "${wrongNames}" (${wrongTeacherSessions.length} phiên không khớp).`,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // KIỂM TRA 2: Biển số xe
  // ══════════════════════════════════════════════════════════════════════════════
  if (!registeredPlateB1 && !registeredPlateB2) {
    // Không có thông tin xe nào → cảnh báo
    warnings.push({
      type: "warning",
      label: "Không có thông tin xe",
      message:
        "Học viên không có thông tin biển số xe đăng ký. Không thể kiểm tra biển số.",
    });
  } else {
    // 1. Tập hợp biển số hợp lệ (đã chuẩn hóa)
    const registeredPlateB1 = normalizePlate(studentInfo.xeB1);
    const registeredPlateB2 = normalizePlate(studentInfo.xeB2);

    const allowedPlates = new Set(
      [registeredPlateB1, registeredPlateB2].filter(Boolean),
    );

    // 2. Lọc ra các phiên có biển số không nằm trong danh sách đăng ký
    const wrongPlateSessions = dataSource.filter(
      (s) => !allowedPlates.has(normalizePlate(s.BienSo)),
    );

    if (wrongPlateSessions.length > 0) {
      // Lấy danh sách các biển số sai (duy nhất) để hiển thị
      const wrongPlates = [
        ...new Set(wrongPlateSessions.map((s) => s.BienSo || "(trống)")),
      ].join(", ");

      // Tạo danh sách xe đã đăng ký để đối chiếu
      const allowedList = [studentInfo.xeB1, studentInfo.xeB2]
        .filter(Boolean)
        .join(", ");

      // BÁO LỖI: Cập nhật nội dung theo yêu cầu của bạn
      errors.push({
        type: "error",
        label: "Sai biển số xe",
        message: `Xe đăng ký: "${allowedList}", nhưng hành trình có phiên dùng xe: "${wrongPlates}" (${wrongPlateSessions.length} phiên không đúng).`,
      });
    }

    // 3. Nếu đăng ký 2 xe -> Kiểm tra xem có đủ cả 2 xe trong hành trình không
    if (hasTwoPlates) {
      const platesUsed = new Set(
        dataSource.map((s) => normalizePlate(s.BienSo)).filter(Boolean),
      );

      const usedB1 = platesUsed.has(registeredPlateB1);
      const usedB2 = platesUsed.has(registeredPlateB2);

      // CẢNH BÁO: Chỉ báo thiếu nếu chạy được 1 xe, nếu không chạy xe nào thì đã dính lỗi "Sai biển số" ở trên
      if (!usedB1) {
        warnings.push({
          type: "warning",
          label: "Thiếu phiên xe B1",
          message: `Học viên đăng ký 2 xe nhưng chưa có phiên học nào trên xe B1: "${studentInfo.xeB1}".`,
        });
      }

      if (!usedB2) {
        warnings.push({
          type: "warning",
          label: "Thiếu phiên xe B2",
          message: `Học viên đăng ký 2 xe nhưng chưa có phiên học nào trên xe B2: "${studentInfo.xeB2}".`,
        });
      }
    }
  }

  const status = errors.length === 0 ? "pass" : "fail";
  return { status, errors, warnings };
}
