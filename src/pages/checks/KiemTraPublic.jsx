import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Image,
  Input,
  Layout,
  message,
  Progress,
  Row,
  Select,
  Space,
  Typography,
  Spin,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDuLieuCabin } from "../../apis/searchPublic";
import LyThuyetScoreModal from "./LyThuyetScoreModal";
import CabinModal from "./CabinModal";
import {
  DangNhapPublic,
  getTienDoDaoTaoByMaHocVienSqlDeploy,
  HanhTrinhPublic,
  hocVienKyDATPublic,
  optionLopLyThuyetPublic,
  hocVienTheoKhoaPublic,
  getHocVienByMaKhoaSqlPublic,
  fetchCheckStudentsPublic,
  ketQuaKiemTraPublic,
} from "../../apis/apiDeploy";
import ModalTest from "./ModalTest";

import "./index.css";
// import { getChiTietHocVienLyThuyet } from "../../apis/apiHocVienLopLyThuyet";

const { Header, Footer, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const PUBLIC_CHECK_USERNAME = import.meta.env.VITE_PUBLIC_CHECK_USERNAME;
const PUBLIC_CHECK_PASSWORD = import.meta.env.VITE_PUBLIC_CHECK_PASSWORD;
const PUBLIC_CHECK_USERNAME_NEW = import.meta.env.VITE_USERNAME_NEW;
const PUBLIC_CHECK_PASSWORD_NEW = import.meta.env.VITE_PASSWORD_NEW;

const CABIN_RULES = [
  {
    key: "do_thi",
    label: "Bài lái trong đô thị",
    keywords: ["bai lai trong do thi", "do thi"],
    requiredMinutes: 10,
    passMinutes: 3,
  },
  {
    key: "cao_toc",
    label: "Bài lái xe cao tốc",
    keywords: ["bai lai xe cao toc", "cao toc"],
    requiredMinutes: 30,
    passMinutes: 35,
  },
  {
    key: "doi_nui",
    label: "Bài lái xe đồi núi",
    keywords: ["bai lai xe doi nui", "doi nui"],
    requiredMinutes: 3,
    passMinutes: 3,
  },
  {
    key: "pha",
    label: "Bài lái xe lên, xuống phà",
    keywords: ["bai lai xe len, xuong pha", "len, xuong pha", "pha"],
    requiredMinutes: 3,
    passMinutes: 3,
  },
  {
    key: "lay",
    label: "Bài lái xe trên đường lầy",
    keywords: ["bai lai xe tren duong lay", "duong lay", "lay"],
    requiredMinutes: 10,
    passMinutes: 3,
  },
  {
    key: "suong_mu",
    label: "Bài lái xe trong điều kiện sương mù",
    keywords: ["bai lai xe trong dieu kien suong mu", "suong mu", "xuong mu"],
    requiredMinutes: 10,
    passMinutes: 3,
  },
  {
    key: "nuoc_ngam",
    label: "Lái xe qua đường ngập nước, lái xe qua ngầm",
    keywords: [
      "lai xe qua duong ngap nuoc, lai xe qua ngam",
      "qua duong ngap nuoc",
      "qua ngam",
      "nuoc ngam",
    ],
    requiredMinutes: 10,
    passMinutes: 3,
  },
  {
    key: "tong_hop",
    label: "Bài lái xe tổng hợp",
    keywords: ["bai lai xe tong hop", "tong hop"],
    requiredMinutes: 10,
    passMinutes: 5,
  },
];

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const getCabinRuleByName = (name = "") => {
  const normalizedName = normalizeText(name);
  return CABIN_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedName.includes(keyword)),
  );
};

const extractKhoaNumber = (value = "") => {
  const prefix = String(value).trim().slice(0, 3).toLowerCase();
  const match = prefix.match(/^k(\d{2})$/);
  return match ? Number(match[1]) : null;
};

const SearchControls = ({
  isLoadingKhoaHoc,
  selectedKhoaHoc,
  setSelectedKhoaHoc,
  khoaHocOptions,
  sortedCourses,
  onSearch,
  keyword,
  setKeyword,
}) => {
  const [localKeyword, setLocalKeyword] = useState(keyword);

  useEffect(() => {
    setLocalKeyword(keyword);
  }, [keyword]);

  const handleSearchClick = () => {
    onSearch(localKeyword);
  };

  return (
    <Row gutter={[8, 8]} align="bottom">
      <Col span={18}>
        <Text className="!mb-1 !text-xs !uppercase !text-gray-500">
          Từ khóa
        </Text>
        <Input
          value={localKeyword}
          onChange={(e) => setLocalKeyword(e.target.value)}
          onPressEnter={handleSearchClick}
          style={{ fontSize: 13 }}
          placeholder="Nhập tên học viên"
        />
      </Col>

      <Col span={6}>
        <Button
          type="primary"
          className="w-full"
          onClick={handleSearchClick}
          disabled={localKeyword.trim().length === 0}
        >
          Tìm
        </Button>
      </Col>
    </Row>
  );
};

const KiemTraPublic = () => {
  const [keyword, setKeyword] = useState("");
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");
  const [searchParams, setSearchParams] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLyThuyetModalOpen, setIsLyThuyetModalOpen] = useState(false);
  const [isCabinModalOpen, setIsCabinModalOpen] = useState(false);
  const [isDatModalOpen, setIsDatModalOpen] = useState(false);

  const { data: khoaHocData, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["optionLopLyThuyet"],
    queryFn: () => optionLopLyThuyetPublic(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const sortedCourses = useMemo(() => {
    const rawOptions = khoaHocData?.data || khoaHocData?.result || [];
    const options = Array.isArray(rawOptions) ? rawOptions : [];

    return [...options].sort((a, b) => {
      const tsA = a?.ts || 0;
      const tsB = b?.ts || 0;
      if (tsA !== tsB) return tsB - tsA;

      const iidA = Number(a?.iid || 0);
      const iidB = Number(b?.iid || 0);
      return iidB - iidA;
    });
  }, [khoaHocData]);

  const selectedCourse = useMemo(() => {
    return sortedCourses.find(
      (item) => String(item?.iid) === String(selectedKhoaHoc),
    );
  }, [sortedCourses, selectedKhoaHoc]);

  const selectedKhoaHocLabel = useMemo(() => {
    return selectedCourse?.suffix_name || selectedCourse?.name || selectedStudent?.ten_khoa || selectedStudent?.ma_khoa || "";
  }, [selectedCourse, selectedStudent]);

  const selectedKhoaHocCode = useMemo(() => {
    return selectedCourse?.code || selectedCourse?.name || selectedStudent?.ma_khoa || "";
  }, [selectedCourse, selectedStudent]);

  const isK26B014OrLater = useMemo(() => {
    const courseCode = String(
      selectedCourse?.code ||
      selectedCourse?.name ||
      selectedStudent?.ma_khoa ||
      selectedStudent?.MaKhoaHoc ||
      ""
    ).toUpperCase();

    if (!courseCode) return false;

    const course = selectedCourse || sortedCourses.find(
      (c) =>
        String(c?.code).toUpperCase() === courseCode ||
        String(c?.name).toUpperCase() === courseCode
    );

    if (course) {
      const selectedDate = course.start_date || course.start_time || 0;
      if (selectedDate > 0) {
        return selectedDate >= 1776272400; // start_date of K26B014
      }
    }

    const isLaterByCode = (code = "") => {
      const match = code.match(/K(\d+)[A-Z]*(\d+)/);
      if (match) {
        const kNum = parseInt(match[1], 10);
        const classNum = parseInt(match[2], 10);
        if (kNum > 26) return true;
        if (kNum === 26 && classNum >= 14) return true;
      }
      return false;
    };

    return isLaterByCode(courseCode);
  }, [selectedCourse, sortedCourses, selectedStudent]);

  const datCourseCode = useMemo(() => {
    const code = selectedKhoaHocCode;
    if (isK26B014OrLater) {
      let newCode = code;
      if (newCode.includes("3101130004")) {
        newCode = newCode.replace("3101130004", "31011");
      } else if (newCode.includes("30004")) {
        newCode = newCode.replace("30004", "31011");
      }

      if (!newCode.startsWith("31011")) {
        return `31011${newCode}`;
      }
      return newCode;
    }
    return code;
  }, [isK26B014OrLater, selectedKhoaHocCode]);

  const { data, refetch, isLoading: isLoggingIn } = useQuery({
    queryKey: ["loginPublicCheck"],
    queryFn: async () => {
      const username = PUBLIC_CHECK_USERNAME || "chienvx";
      const password = PUBLIC_CHECK_PASSWORD || "@chienvx";

      const res = await DangNhapPublic({
        Username: username,
        Password: password,
      }, false);
      if (!res?.data || res?.data?.ID === 0) {
        throw new Error(res?.data?.Name || "Đăng nhập thất bại");
      }
      return res?.data;
    },
    enabled: true,
    retry: true,
    retryDelay: 3000,
  });

  const { data: dataNew, isLoading: isLoggingInNew } = useQuery({
    queryKey: ["loginPublicCheckNew"],
    queryFn: async () => {
      const username = PUBLIC_CHECK_USERNAME_NEW || "dltx_lpt_31011";
      const password = PUBLIC_CHECK_PASSWORD_NEW || "@tcdbvn";

      const res = await DangNhapPublic({
        Username: username,
        Password: password,
      }, true);
      if (!res?.data || res?.data?.ID === 0) {
        throw new Error(res?.data?.Name || "Đăng nhập thất bại");
      }
      return res?.data;
    },
    enabled: isK26B014OrLater,
    retry: true,
    retryDelay: 3000,
  });

  const isPublicLoggingIn = isLoggingIn || (isK26B014OrLater && isLoggingInNew);
  const isPublicAuthSuccess = isK26B014OrLater
    ? (!!dataNew && dataNew.ID !== 0)
    : (!!data && data.ID !== 0);

  const {
    data: danhSachHocVien = {},
    isLoading: loadingStudents,
    refetch: refetchSearchHocVien,
  } = useQuery({
    queryKey: ["getHocVienByMaKhoaSqlPublic", searchParams],
    queryFn: () =>
      getHocVienByMaKhoaSqlPublic({
        search: searchParams?.text || "",
      }),
    staleTime: 0,
    cacheTime: 0,
    retry: false,
    enabled: !!searchParams,
  });

  const cabinKey =
    selectedStudent?.ma_dk ||
    selectedStudent?.user?.admission_code ||
    selectedStudent?.user?.code ||
    selectedStudent?.MaDK ||
    "";

  const {
    data: chiTietLyThuyetData,
    isLoading: loadingChiTietLyThuyet,
  } = useQuery({
    queryKey: ["ketQuaKiemTraPublic", selectedStudent?.code, selectedStudent?.ma_khoa, cabinKey],
    queryFn: () => {
      const codeOrPlanId = selectedStudent?.code
      return ketQuaKiemTraPublic(codeOrPlanId, {
        text: cabinKey,
      });
    },
    staleTime: 0,
    retry: false,
    enabled: !!selectedStudent,
  });

  const {
    data: hocVienTheoKhoaData,
    isLoading: loadingHocVienTheoKhoa,
  } = useQuery({
    queryKey: ["hocVienTheoKhoaPublic", selectedStudent?.code, selectedStudent?.ma_khoa, cabinKey],
    queryFn: () => {
      const codeOrPlanId = selectedStudent?.code || selectedStudent?.ma_khoa;
      return hocVienTheoKhoaPublic(codeOrPlanId, {
        text: cabinKey,
      });
    },
    staleTime: 0,
    retry: false,
    enabled: !!selectedStudent,
  });

  const { data: dataCabin, isLoading: loadingCabin } = useQuery({
    queryKey: ["cabin", cabinKey],
    queryFn: () => getDuLieuCabin(cabinKey),
    enabled: !!cabinKey,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
    retry: false,
  });

  const { data: dataDat, isLoading: loadingDat } = useQuery({
    queryKey: ["hanhTrinhPublic", cabinKey, datCourseCode],
    queryFn: () =>
      HanhTrinhPublic({
        ngaybatdau: "2020-01-01",
        ngayketthuc: `${dayjs().format("YYYY-MM-DD")}T23:59:00`,
        ten: cabinKey,
        makhoahoc: datCourseCode,
        limit: 20,
        page: 1,
      }, isK26B014OrLater),
    enabled: isDatModalOpen && !!cabinKey && isPublicAuthSuccess,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: dataCheckStudents = {} } = useQuery({
    queryKey: ["checkStudentPublic"],
    queryFn: () => fetchCheckStudentsPublic(),
    enabled: isDatModalOpen && !!cabinKey,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: dataHocVienKyDat = {} } = useQuery({
    queryKey: ["dataHocVienKyDat", cabinKey],
    queryFn: () => hocVienKyDATPublic(cabinKey),
    enabled: !!cabinKey && !!searchParams,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: tienDoData } = useQuery({
    queryKey: ["tienDoDaoTao", selectedKhoaHocCode],
    queryFn: () => getTienDoDaoTaoByMaHocVienSqlDeploy({ ma_khoa: selectedKhoaHocCode }),
    enabled: !!selectedKhoaHocCode,
    staleTime: 1000 * 60 * 5,
  });

  const progressData = useMemo(() => {
    return tienDoData?.data?.[0] || null;
  }, [tienDoData]);

  const cabinDataList = useMemo(() => {
    const list = dataCabin?.data || dataCabin?.Data || [];
    return Array.isArray(list) ? list : [];
  }, [dataCabin]);

  const datJourneyList = useMemo(() => {
    const list = dataDat?.data?.Data || dataDat?.data || [];
    return Array.isArray(list) ? list : [];
  }, [dataDat]);

  const studentCheckInfo = useMemo(() => {
    const list = dataCheckStudents?.data || [];
    if (!Array.isArray(list) || !cabinKey) return null;
    const normalizedKey = String(cabinKey).trim();
    return (
      list.find(
        (item) => String(item?.maDangKy || "").trim() === normalizedKey,
      ) || null
    );
  }, [dataCheckStudents, cabinKey]);

  const uniqueCabinLessonCount = useMemo(() => {
    const lessonKeys = new Set();

    cabinDataList.forEach((item) => {
      const rule = getCabinRuleByName(item?.Name || "");
      if (rule) {
        lessonKeys.add(rule.key);
      } else {
        lessonKeys.add(normalizeText(item?.Name || ""));
      }
    });

    return lessonKeys.size;
  }, [cabinDataList]);

  const cabinGroupedByRule = useMemo(() => {
    const map = new Map(
      CABIN_RULES.map((rule) => [
        rule.key,
        {
          ...rule,
          learnedSeconds: 0,
          learnedMinutes: 0,
        },
      ]),
    );

    cabinDataList.forEach((item) => {
      const rule = getCabinRuleByName(item?.Name || "");
      if (!rule) return;
      const current = map.get(rule.key);
      if (!current) return;
      const seconds = Number(item?.TongThoiGian || 0);
      const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
      current.learnedSeconds += safeSeconds;
      current.learnedMinutes = current.learnedSeconds / 60;
    });

    return Array.from(map.values());
  }, [cabinDataList]);

  const khoaHocOptions = useMemo(() => {
    const options = sortedCourses || [];

    return options.map((kh) => ({
      label: kh?.name,
      value: kh?.iid || "",
    }));
  }, [sortedCourses]);

  const results = useMemo(() => {
    const list = danhSachHocVien?.data || danhSachHocVien?.result || (Array.isArray(danhSachHocVien) ? danhSachHocVien : []);
    if (!Array.isArray(list)) return [];

    const searchText = searchParams?.text?.trim()?.toLowerCase();
    if (!searchText) return list;

    // Normalization helper to search without Vietnamese accents
    const norm = (text = "") =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .trim();

    const normalizedSearch = norm(searchText);

    return list.filter((item) => {
      const name = item?.ho_ten || item?.user?.name || item?.name || "";
      const code = item?.ma_dk || item?.user?.admission_code || item?.user?.code || item?.code || "";
      const cccd = item?.cccd || item?.user?.identification_card || "";

      return (
        norm(name).includes(normalizedSearch) ||
        norm(code).includes(normalizedSearch) ||
        norm(cccd).includes(normalizedSearch)
      );
    });
  }, [danhSachHocVien, searchParams]);

  const trangThaiKyDAT = useMemo(() => {
    const status = dataHocVienKyDat?.data?.trang_thai === "da_ky";
    return status;
  }, [dataHocVienKyDat]);

  const hasResult = !!selectedStudent;
  const hasSearched = !!searchParams;
  const scoreRows = useMemo(() => {
    const studentData = chiTietLyThuyetData?.data?.[0];
    const hocVienDetail = Array.isArray(hocVienTheoKhoaData)
      ? hocVienTheoKhoaData[0]
      : hocVienTheoKhoaData?.data
        ? (Array.isArray(hocVienTheoKhoaData.data) ? hocVienTheoKhoaData.data[0] : hocVienTheoKhoaData.data)
        : hocVienTheoKhoaData;

    const rawScores =
      hocVienDetail?.learning_progress?.score_by_rubrik ||
      hocVienDetail?.learning?.score_by_rubrik ||
      studentData?.learning?.score_by_rubrik ||
      selectedStudent?.learning_progress?.score_by_rubrik ||
      chiTietLyThuyetData?.data?.learning_progress?.score_by_rubrik ||
      chiTietLyThuyetData?.learning_progress?.score_by_rubrik ||
      [];

    return rawScores
      .filter(
        (item) =>
          !String(item?.name || "").includes("Bảng tổng hợp") &&
          !String(item?.name || "").includes("Điểm kiểm tra tổng hợp") &&
          !String(item?.name || "").includes("Tổng thời gian học") &&
          !String(item?.name || "").includes("Pháp luật GTĐB"),
      )
      .map((item, index) => ({
        key: item?.iid || `${index}`,
        name: item?.name || "Không rõ",
        score: item?.score ?? 0,
        passed: Number(item?.passed) === 1 || item?.passed === true,
      }));
  }, [selectedStudent, chiTietLyThuyetData, hocVienTheoKhoaData]);

  const lyThuyetExtraStatus = useMemo(() => {
    const studentData = chiTietLyThuyetData?.data?.[0];
    const raw = studentData?.trang_thai || chiTietLyThuyetData?.data;

    const loaiHetMon = raw?.loai_het_mon;

    return {
      loaiHetMon: loaiHetMon ? "Đã làm" : "Chưa làm",
      loaiHetMonStatus: loaiHetMon,
    };
  }, [chiTietLyThuyetData]);

  const handleSearch = (searchKeyword = "") => {
    // Sync the parent's keyword state
    setKeyword(searchKeyword);

    if (searchKeyword.trim().length === 0) {
      message.warning("Vui lòng nhập từ khóa tìm kiếm.");
      return;
    }

    setSelectedKhoaHoc("");
    setSelectedStudent(null);
    setIsLyThuyetModalOpen(false);
    setIsCabinModalOpen(false);
    setIsDatModalOpen(false);
    setSearchParams({
      page: 1,
      text: searchKeyword.trim(),
    });
    refetchSearchHocVien();
  };

  const soMonLyThuyetDat = scoreRows.filter((item) => item.passed).length;
  const tongMonLyThuyet = scoreRows.length;
  const lyThuyetPercent =
    tongMonLyThuyet > 0
      ? Math.round((soMonLyThuyetDat / tongMonLyThuyet) * 100)
      : 0;

  const hasLyThuyetData = !!chiTietLyThuyetData || !!hocVienTheoKhoaData;

  const isEmptyLyThuyet = useMemo(() => {
    if (!chiTietLyThuyetData && !hocVienTheoKhoaData) return false;

    const isChiTietEmpty = !chiTietLyThuyetData?.data || chiTietLyThuyetData?.data?.length === 0;

    const hocVienDetail = Array.isArray(hocVienTheoKhoaData)
      ? hocVienTheoKhoaData[0]
      : hocVienTheoKhoaData?.data
        ? (Array.isArray(hocVienTheoKhoaData.data) ? hocVienTheoKhoaData.data[0] : hocVienTheoKhoaData.data)
        : hocVienTheoKhoaData;

    const isTheoKhoaEmpty = !hocVienDetail || !hocVienDetail?.learning_progress;

    return isChiTietEmpty && isTheoKhoaEmpty;
  }, [chiTietLyThuyetData, hocVienTheoKhoaData]);

  const lyThuyetStatus = !hasLyThuyetData
    ? "Chưa xem"
    : isEmptyLyThuyet
      ? "Bảo trì"
      : lyThuyetPercent >= 100 && lyThuyetExtraStatus?.loaiHetMonStatus
        ? "Đạt"
        : "Trượt";
  const statusColor = !hasLyThuyetData
    ? "#7e8ea6"
    : isEmptyLyThuyet
      ? "#7e8ea6"
      : lyThuyetPercent >= 100 && lyThuyetExtraStatus?.loaiHetMonStatus
        ? "#1b8a35"
        : "#ff0000";
  // const isLyThuyetPassed =
  //   lyThuyetPercent >= 100 && lyThuyetExtraStatus?.loaiHetMonStatus;

  const totalCabinSeconds = useMemo(
    () =>
      cabinDataList.reduce(
        (sum, item) => sum + Number(item?.TongThoiGian || 0),
        0,
      ),
    [cabinDataList],
  );

  const khoaNumber = extractKhoaNumber(selectedKhoaHocCode || "");
  const requiredCabinSeconds = (khoaNumber ?? 0) >= 26 ? 2.5 * 3600 : 2 * 3600;
  const hasEnoughCabinLessons = uniqueCabinLessonCount >= 7;
  const hasEnoughCabinTime = totalCabinSeconds >= requiredCabinSeconds;
  const isCabinPassed =
    cabinDataList.length > 0 && hasEnoughCabinLessons && hasEnoughCabinTime;
  const cabinProgressPercent = Math.min(
    100,
    Math.round((totalCabinSeconds / requiredCabinSeconds) * 100),
  );
  const isAllCabinRulesPassed =
    cabinGroupedByRule.length > 0 &&
    cabinGroupedByRule.every((item) => item.learnedMinutes >= item.passMinutes);

  const isCabinMaintenance = useMemo(() => {
    return dataCabin?.success === true && cabinDataList.length === 0;
  }, [dataCabin, cabinDataList]);

  const cabinText = useMemo(() => {
    if (loadingCabin) return "Đang tải dữ liệu CABIN...";
    if (isCabinMaintenance) return "Bảo trì";
    if (cabinDataList.length === 0) return "Trượt";

    return isCabinPassed && isAllCabinRulesPassed ? "Đạt" : "Trượt";
  }, [
    loadingCabin,
    isCabinMaintenance,
    cabinDataList.length,
    isCabinPassed,
    isAllCabinRulesPassed,
  ]);
  const isCabinFinalPassed = isCabinPassed && isAllCabinRulesPassed;

  console.log("Debug check:", {
    selectedStudent,
    cabinKey,
    chiTietLyThuyetData,
    loadingChiTietLyThuyet,
    hocVienTheoKhoaData,
    loadingHocVienTheoKhoa,
  });

  useEffect(() => {
    window.history.pushState(null, null, window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, null, window.location.href);
      alert("Bạn không thể quay lại trang trước từ đây!");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <Layout className="!min-h-screen !bg-[#f2f4f8] !overflow-x-hidden">
      <div className="mx-auto w-full max-w-full lg:max-w-[430px] bg-[#f2f4f8]">
        <Header className="!h-auto !bg-[#0b8ed8] !px-5 !pb-3 !pt-2">
          <Flex align="center" justify="center">
            <Image
              src="/logo.png"
              width={140}
              height={80}
              preview={false}
              className="!object-contain"
            />
          </Flex>

          <Title
            level={1}
            className="!m-0 !text-center !text-base !font-extrabold !uppercase !tracking-tight !text-white"
          >
            TRA CỨU DỮ LIỆU HỌC TẬP
          </Title>
          <Paragraph className="!mb-0 !mt-3 !text-center !text-sm !text-white/90">
            Dữ liệu mang tính chất tham khảo, dữ liệu đủ điều kiện phải được học
            viên ký và duyệt từ phòng DAT.
          </Paragraph>
        </Header>

        <Content>
          <Card className="!rounded-none !border-x-0 !border-b-0 !border-t !border-[#d8dee8]">
            <SearchControls
              isLoadingKhoaHoc={isLoadingKhoaHoc}
              selectedKhoaHoc={selectedKhoaHoc}
              setSelectedKhoaHoc={setSelectedKhoaHoc}
              khoaHocOptions={khoaHocOptions}
              sortedCourses={sortedCourses}
              onSearch={handleSearch}
              keyword={keyword}
              setKeyword={setKeyword}
            />

            {!hasResult && (
              <Card
                className="!mt-4 !rounded-xl !border-[#d9dee8]"
                bodyStyle={{ padding: 12 }}
              >
                <Spin
                  spinning={loadingStudents}
                  tip="Đang tải danh sách học viên..."
                >
                  {hasSearched ? (
                    <>
                      <Text className="!mb-2 !block !text-sm !font-semibold !text-[#2f6ce0]">
                        {results.length} kết quả
                      </Text>

                      {results.length > 0 ? (
                        <Space direction="vertical" size={4} className="!w-full">
                          {results.map((item, index) => (
                            <div
                              key={
                                item?.ma_dk || item?.id || item?._id || item?.user?.iid || index
                              }
                              className="!cursor-pointer !rounded-lg !px-2 !py-1 hover:!bg-[#f2f7ff]"
                              onClick={() => {
                                setSelectedStudent(item);
                                setIsLyThuyetModalOpen(false);
                                setIsCabinModalOpen(false);
                                setIsDatModalOpen(false);

                                // Sync course dropdown to student's course
                                const studentCourseCode = item?.ma_khoa || item?.user?.course_code || "";
                                if (studentCourseCode) {
                                  const matchingCourse = sortedCourses.find(
                                    (c) =>
                                      String(c?.code).toUpperCase() === String(studentCourseCode).toUpperCase() ||
                                      String(c?.name).toUpperCase() === String(studentCourseCode).toUpperCase()
                                  );
                                  if (matchingCourse) {
                                    setSelectedKhoaHoc(matchingCourse.iid);
                                  }
                                }
                              }}
                            >
                              <Row>
                                <Col span={4} className="mr-2">
                                  <Image
                                    src={
                                      item?.anh ||
                                      item?.user?.avatar ||
                                      item?.user?.default_avatar ||
                                      ""
                                    }
                                    width={50}
                                    height={55}
                                    preview={false}
                                    className="!rounded-lg "
                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                                  />
                                </Col>
                                <Col span={19}>
                                  <Col span={24}>
                                    <Text strong className="!uppercase">
                                      {item?.ho_ten || item?.user?.name || "Không rõ tên"} (
                                      {item?.ngay_sinh ? dayjs(item.ngay_sinh).format("YYYY") : item?.user?.birth_year || "--"})
                                    </Text>
                                  </Col>
                                  <Col span={24}>
                                    <Text className="!text-xs !text-gray-500">
                                      <span>
                                        Khóa học: {item?.ten_khoa || item?.ma_khoa || ""}
                                      </span>
                                    </Text>
                                  </Col>
                                  <Col span={24}>
                                    <Text className="!text-xs !text-gray-500">
                                      <span>
                                        CCCD:{" "}
                                        {item?.cccd ||
                                          item?.user?.identification_card ||
                                          item?.user?.code ||
                                          ""}
                                      </span>
                                    </Text>
                                  </Col>
                                </Col>
                              </Row>
                            </div>
                          ))}
                        </Space>
                      ) : (
                        <Empty description="Không có dữ liệu" />
                      )}
                    </>
                  ) : (
                    <Empty description="Không có dữ liệu" />
                  )}
                </Spin>
              </Card>
            )}
            {hasResult ? (
              <Card
                className="!mt-4 !rounded-2xl !border-[#d9dee8]"
                bodyStyle={{ padding: 14 }}
              >
                <Flex justify="space-between" align="center" className="!mb-3">
                  <Text strong>Thông tin chi tiết</Text>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setSelectedStudent(null);
                      setIsCabinModalOpen(false);
                      setIsDatModalOpen(false);
                    }}
                    size="small"
                  >
                    Quay lại
                  </Button>
                </Flex>
                <Row gutter={12} wrap={false}>
                  <Col>
                    <Image
                      src={
                        selectedStudent?.anh ||
                        selectedStudent?.user?.avatar ||
                        selectedStudent?.user?.default_avatar ||
                        ""
                      }
                      alt={selectedStudent?.ho_ten || selectedStudent?.user?.name || "Hoc vien"}
                      preview={false}
                      width={120}
                      height={120}
                      className="!rounded-md !bg-[#2f5ebb] !object-cover"
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    />
                  </Col>
                  <Col flex="auto">
                    <Title
                      level={2}
                      className="!mb-0 !text-base !font-extrabold !uppercase !text-[#151b2d]"
                    >
                      {selectedStudent?.ho_ten || selectedStudent?.user?.name || "Không rõ tên"}
                    </Title>
                    <Text className="!mt-2 !block !text-sm !text-[#151b2d] !font-medium">
                      Lớp ·{" "}
                      {selectedKhoaHocLabel || selectedStudent?.ma_khoa || selectedStudent?.MaKhoaHoc || ""}
                    </Text>
                    <Text className="!mt-1 !block !text-sm !text-[#151b2d] !font-medium">
                      CCCD:{" "}
                      {selectedStudent?.cccd ||
                        selectedStudent?.user?.identification_card ||
                        selectedStudent?.user?.code ||
                        ""}
                    </Text>
                    {/* <Text className="!mt-1 !block !text-sm !text-[#151b2d] !font-medium">
                      Ngày tốt nghiệp:{" "}
                      {progressData?.tot_nghiep && dayjs(progressData.tot_nghiep).isValid()
                        ? dayjs(progressData.tot_nghiep).format("DD/MM/YYYY")
                        : "Chưa có lịch"}
                    </Text> */}
                  </Col>

                </Row>
                {(isLoggingIn || !data || data.ID === 0) && (
                  <div className="!text-[13px] !text-gray-500 !text-center !mt-3 !leading-tight">
                    Đang xử lý dữ liệu DAT, vui lòng chờ ít phút
                  </div>
                )}
                <Row gutter={8} className="!mt-3">
                  <Col span={8}>
                    <Card
                      bordered={false}
                      bodyStyle={{ padding: 10 }}
                      className="!rounded-xl !bg-[#edf1f7]"
                    >
                      <Text className="!text-xs !font-bold !uppercase !tracking-wide !text-[#74839e]">
                        Lý thuyết
                      </Text>
                      <Progress
                        percent={hasLyThuyetData ? lyThuyetPercent : 0}
                        showInfo={false}
                        strokeColor="#2f6ce0"
                        size={[110, 8]}
                        className="!mt-1"
                      />
                      <Flex
                        align="center"
                        justify="space-between"
                        className="!mt-2"
                      >
                        <Text
                          className="!text-xs !font-bold"
                          style={{ color: statusColor }}
                        >
                          {lyThuyetStatus}
                        </Text>
                        {!isEmptyLyThuyet && (
                          <Button
                            className="!rounded-xl !px-3 !text-xs"
                            size="small"
                            onClick={() => setIsLyThuyetModalOpen(true)}
                          >
                            Xem
                          </Button>
                        )}
                      </Flex>
                    </Card>
                  </Col>

                  {/* {isLyThuyetPassed ? (
                    <Col span={8}>
                      <Card
                        bordered={false}
                        bodyStyle={{ padding: 10 }}
                        className="!h-full !rounded-xl !bg-[#edf1f7]"
                      >
                        <Text className="!text-xs !font-bold !uppercase !tracking-wide !text-[#74839e]">
                          Cabin
                        </Text>
                        <Progress
                          percent={loadingCabin ? 0 : cabinProgressPercent}
                          showInfo={false}
                          strokeColor="#2f6ce0"
                          size={[110, 8]}
                          className="!mt-1"
                        />
                        <Flex
                          align="center"
                          justify="space-between"
                          className="!mt-2"
                        >
                          <Text
                            className={`!text-xs !font-bold ${isCabinFinalPassed
                              ? "!text-[#1b8a35]"
                              : "!text-[#dc2626]"
                              }`}
                          >
                            {cabinText}
                          </Text>
                          <Button
                            className="!rounded-xl !px-3 !text-xs"
                            size="small"
                            onClick={() => {
                              if (isLyThuyetPassed) {
                                setIsCabinModalOpen(true);
                              }
                            }}
                          >
                            Xem
                          </Button>
                        </Flex>
                      </Card>
                    </Col>
                  ) : null} */}
                  <Col span={8}>
                    <Card
                      bordered={false}
                      bodyStyle={{ padding: 10 }}
                      className="!h-full !rounded-xl !bg-[#edf1f7]"
                    >
                      <Text className="!text-xs !font-bold !uppercase !tracking-wide !text-[#74839e]">
                        Cabin
                      </Text>
                      <Progress
                        percent={loadingCabin ? 0 : cabinProgressPercent}
                        showInfo={false}
                        strokeColor="#2f6ce0"
                        size={[110, 8]}
                        className="!mt-1"
                      />
                      <Flex
                        align="center"
                        justify="space-between"
                        className="!mt-2"
                      >
                        <Text
                          className="!text-xs !font-bold"
                          style={{
                            color: isCabinFinalPassed
                              ? "#1b8a35"
                              : isCabinMaintenance
                                ? "#7e8ea6"
                                : "#dc2626"
                          }}
                        >
                          {cabinText}
                        </Text>
                        {!isCabinMaintenance && (
                          <Button
                            className="!rounded-xl !px-3 !text-xs"
                            size="small"
                            onClick={() => {
                              // if (isLyThuyetPassed) {
                              setIsCabinModalOpen(true);
                              // }
                            }}
                          >
                            Xem
                          </Button>
                        )}
                      </Flex>
                    </Card>
                  </Col>
                  {/* {isLyThuyetPassed && isCabinPassed ? (
                    <Col span={8}>
                      <Card
                        bordered={false}
                        bodyStyle={{ padding: 10 }}
                        className="!h-full !rounded-xl !bg-[#edf1f7]"
                      >
                        <Text className="!text-xs !font-bold !uppercase !tracking-wide !text-[#74839e]">
                          DAT
                        </Text>
                        <div
                          className={`!font-semibold text-[13px] flex justify-center ${trangThaiKyDAT
                            ? "!text-[#1b8a35]"
                            : "!text-[#ff0000]"
                            }`}
                        >
                          {trangThaiKyDAT ? "Đã ký" : "Chưa ký"}
                        </div>
                        <Button
                          type="primary"
                          className="!mt-2 !w-full !rounded-xl !bg-[#2f6ce0] !text-xs"
                          size="small"
                          onClick={() => {
                            if (isCabinPassed) {
                              setIsDatModalOpen(true);
                            }
                          }}
                        >
                          Chi tiết
                        </Button>
                      </Card>
                    </Col>
                  ) : null} */}
                  {/* {isCabinFinalPassed ? ( */}
                  <Col span={8}>
                    <Card
                      bordered={false}
                      bodyStyle={{ padding: 10 }}
                      className="!h-full !rounded-xl !bg-[#edf1f7]"
                    >
                      <Text className="!text-xs !font-bold !uppercase !tracking-wide !text-[#74839e]">
                        DAT
                      </Text>
                      <div
                        className={`!font-semibold text-[13px] flex justify-center ${trangThaiKyDAT
                          ? "!text-[#1b8a35]"
                          : "!text-[#ff0000]"
                          }`}
                      >
                        {trangThaiKyDAT ? "Đã ký" : "Chưa ký"}
                      </div>
                      <Button
                        type="primary"
                        className="!mt-2 !w-full !rounded-xl !bg-[#2f6ce0] !text-xs"
                        size="small"
                        onClick={() => {
                          setIsDatModalOpen(true);
                        }}
                        loading={isPublicLoggingIn || !isPublicAuthSuccess}
                      >
                        Chi tiết
                      </Button>
                    </Card>
                  </Col>
                  {/* // ) : null} */}
                </Row>
              </Card>
            ) : null}
          </Card>
        </Content>

        <Footer className="!bg-[#f2f4f8] !px-4 !pb-6 !pt-10 !text-center !text-xs !text-[#7e8ea6]">
          Public view • Cập nhật: 2026-02-27 16:08 • Nguồn nội bộ
        </Footer>
      </div>

      <LyThuyetScoreModal
        open={isLyThuyetModalOpen}
        onCancel={() => setIsLyThuyetModalOpen(false)}
        scoreRows={scoreRows}
        loadingStatus={loadingChiTietLyThuyet || loadingHocVienTheoKhoa}
        loaiHetMon={lyThuyetExtraStatus.loaiHetMon}
      />

      <ModalTest
        open={isDatModalOpen}
        onCancel={() => setIsDatModalOpen(false)}
        loading={loadingDat}
        student={selectedStudent}
        courseLabel={selectedKhoaHocLabel}
        studentCheckInfo={studentCheckInfo}
        rows={datJourneyList}
        bat_dau_dat={progressData?.bat_dau_dat}
        ket_thuc_dat={progressData?.ket_thuc_dat}
      />

      <CabinModal
        // open={isLyThuyetPassed && isCabinModalOpen}
        open={isCabinModalOpen}
        onCancel={() => setIsCabinModalOpen(false)}
        loading={loadingCabin}
        cabinGroupedByRule={cabinGroupedByRule}
      />
    </Layout>
  );
};

export default KiemTraPublic;
