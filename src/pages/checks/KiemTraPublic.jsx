import React, { useEffect, useMemo, useState } from "react";
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
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDuLieuCabin } from "../../apis/searchPublic";
import LyThuyetScoreModal from "./LyThuyetScoreModal";
import CabinModal from "./CabinModal";
import {
  DangNhapPublic,
  HanhTrinhPublic,
  hocVienKyDATPublic,
  hocVienTheoKhoaPublic,
  optionLopLyThuyetPublic,
} from "../../apis/apiDeploy";
import { fetchCheckStudentsPublic } from "../../apis/apiDeploy";
import { getChiTietHocVienLyThuyetPublic } from "../../apis/apiDeploy";
import ModalTest from "./ModalTest";
import "./index.css";
import { getChiTietHocVienLyThuyet } from "../../apis/apiHocVienLopLyThuyet";

const { Header, Footer, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const PUBLIC_CHECK_USERNAME = import.meta.env.VITE_PUBLIC_CHECK_USERNAME;
const PUBLIC_CHECK_PASSWORD = import.meta.env.VITE_PUBLIC_CHECK_PASSWORD;

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
    requiredMinutes: 10,
    passMinutes: 10,
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

const KiemTraPublic = () => {
  const [keyword, setKeyword] = useState("");
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");
  const [searchParams, setSearchParams] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLyThuyetModalOpen, setIsLyThuyetModalOpen] = useState(false);
  const [isCabinModalOpen, setIsCabinModalOpen] = useState(false);
  const [isDatModalOpen, setIsDatModalOpen] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["loginPublicCheck"],
    queryFn: async () => {
      const res = await DangNhapPublic({
        Username: PUBLIC_CHECK_USERNAME || "chienvx",
        Password: PUBLIC_CHECK_PASSWORD || "@chienvx",
      });
      return res?.data;
    },
    enabled: true,
  });

  useEffect(() => {
    console.log(data);

    for (let i = 0; i < 3; i++) {
      refetch();
    }
  }, [refetch, data]);

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
    return selectedCourse?.suffix_name || selectedCourse?.name || "";
  }, [selectedCourse]);

  const selectedKhoaHocCode = useMemo(() => {
    return selectedCourse?.code || selectedCourse?.name || "";
  }, [selectedCourse]);

  const {
    data: danhSachHocVien = {},
    isLoading: loadingStudents,
    refetch: refetchSearchHocVien,
  } = useQuery({
    queryKey: ["hocVienTheoKhoaPublic", selectedKhoaHoc, searchParams],
    queryFn: () => hocVienTheoKhoaPublic(selectedKhoaHoc, searchParams || {}),
    staleTime: 0,
    cacheTime: 0,
    retry: false,
    enabled: !!searchParams,
  });

  const cabinKey =
    selectedStudent?.user?.admission_code ||
    selectedStudent?.user?.code ||
    selectedStudent?.MaDK ||
    "";

  const {
    data: chiTietLyThuyetData,
    isLoading: loadingChiTietLyThuyet,
    refetch: refetchChiTietLyThuyet,
  } = useQuery({
    queryKey: ["chiTietHocVienLyThuyetPublic", cabinKey],
    // queryFn: () => getChiTietHocVienLyThuyetPublic(cabinKey),
    queryFn: () => getChiTietHocVienLyThuyet(cabinKey),
    staleTime: 0,
    retry: false,
    // enabled: !!searchParams,
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
    queryKey: ["hanhTrinhPublic", cabinKey, selectedKhoaHocCode],
    queryFn: () =>
      HanhTrinhPublic({
        ngaybatdau: "2020-01-01",
        ngayketthuc: "2026-12-31",
        ten: cabinKey,
        makhoahoc: selectedKhoaHocCode,
        limit: 20,
        page: 1,
      }),
    enabled: isDatModalOpen && !!cabinKey,
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
    const list = danhSachHocVien?.data;
    return Array.isArray(list) ? list : [];
  }, [danhSachHocVien]);

  const trangThaiKyDAT = useMemo(() => {
    const status = dataHocVienKyDat?.data?.trang_thai === "da_ky";
    return status;
  }, [dataHocVienKyDat]);

  const hasResult = !!selectedStudent;
  const hasSearched = !!searchParams;
  const scoreRows = useMemo(() => {
    const rawScores = selectedStudent?.learning_progress?.score_by_rubrik || [];

    return rawScores
      .filter(
        (item) =>
          !String(item?.name || "").includes("Bảng tổng hợp") &&
          !String(item?.name || "").includes("Điểm kiểm tra tổng hợp") &&
          !String(item?.name || "").includes("Tổng thời gian học"),
      )
      .map((item, index) => ({
        key: item?.iid || `${index}`,
        name: item?.name || "Không rõ",
        score: item?.score ?? 0,
        passed: Number(item?.passed) === 1,
      }));
  }, [selectedStudent]);

  const lyThuyetExtraStatus = useMemo(() => {
    const raw = chiTietLyThuyetData?.data;

    // if (!raw || Object.keys(raw).length === 0) {
    //   console.log("1");

    //   return {
    //     loaiHetMon: "Đã làm bài hết môn",
    //     loaiHetMonStatus: true,
    //   };
    // }

    const loaiHetMon = raw?.loai_het_mon;
    // const loaiLyThuyet = raw?.loai_ly_thuyet;

    return {
      loaiHetMon: loaiHetMon ? "Đã làm bài hết môn" : "Chưa làm bài hết môn",
      loaiHetMonStatus: loaiHetMon,
    };
  }, [chiTietLyThuyetData]);

  const handleSearch = () => {
    if (!selectedKhoaHoc) {
      message.warning("Vui lòng chọn khóa học trước.");
      return;
    }

    if (keyword.trim().length < 2) {
      message.warning("Vui lòng nhập từ khóa ít nhất 2 ký tự.");
      return;
    }

    setSelectedStudent(null);
    setIsLyThuyetModalOpen(false);
    setIsCabinModalOpen(false);
    setIsDatModalOpen(false);
    setSearchParams({
      page: 1,
      text: keyword.trim(),
    });
    refetchSearchHocVien();
    refetchChiTietLyThuyet();
  };

  const soMonLyThuyetDat = scoreRows.filter((item) => item.passed).length;
  const tongMonLyThuyet = scoreRows.length;
  const lyThuyetPercent =
    tongMonLyThuyet > 0
      ? Math.round((soMonLyThuyetDat / tongMonLyThuyet) * 100)
      : 0;

  const lyThuyetStatus =
    lyThuyetPercent >= 100 && lyThuyetExtraStatus?.loaiHetMonStatus
      ? "Đạt"
      : "Trượt";
  const statusColor =
    lyThuyetPercent >= 100 && lyThuyetExtraStatus?.loaiHetMonStatus
      ? "#1b8a35"
      : "#ff0000";
  const isLyThuyetPassed =
    lyThuyetPercent >= 100 && lyThuyetExtraStatus?.loaiHetMonStatus;

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

  const cabinText = useMemo(() => {
    if (loadingCabin) return "Đang tải dữ liệu CABIN...";
    if (cabinDataList.length === 0) return "Trượt";

    return isCabinPassed ? "Đạt" : "Trượt";
  }, [loadingCabin, cabinDataList.length, isCabinPassed]);

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
            <Row gutter={[8, 8]} align="bottom">
              <Col span={9}>
                <Text className="!mb-1 !block !text-xs !uppercase !text-gray-500">
                  Khóa học
                </Text>
                <Select
                  className="w-full"
                  placeholder="-- Chọn khóa học --"
                  loading={isLoadingKhoaHoc}
                  value={selectedKhoaHoc || undefined}
                  style={{ fontSize: 13 }}
                  onChange={(value) => {
                    setSelectedKhoaHoc(value || "");
                    setKeyword("");
                    setSearchParams(null);
                    setSelectedStudent(null);
                    setIsLyThuyetModalOpen(false);
                    setIsCabinModalOpen(false);
                    setIsDatModalOpen(false);
                  }}
                  options={khoaHocOptions}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Col>

              <Col span={9}>
                <Text className="!mb-1 !text-xs !uppercase !text-gray-500">
                  Từ khóa
                </Text>
                <Input
                  value={keyword}
                  disabled={!selectedKhoaHoc}
                  onChange={(e) => setKeyword(e.target.value)}
                  onPressEnter={handleSearch}
                  style={{ fontSize: 13 }}
                  placeholder={
                    selectedKhoaHoc
                      ? "Nhập họ tên hoặc CCCD"
                      : "Vui lòng chọn khóa học trước"
                  }
                />
              </Col>

              <Col span={6}>
                <Button
                  type="primary"
                  className="w-full"
                  onClick={handleSearch}
                  disabled={!selectedKhoaHoc || keyword.trim().length < 2}
                >
                  Tìm
                </Button>
              </Col>
            </Row>

            {!hasResult && (
              <Card
                className="!mt-4 !rounded-xl !border-[#d9dee8]"
                bodyStyle={{ padding: 12 }}
                loading={loadingStudents}
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
                              item?.id || item?._id || item?.user?.iid || index
                            }
                            className="!cursor-pointer !rounded-lg !px-2 !py-1 hover:!bg-[#f2f7ff]"
                            onClick={() => {
                              setSelectedStudent(item);
                              setIsLyThuyetModalOpen(false);
                              setIsCabinModalOpen(false);
                              setIsDatModalOpen(false);
                            }}
                          >
                            <Row>
                              <Col span={4} className="mr-2">
                                <Image
                                  src={
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
                                    {item?.user?.name || "Không rõ tên"} (
                                    {item?.user?.birth_year || "--"})
                                  </Text>
                                </Col>
                                <Col span={24}>
                                  <Text className="!text-xs !text-gray-500">
                                    <span>
                                      Mã HV: {item?.user?.admission_code || ""}
                                    </span>
                                  </Text>
                                </Col>
                                <Col span={24}>
                                  <Text className="!text-xs !text-gray-500">
                                    <span>
                                      CCCD:{" "}
                                      {item?.user?.identification_card ||
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
                        selectedStudent?.user?.avatar ||
                        selectedStudent?.user?.default_avatar ||
                        ""
                      }
                      alt={selectedStudent?.user?.name || "Hoc vien"}
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
                      {selectedStudent?.user?.name || "Không rõ tên"}
                    </Title>
                    <Text className="!mt-2 !block !text-sm !text-[#72809a]">
                      Lớp ·{" "}
                      {selectedKhoaHocLabel || selectedStudent?.MaKhoaHoc || ""}
                    </Text>
                    <Text className="!mt-1 !block !text-sm !font-bold !text-[#2b3243]">
                      CCCD:{" "}
                      {selectedStudent?.user?.identification_card ||
                        selectedStudent?.user?.code ||
                        ""}
                    </Text>
                  </Col>
                </Row>

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
                        percent={lyThuyetPercent}
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
                        <Button
                          className="!rounded-xl !px-3 !text-xs"
                          size="small"
                          onClick={() => setIsLyThuyetModalOpen(true)}
                        >
                          Xem
                        </Button>
                      </Flex>
                    </Card>
                  </Col>

                  {isLyThuyetPassed ? (
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
                            className={`!text-xs !font-bold ${
                              isCabinPassed
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
                  ) : null}

                  {isLyThuyetPassed && isCabinPassed ? (
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
                          className={`!font-semibold text-[13px] flex justify-center ${
                            trangThaiKyDAT
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
                  ) : null}
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
        loadingStatus={loadingChiTietLyThuyet}
        loaiHetMon={lyThuyetExtraStatus.loaiHetMon}
      />

      <ModalTest
        open={isCabinPassed && isDatModalOpen}
        onCancel={() => setIsDatModalOpen(false)}
        loading={loadingDat}
        student={selectedStudent}
        courseLabel={selectedKhoaHocLabel}
        studentCheckInfo={studentCheckInfo}
        rows={datJourneyList}
      />
      <CabinModal
        open={isLyThuyetPassed && isCabinModalOpen}
        onCancel={() => setIsCabinModalOpen(false)}
        loading={loadingCabin}
        cabinGroupedByRule={cabinGroupedByRule}
      />
    </Layout>
  );
};

export default KiemTraPublic;
