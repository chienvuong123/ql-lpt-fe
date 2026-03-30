function randomName() {
  const ho = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Vũ",
    "Đặng",
    "Bùi",
    "Đỗ",
  ];
  const dem = [
    "Văn",
    "Thị",
    "Hữu",
    "Minh",
    "Quang",
    "Tuấn",
    "Thanh",
    "Ngọc",
    "Gia",
  ];
  const ten = [
    "Anh",
    "Bình",
    "Cường",
    "Dũng",
    "Giang",
    "Hà",
    "Hùng",
    "Lan",
    "Linh",
    "Mai",
    "Nam",
    "Phong",
    "Quân",
    "Trang",
  ];

  return `${ho[Math.floor(Math.random() * ho.length)]} ${
    dem[Math.floor(Math.random() * dem.length)]
  } ${ten[Math.floor(Math.random() * ten.length)]}`.toUpperCase();
}

function randomTeacher() {
  const list = ["Nguyễn Thị Thảo", "Nguyễn Văn B", "Trần Văn C", "Lê Thị D"];
  return list[Math.floor(Math.random() * list.length)];
}

function randomCCCD() {
  return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

function randomMaDK(index) {
  return `30004-${Date.now()}${String(index).padStart(3, "0")}`;
}

function createStudent(index, forceCabin = null, customMinutes = null) {
  const hasCabin = forceCabin !== null ? forceCabin : Math.random() > 0.4; // 60% có cabin
  const khoaList = ["K20", "K21", "K22", "K23", "K24"];
  const khoa = khoaList[Math.floor(Math.random() * khoaList.length)];

  let daysToAdd = 0;
  if (khoa === "K20") daysToAdd = Math.floor(Math.random() * 20) + 1; // 1 to 20 days
  else if (khoa === "K21") daysToAdd = 30 + Math.floor(Math.random() * 20);
  else if (khoa === "K22") daysToAdd = 60 + Math.floor(Math.random() * 20);
  else if (khoa === "K23") daysToAdd = 90 + Math.floor(Math.random() * 20);
  else if (khoa === "K24") daysToAdd = 120 + Math.floor(Math.random() * 20);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysToAdd);
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 3); // 3 months duration

  const formatDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    ma_dk: randomMaDK(index),
    ho_ten: randomName(),
    cccd: randomCCCD(),
    nam_sinh: 1985 + Math.floor(Math.random() * 15),

    loai_ly_thuyet: Math.random() > 0.5,
    loai_het_mon: Math.random() > 0.5,
    dat_cabin: hasCabin,
    hang_xe: Math.random() > 0.4 ? "B2" : "B1",
    khoa_hoc: khoa,
    
    ngay_bat_dau: formatDate(startDate),
    ngay_ket_thuc: formatDate(endDate),

    ghi_chu: `note ngày ${Math.floor(Math.random() * 30) + 1}`,

    bai_cabin: hasCabin ? Math.floor(Math.random() * 9) : null, // 0 -> 8
    phut_cabin: hasCabin
      ? customMinutes !== null
        ? customMinutes
        : Math.floor(Math.random() * 151) // 0 -> 150
      : null,

    giao_vien: randomTeacher(),
  };
}

function generateGuaranteedGroup() {
  // random chọn nhóm 2 hoặc 3 học viên
  const size = Math.random() > 0.5 ? 2 : 3;

  let minutes = [];

  if (size === 2) {
    // ví dụ 20..80 và đảm bảo tổng < 150
    const m1 = 20 + Math.floor(Math.random() * 50); // 20..69
    const maxM2 = Math.min(149 - m1, 80);
    const m2 = 10 + Math.floor(Math.random() * Math.max(1, maxM2 - 9));
    minutes = [m1, m2];
  } else {
    // 3 học viên, mỗi người 10..60 và tổng < 150
    const m1 = 10 + Math.floor(Math.random() * 40);
    const m2 = 10 + Math.floor(Math.random() * 40);
    const maxM3 = Math.min(149 - m1 - m2, 60);

    if (maxM3 >= 10) {
      const m3 = 10 + Math.floor(Math.random() * (maxM3 - 9));
      minutes = [m1, m2, m3];
    } else {
      // fallback nếu 2 số đầu hơi lớn
      minutes = [20, 30, 40]; // tổng 90
    }
  }

  return minutes;
}

export function generateStudents(n = 200) {
  if (n < 3) {
    throw new Error("n phải >= 3");
  }

  const students = [];

  // Tạo trước 1 nhóm chắc chắn có tổng phút < 150
  const guaranteedMinutes = generateGuaranteedGroup();

  for (let i = 0; i < guaranteedMinutes.length; i++) {
    students.push(createStudent(i, true, guaranteedMinutes[i]));
  }

  // Các học viên còn lại random bình thường
  for (let i = guaranteedMinutes.length; i < n; i++) {
    students.push(createStudent(i));
  }

  return students;
}
