import React, { useMemo, useState } from "react";
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
import { lopHocLyThuyet } from "../../apis/khoaHoc";
import { hocVienTheoKhoa } from "../../apis/hocVien";
import { getDuLieuCabin } from "../../apis/searchPublic";
import CabinModal from "./CabinModal";
import { DangNhapLopLyThuyet } from "../../apis/auth";
import LyThuyetScoreModal from "./LyThuyetScoreModal";
import DatJourneyModal from "./DatJourneyModal";
import { DangNhapPublic, HanhTrinhPublic } from "../../apis/apiDeploy";

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

const KiemTraPublic = () => {
  const [keyword, setKeyword] = useState("");
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");
  const [searchParams, setSearchParams] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCabinModalOpen, setIsCabinModalOpen] = useState(false);
  const [isLyThuyetModalOpen, setIsLyThuyetModalOpen] = useState(false);
  const [isDatModalOpen, setIsDatModalOpen] = useState(false);

  useQuery({
    queryKey: ["loginPublicCheck"],
    queryFn: async () => {
      const res = await DangNhapPublic({
        Username: PUBLIC_CHECK_USERNAME || "chienvx",
        Password: PUBLIC_CHECK_PASSWORD || "@chienvx",
      });
      return res?.data;
    },
    staleTime: Infinity,
    retry: false,
  });

  const { data: loginData, isLoading: loadingLogin } = useQuery({
    queryKey: ["loginLyThuyet"],
    queryFn: () => DangNhapLopLyThuyet(),
    staleTime: Infinity,
    select: (data) => data?.result,
  });

  const { data: dataKhoaHoc, isLoading: loadingKhoaHoc } = useQuery({
    queryKey: ["lopHocLyThuyetPublic"],
    queryFn: () => lopHocLyThuyet(loginData),
    enabled: !!loginData,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const selectedCourse = useMemo(() => {
    const options = dataKhoaHoc?.result || [];
    return options.find(
      (item) => String(item?.iid) === String(selectedKhoaHoc),
    );
  }, [dataKhoaHoc, selectedKhoaHoc]);

  const selectedKhoaHocLabel = useMemo(() => {
    return selectedCourse?.suffix_name || selectedCourse?.name || "";
  }, [selectedCourse]);

  const selectedKhoaHocCode = useMemo(() => {
    return selectedCourse?.code || selectedCourse?.name || "";
  }, [selectedCourse]);

  const { data: danhSachHocVien = {}, isLoading: loadingStudents } = useQuery({
    queryKey: ["hocVienTheoKhoaPublic", selectedKhoaHoc, searchParams],
    queryFn: () => hocVienTheoKhoa(selectedKhoaHoc, searchParams || {}),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!selectedKhoaHoc && !!searchParams && !!loginData,
  });

  const cabinKey =
    selectedStudent?.user?.admission_code ||
    selectedStudent?.user?.code ||
    selectedStudent?.MaDK ||
    "";

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

  const cabinDataList = useMemo(() => {
    const list = dataCabin?.data || dataCabin?.Data || [];
    return Array.isArray(list) ? list : [];
  }, [dataCabin]);

  const datJourneyList = useMemo(() => {
    const list = dataDat?.data?.Data || dataDat?.data || [];
    return Array.isArray(list) ? list : [];
  }, [dataDat]);

  const cabinGroupedByRule = useMemo(() => {
    const groupedMap = CABIN_RULES.reduce((acc, rule) => {
      acc[rule.key] = {
        ...rule,
        learnedMinutes: 0,
      };
      return acc;
    }, {});

    cabinDataList.forEach((item) => {
      const rule = getCabinRuleByName(item?.Name || "");
      if (!rule) return;

      groupedMap[rule.key].learnedMinutes +=
        Number(item?.TongThoiGian || 0) / 60;
    });

    return CABIN_RULES.map((rule) => groupedMap[rule.key]);
  }, [cabinDataList]);

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

  const khoaHocOptions = useMemo(() => {
    const options = dataKhoaHoc?.result || [];
    return options.map((kh) => ({
      label:
        kh?.suffix_name || kh?.name
          ? `${kh?.suffix_name || kh?.name}`
          : kh?.code || "Không có tên",
      value: kh?.iid || "",
    }));
  }, [dataKhoaHoc]);

  const results = useMemo(() => {
    const list = danhSachHocVien?.result;
    return Array.isArray(list) ? list : [];
  }, [danhSachHocVien]);

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

  const handleSearch = () => {
    if (!selectedKhoaHoc) {
      message.warning("Vui lòng chọn khóa học trước.");
      return;
    }

    if (keyword.trim().length < 2) {
      message.warning("Vui lòng nhập từ khóa ít nhất 2 ký tự.");
      return;
    }
    if (!loginData) {
      message.warning("Đang đăng nhập hệ thống lý thuyết, vui lòng thử lại.");
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
  };

  const handleClear = () => {
    setKeyword("");
    setSelectedKhoaHoc("");
    setSearchParams(null);
    setSelectedStudent(null);
    setIsLyThuyetModalOpen(false);
    setIsCabinModalOpen(false);
    setIsDatModalOpen(false);
  };

  const soMonLyThuyetDat = scoreRows.filter((item) => item.passed).length;
  const tongMonLyThuyet = scoreRows.length;
  const lyThuyetPercent =
    tongMonLyThuyet > 0
      ? Math.round((soMonLyThuyetDat / tongMonLyThuyet) * 100)
      : 0;

  const lyThuyetStatus = lyThuyetPercent >= 100 ? "Đạt" : "Chưa đạt";

  const cabinText = useMemo(() => {
    if (loadingCabin) return "Đang tải dữ liệu CABIN...";

    if (cabinDataList.length > 0) {
      const completedLessons = Math.min(uniqueCabinLessonCount, 8);
      return `${completedLessons}/8 bài`;
    }

    if (selectedStudent?.CABIN?.soBaiHoc || selectedStudent?.CABIN?.thoiLuong) {
      return `Bài: ${selectedStudent?.CABIN?.soBaiHoc || 0} • Phút: ${selectedStudent?.CABIN?.thoiLuong || 0}`;
    }

    return "Chưa có dữ liệu CABIN";
  }, [cabinDataList, loadingCabin, selectedStudent, uniqueCabinLessonCount]);

  const cabinTextClassName =
    cabinDataList.length > 0
      ? "!mb-0 !mt-3 !text-xs !text-[#16a34a]"
      : "!mb-0 !mt-3 !text-xs !text-[#ff2c2c]";

  return (
    <Layout className="!min-h-screen !bg-[#f2f4f8]">
      <div className="mx-auto w-full max-w-[430px] bg-[#f2f4f8]">
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
              <Col span={8}>
                <Text className="!mb-1 !block !text-xs !uppercase !text-gray-500">
                  Khóa học
                </Text>
                <Select
                  className="w-full"
                  placeholder="-- Chọn khóa học --"
                  loading={loadingKhoaHoc || loadingLogin}
                  value={selectedKhoaHoc || undefined}
                  onChange={(value) => {
                    setSelectedKhoaHoc(value || "");
                    setKeyword("");
                    setSearchParams(null);
                    setSelectedStudent(null);
                    setIsLyThuyetModalOpen(false);
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

              <Col span={8}>
                <Text className="!mb-1 !text-xs !uppercase !text-gray-500">
                  Từ khóa
                </Text>
                <Input
                  value={keyword}
                  disabled={!selectedKhoaHoc}
                  onChange={(e) => setKeyword(e.target.value)}
                  onPressEnter={handleSearch}
                  placeholder={
                    selectedKhoaHoc
                      ? "Nhập họ tên hoặc CCCD"
                      : "Vui lòng chọn khóa học trước"
                  }
                />
              </Col>

              <Col span={6}>
                <Space className="!w-full" size={8}>
                  <Button
                    type="primary"
                    onClick={handleSearch}
                    disabled={
                      !selectedKhoaHoc ||
                      keyword.trim().length < 2 ||
                      loadingLogin
                    }
                  >
                    Tìm
                  </Button>
                  <Button onClick={handleClear}>Xóa</Button>
                </Space>
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
                              setIsDatModalOpen(false);
                            }}
                          >
                            <Row>
                              <Col span={4}>
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
                              <Col span={20}>
                                <Col span={24}>
                                  <Text strong className="!uppercase">
                                    {item?.user?.name || "Không rõ tên"} (
                                    {item?.user?.birth_year || "--"})
                                  </Text>
                                </Col>
                                <Col span={24}>
                                  <Text className="!text-xs !text-gray-500">
                                    <span>
                                      Mã học viên:{" "}
                                      {item?.user?.admission_code || ""}
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
                        <Text className="!text-xs !font-bold !text-[#1b8a35]">
                          {lyThuyetStatus}
                        </Text>
                        <Button
                          className="!rounded-xl !px-3 !text-sm"
                          size="small"
                          onClick={() => setIsLyThuyetModalOpen(true)}
                        >
                          Xem
                        </Button>
                      </Flex>
                    </Card>
                  </Col>

                  <Col span={8}>
                    <Card
                      bordered={false}
                      bodyStyle={{ padding: 10 }}
                      className="!h-full !cursor-pointer !rounded-xl !bg-[#edf1f7]"
                      onClick={() => setIsCabinModalOpen(true)}
                    >
                      <Text className="!text-xs !font-bold !uppercase !tracking-wide !text-[#74839e]">
                        Cabin
                      </Text>
                      <Paragraph className={cabinTextClassName}>
                        {cabinText}
                      </Paragraph>
                    </Card>
                  </Col>

                  <Col span={8}>
                    <Card
                      bordered={false}
                      bodyStyle={{ padding: 10 }}
                      className="!h-full !rounded-xl !bg-[#edf1f7]"
                    >
                      <Text className="!text-xs !font-bold !uppercase !tracking-wide !text-[#74839e]">
                        DAT
                      </Text>
                      <Button
                        type="primary"
                        className="!mt-6 !w-full !rounded-xl !bg-[#2f6ce0] !text-sm"
                        size="small"
                        onClick={() => setIsDatModalOpen(true)}
                      >
                        Chi tiết
                      </Button>
                    </Card>
                  </Col>
                </Row>
              </Card>
            ) : null}
          </Card>
        </Content>

        <CabinModal
          open={isCabinModalOpen}
          onCancel={() => setIsCabinModalOpen(false)}
          loading={loadingCabin}
          cabinGroupedByRule={cabinGroupedByRule}
        />

        <Footer className="!bg-[#f2f4f8] !px-4 !pb-6 !pt-10 !text-center !text-xs !text-[#7e8ea6]">
          Public view • Cập nhật: 2026-02-27 16:08 • Nguồn nội bộ
        </Footer>
      </div>

      <LyThuyetScoreModal
        open={isLyThuyetModalOpen}
        onCancel={() => setIsLyThuyetModalOpen(false)}
        scoreRows={scoreRows}
      />

      <DatJourneyModal
        open={isDatModalOpen}
        onCancel={() => setIsDatModalOpen(false)}
        loading={loadingDat}
        student={selectedStudent}
        courseLabel={selectedKhoaHocLabel}
        rows={datJourneyList}
      />
    </Layout>
  );
};

export default KiemTraPublic;
