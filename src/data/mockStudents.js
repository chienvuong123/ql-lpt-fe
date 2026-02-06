// Dữ liệu mẫu học viên - có thể thay bằng API sau
export const mockStudents = [
  {
    id: "1",
    name: "HOÀNG MINH CHIẾN",
    citizenId: "030099014682",
    instructorName: "Đỗ Đức Hưng",
    dateOfBirth: "17/11/1999",
    courseId: "K25B021",
    trainingRank: "B",
    avatar: null,
    signed: false,
    internalNote: "",
    publicNote: "",
    cabinData: false,
    evaluationStatus: "Chưa đạt",
    evaluationReasons: [
      "Cảnh báo: Không có tên giáo viên để kiểm tra tính nhất quán.",
      "Hạng B số sàn",
      "Tách 0 phiên xe số tự động vào trải nghiệm; 0 phiên số sàn dùng để chia ngày/đêm.",
      "Cảnh báo: Thời gian ban ngày thiếu quá 20% so với yêu cầu.",
    ],
    trainingSessions: [],
    totalDuration: 0,
    totalDistance: 0,
  },
  {
    id: "2",
    name: "NGUYỄN VĂN A",
    citizenId: "001099012345",
    instructorName: "Trần Văn B",
    dateOfBirth: "01/05/2000",
    courseId: "K25B022",
    trainingRank: "B",
    avatar: null,
    signed: true,
    internalNote: "",
    publicNote: "",
    cabinData: true,
    evaluationStatus: "Đạt",
    evaluationReasons: [],
    trainingSessions: [
      {
        stt: 1,
        sessionName: "Phiên 1",
        vehiclePlate: "51A-12345",
        vehicleClass: "B",
        recognitionRate: "85%",
        trainingRank: "B",
        trainingDate: "01/02/2025",
        duration: "120",
        distance: "45.5",
        avgSpeed: "22",
        conclusion: "Đạt",
        studentName: "NGUYỄN VĂN A",
        instructorName: "Trần Văn B",
        sessionId: "sess-001",
      },
    ],
    totalDuration: 120,
    totalDistance: 45.5,
  },
  {
    id: "3",
    name: "LÊ THỊ C",
    citizenId: "079099015678",
    instructorName: "Phạm Văn D",
    dateOfBirth: "15/08/1998",
    courseId: "K25B023",
    trainingRank: "B2",
    avatar: null,
    signed: false,
    internalNote: "",
    publicNote: "",
    cabinData: false,
    evaluationStatus: "Chưa đạt",
    evaluationReasons: ["Thiếu giờ lái ban đêm."],
    trainingSessions: [],
    totalDuration: 0,
    totalDistance: 0,
  },
];

export function searchStudents({ name, citizenId }) {
  let list = [...mockStudents];
  if (name?.trim()) {
    const q = name.trim().toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q));
  }
  if (citizenId?.trim()) {
    const q = citizenId.trim();
    list = list.filter((s) => s.citizenId.includes(q));
  }
  return list;
}

export function getStudentById(id) {
  return mockStudents.find((s) => s.id === id) ?? null;
}
