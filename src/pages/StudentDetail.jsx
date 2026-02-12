import {
  Card,
  Row,
  Col,
  Checkbox,
  Input,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Divider,
  Flex,
  Spin,
  Image,
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { HanhTrinh } from "../apis/hocVien";
import { useNavigate } from "react-router-dom";

const { TextArea } = Input;
const { Title, Text } = Typography;

const StudentDetail = ({ data }) => {
  const [dateTime, setDateTime] = useState("");

  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ["hanhTrinh", data?.MaDK],
    queryFn: () =>
      HanhTrinh({
        ngaybatdau: "2020-01-01",
        ngayketthuc: "2026-12-31",
        ten: data?.MaDK,
        makhoahoc: data?.TenKhoaHoc,
        limit: 20,
        page: 1,
      }),
    staleTime: Infinity, // Vì là dữ liệu tĩnh dùng chung, để Infinity để không bao giờ call lại
    enabled: !!data?.MaDK, // Chỉ chạy khác học viên
  });

  const dataSource = useMemo(() => {
    return Array.isArray(results?.data?.Data) ? results.data.Data : [];
  }, [results]);

  const renderValue = (value, suffix = "") => {
    if (value === null || value === undefined || value === "") {
      return <Text style={{ display: "block", textAlign: "center" }}>-</Text>;
    }
    return <Text>{`${value}${suffix}`}</Text>;
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
      align: "center",
      width: 60,
      fixed: "left",
      responsive: ["sm"],
      render: (_text, _record, index) => index + 1,
    },
    {
      title: "Tên học viên",
      dataIndex: "HoTen",
      key: "HoTen",
      width: 150,
      ellipsis: true,
      fixed: "left",
      render: (text) => renderValue(text),
    },
    {
      title: "Tên giáo viên",
      dataIndex: "HoTenGV",
      key: "HoTenGV",
      width: 160,
      ellipsis: true,
      render: (text) => renderValue(text),
    },
    {
      title: "Ảnh",
      dataIndex: "SrcdnAvatar",
      key: "SrcdnAvatar",
      width: 100,
      ellipsis: true,
      render: (url) => <Image src={url} width={60} height={50} preview />,
    },
    {
      title: "Đăng nhập",
      dataIndex: "DangNhap",
      key: "DangNhap",
      width: 100,
      ellipsis: true,
      render: (text) => renderValue(text),
    },
    {
      title: "Đăng xuất",
      dataIndex: "DangXuat",
      key: "DangXuat",
      width: 100,
      ellipsis: true,
      render: (text) => renderValue(text),
    },
    {
      title: "Phiên đào tạo",
      dataIndex: "MaKhoaHoc",
      key: "MaKhoaHoc",
      width: 120,
      ellipsis: true,
      render: (text) => renderValue(text),
    },
    {
      title: "Biển số",
      dataIndex: "BienSo",
      key: "BienSo",
      width: 80,
      responsive: ["md"],
      render: (text) => renderValue(text),
    },
    {
      title: "Tỉ lệ nhận diện",
      dataIndex: "Tile",
      key: "Tile",
      width: 120,
      align: "center",
      responsive: ["lg"],
      render: (text) => <Text>{Math.floor(text * 10) / 10}%</Text>,
    },
    {
      title: "Hạng đào tạo",
      dataIndex: "HangDaoTao",
      key: "HangDaoTao",
      width: 110,
      align: "center",
      responsive: ["md"],
      render: (text) => renderValue(text),
    },
    {
      title: "Ngày đào tạo",
      dataIndex: "ThoiDiemDangNhap",
      key: "ThoiDiemDangNhap",
      width: 110,
      render: (text) => <Text>{dayjs(text).format("DD/MM/YYYY") || "-"}</Text>,
    },
    {
      title: "Thời lượng",
      dataIndex: "TongTG",
      key: "TongTG",
      width: 100,
      align: "center",
      render: (text) => <Text>{text}h</Text>,
    },
    {
      title: "Quãng đường",
      dataIndex: "TongQD",
      key: "TongQD",
      width: 110,
      align: "right",
      responsive: ["md"],
      render: (text) => renderValue(text),
    },
    {
      title: "Tốc độ TB",
      key: "avgSpeed",
      width: 100,
      align: "center",
      responsive: ["xl"],
      render: (_, record) => {
        const distance = Number(record.TongQuangDuong);
        const time = Number(record.TongTG);

        if (!distance || !time) return <Text>--</Text>;

        return <Text>{(distance / time).toFixed(1)} km/h</Text>;
      },
    },
    // {
    //   title: "Kết luận",
    //   dataIndex: "result",
    //   key: "result",
    //   width: 100,
    //   align: "center",
    //   render: (text) => (
    //     <Tag color={text === "Đạt" ? "success" : "error"}>{text}</Tag>
    //   ),
    // },
  ];

  const hasJourneyData = dataSource.length > 0;

  // Cấu hình yêu cầu theo hạng đào tạo (dựa vào bảng)
  const HANG_DAO_TAO_CONFIG = {
    B1: {
      thoiGian: { banNgay: 9, banDem: 3, tuDong: 0, tong: 12 },
      quangDuong: { banNgay: 590, banDem: 120, tuDong: 0, tong: 710 },
    },
    B11: {
      hoiGian: { banNgay: 9, banDem: 3, tuDong: 0, tong: 12 },
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

  // Tính toán tổng hợp từ dataSource
  const summaryData = useMemo(() => {
    if (!hasJourneyData) {
      return {
        tongThoiGianGio: 0,
        tongQuangDuong: 0,
        thoiGianBanDemGio: 0,
        quangDuongBanDem: 0,
        thoiGianBanNgayGio: 0,
        quangDuongBanNgay: 0,
        thoiGianTuDongGio: 0,
        quangDuongTuDong: 0,
        hangDaoTao: data?.HangDaoTao || "",
      };
    }

    // Lấy thông tin ban đêm

    // Đếm số lần xuất hiện của mỗi biển số
    const bienSoCount = dataSource.reduce((acc, item) => {
      const bienSo = item.BienSo;
      if (bienSo) {
        acc[bienSo] = (acc[bienSo] || 0) + 1;
      }
      return acc;
    }, {});

    // Tìm biển số xuất hiện ít nhất (là xe số tự động)
    let bienSoTuDong = null;
    let minCount = Infinity;

    // Lấy danh sách các biển số
    const danhSachBienSo = Object.entries(bienSoCount);

    // Chỉ tìm xe tự động nếu có ít nhất 2 biển số khác nhau
    if (danhSachBienSo.length > 1) {
      danhSachBienSo.forEach(([bienSo, count]) => {
        if (count < minCount) {
          minCount = count;
          bienSoTuDong = bienSo;
        }
      });
    }

    // Tính tổng từ tất cả các phiên
    const totals = dataSource.reduce(
      (acc, item) => {
        const isTuDong = bienSoTuDong && item.BienSo === bienSoTuDong;

        const thoiGianPhut = item.TongThoiGian || 0;
        const quangDuong = item.TongQuangDuong || item.TongQD || 0;

        // Xác định phiên này có phải ban đêm không
        const thoiDiem = item.ThoiDiemDangNhap;
        let isBanDem = false;

        acc.tongThoiGianPhut += item.TongThoiGian || 0;
        acc.tongQuangDuong += item.TongQuangDuong || item.TongQD || 0;
        acc.thoiGianBanDemPhut += item.ThoiGianBanDem || 0;
        acc.quangDuongBanDem += item.QuangDuongBanDem || 0;
        acc.thoiGianTuDongPhut += item.ThoiGianTuDong || 0; // Cần field này từ API
        acc.quangDuongTuDong += item.QuangDuongTuDong || 0; // Cần field này từ API

        // Nếu là xe tự động thì cộng vào tự động
        if (isTuDong) {
          acc.thoiGianTuDongPhut += item.TongThoiGian || 0;
          acc.quangDuongTuDong += item.TongQuangDuong || item.TongQD || 0;
        }

        if (thoiDiem) {
          const hour = new Date(thoiDiem).getHours();
          isBanDem = hour >= 18; // từ 18:00 trở đi
        }

        // Phân loại ban đêm / ban ngày / tự động
        if (isBanDem) {
          acc.thoiGianBanDemPhut += thoiGianPhut;
          acc.quangDuongBanDem += quangDuong;
        } else {
          acc.thoiGianBanNgayPhut += thoiGianPhut;
          acc.quangDuongBanNgay += quangDuong;
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

    // Lấy hạng đào tạo từ phiên đầu tiên hoặc từ data
    const hangDaoTao = dataSource[0]?.HangDaoTao || data?.HangDaoTao || "";

    return {
      tongThoiGianGio,
      tongQuangDuong: totals.tongQuangDuong,
      thoiGianBanDemGio,
      quangDuongBanDem: totals.quangDuongBanDem,
      thoiGianBanNgayGio,
      quangDuongBanNgay,
      thoiGianTuDongGio,
      quangDuongTuDong: totals.quangDuongTuDong,
      hangDaoTao,
    };
  }, [dataSource, hasJourneyData, data]);

  // Logic đánh giá
  const evaluationData = useMemo(() => {
    if (!hasJourneyData) {
      return { status: "fail", errors: [], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    const yeuCauHang =
      HANG_DAO_TAO_CONFIG[summaryData.hangDaoTao] || HANG_DAO_TAO_CONFIG.B1;

    // Cấu hình các điều kiện kiểm tra
    const validationRules = [
      // ERRORS - Điều kiện 1: Thời gian ban đêm
      {
        type: "error",
        condition: summaryData.thoiGianBanDemGio < yeuCauHang.thoiGian.banDem,
        getMessage: () => {
          const thieuGio =
            yeuCauHang.thoiGian.banDem - summaryData.thoiGianBanDemGio;
          const gio = Math.floor(thieuGio);
          const phut = Math.round((thieuGio - gio) * 60);
          return `Thời gian ban đêm thiếu so với yêu cầu tối thiểu (${gio}h ${phut.toString().padStart(2, "0")}').`;
        },
      },

      // ERRORS - Điều kiện 2: Quãng đường ban đêm
      {
        type: "error",
        condition: summaryData.quangDuongBanDem < yeuCauHang.quangDuong.banDem,
        getMessage: () => {
          const thieu =
            yeuCauHang.quangDuong.banDem - summaryData.quangDuongBanDem;
          return `Quãng đường ban đêm thiếu so với yêu cầu tối thiểu (${thieu.toFixed(2)} km).`;
        },
      },

      // ERRORS - Điều kiện 3: Thời gian số tự động
      {
        type: "error",
        condition: summaryData.thoiGianTuDongGio < yeuCauHang.thoiGian.tuDong,
        getMessage: () => {
          const thieuGio =
            yeuCauHang.thoiGian.tuDong - summaryData.thoiGianTuDongGio;
          const gio = Math.floor(thieuGio);
          const phut = Math.round((thieuGio - gio) * 60);
          return `Thời gian lái xe số tự động thiếu so với yêu cầu tối thiểu (${gio}h ${phut.toString().padStart(2, "0")}').`;
        },
      },

      // ERRORS - Điều kiện 3: Quãng đường số tự động
      {
        type: "error",
        condition: summaryData.quangDuongTuDong < yeuCauHang.quangDuong.tuDong,
        getMessage: () => {
          const thieu =
            yeuCauHang.quangDuong.tuDong - summaryData.quangDuongTuDong;
          return `Quãng đường lái xe số tự động thiếu so với yêu cầu tối thiểu (${thieu.toFixed(2)} km).`;
        },
      },

      // ERRORS - Điều kiện 4: Tổng thời lượng
      {
        type: "error",
        condition: summaryData.tongThoiGianGio < yeuCauHang.thoiGian.tong,
        getMessage: () => {
          const thieu = yeuCauHang.thoiGian.tong - summaryData.tongThoiGianGio;
          const gio = Math.floor(thieu);
          const phut = Math.round((thieu - gio) * 60);
          return `Tổng thời lượng thiếu so với yêu cầu (thiếu ${gio}h ${phut.toString().padStart(2, "0")}').`;
        },
      },

      // ERRORS - Điều kiện 5: Tổng quãng đường
      {
        type: "error",
        condition: summaryData.tongQuangDuong < yeuCauHang.quangDuong.tong,
        getMessage: () => {
          const thieu = yeuCauHang.quangDuong.tong - summaryData.tongQuangDuong;
          return `Tổng quãng đường thiếu so với yêu cầu (thiếu ${thieu.toFixed(2)} km).`;
        },
      },

      // WARNINGS - Không có tên giáo viên
      {
        type: "warning",
        condition: !dataSource.some((item) => item.HoTenGV),
        getMessage: () => "Không có tên giáo viên để kiểm tra tính nhất quán.",
      },

      // WARNINGS - Thời gian ban ngày thiếu quá 20%
      {
        type: "warning",
        condition: (() => {
          const yeuCau = yeuCauHang.thoiGian.banNgay;
          if (yeuCau === 0) return false;
          const thucTe = summaryData.thoiGianBanNgayGio;
          const phanTramDat = (thucTe / yeuCau) * 100;
          return phanTramDat < 80;
        })(),
        getMessage: () => {
          const yeuCau = yeuCauHang.thoiGian.banNgay;
          const thucTe = summaryData.thoiGianBanNgayGio;
          const phanTramDat = (thucTe / yeuCau) * 100;
          const phanTramThieu = 100 - phanTramDat;

          const thieuGio = yeuCau - thucTe;
          const gio = Math.floor(thieuGio);
          const phut = Math.round((thieuGio - gio) * 60);

          return `Thời gian ban ngày thiếu ${phanTramThieu.toFixed(1)}% so với yêu cầu (thiếu ${gio}h ${phut.toString().padStart(2, "0")}').`;
        },
      },

      // WARNINGS - Quãng đường ban ngày thiếu quá 20%
      {
        type: "warning",
        condition: (() => {
          const yeuCau = yeuCauHang.quangDuong.banNgay;
          if (yeuCau === 0) return false;
          const thucTe = summaryData.quangDuongBanNgay;
          const phanTramDat = (thucTe / yeuCau) * 100;
          return phanTramDat < 80;
        })(),
        getMessage: () => {
          const yeuCau = yeuCauHang.quangDuong.banNgay;
          const thucTe = summaryData.quangDuongBanNgay;
          const phanTramDat = (thucTe / yeuCau) * 100;
          const phanTramThieu = 100 - phanTramDat;
          const thieu = yeuCau - thucTe;

          return `Quãng đường ban ngày thiếu ${phanTramThieu.toFixed(1)}% so với yêu cầu (thiếu ${thieu.toFixed(2)} km).`;
        },
      },
    ];

    // Lặp qua các rules và tạo errors/warnings
    validationRules.forEach((rule) => {
      if (rule.condition) {
        const issue = {
          type: rule.type,
          message: rule.getMessage(),
        };

        if (rule.type === "error") {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    });

    const status = errors.length === 0 ? "pass" : "fail";

    return { status, errors, warnings };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, hasJourneyData, summaryData]);

  const allIssues = [...evaluationData.warnings, ...evaluationData.errors];

  const isPass = evaluationData.status === "pass";

  const getBanNgayTime = (tongThoiGian = 0, thoiGianBanDem = 0) => {
    const banNgayPhut = Math.max(tongThoiGian - thoiGianBanDem, 0);
    const gio = Math.floor(banNgayPhut / 60);
    const phut = banNgayPhut % 60;
    return `${gio}h${phut}`;
  };

  const formatThoiGian = (phut) => {
    const totalMinutes = Math.floor(Number(phut));
    const gio = Math.floor(totalMinutes / 60);
    const phutDu = totalMinutes % 60;

    return `${gio}h${phutDu.toString().padStart(2, "0")}`;
  };

  const handleDAT = () => {
    const dateTime = dayjs().format("DD/MM/YYYY HH:mm:ss");
    setDateTime(dateTime);
  };

  const handleGoMap = () => {
    console.log(summaryData);

    navigate("/map", {
      state: {
        duLieuPhienHoc: dataSource,
        summaryData: data,
      },
    });
  };

  return (
    <Spin spinning={isLoading}>
      <div className="student-detail-container">
        <Card className="info-card" bordered={false}>
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Title level={4}>Thông tin học viên</Title>
            </Col>
            <Col xs={24} sm={8} md={6} lg={3}>
              <div style={{ textAlign: "center" }}>
                <img
                  src={data.srcAvatar}
                  alt="Student Avatar"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "8px",
                  }}
                />
              </div>
            </Col>

            <Col xs={24} sm={16} md={12} lg={12}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Tên học viên:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>{data.HoTen}</Text>
                  </Col>
                </Row>

                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Mã học viên:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong copyable>
                      {data.MaDK}
                    </Text>
                  </Col>
                </Row>
                {dataSource.length > 0 && (
                  <Row gutter={[8, 8]}>
                    <Col span={5}>
                      <Text>GV DAT:</Text>
                    </Col>
                    <Col span={16}>
                      <Text strong>{dataSource[0]?.HoTenGV}</Text>
                    </Col>
                  </Row>
                )}

                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Ngày sinh:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>
                      {" "}
                      {data?.NgaySinh
                        ? dayjs(data.NgaySinh).format("DD/MM/YYYY")
                        : ""}
                    </Text>
                  </Col>
                </Row>

                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Mã khóa học:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>{data.TenKhoaHoc}</Text>
                  </Col>
                </Row>

                <Row gutter={[8, 8]}>
                  <Col span={5}>
                    <Text>Hạng đào tạo:</Text>
                  </Col>
                  <Col span={16}>
                    <Tag color="blue">{data.HangDaoTao}</Tag>
                  </Col>
                </Row>
              </Space>
            </Col>

            <Col xs={24} md={6} lg={8}>
              <Card
                size="small"
                className="confirmation-box"
                style={{ background: "#fafafa", marginTop: "-14px" }}
              >
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <Text strong>Ký Xác Nhận DAT</Text>
                    <Checkbox onClick={handleDAT}>
                      <Text type="success">Học viên đã ký</Text>
                    </Checkbox>
                  </div>

                  <div>
                    <Text>Ghi chú nội bộ</Text>
                    <TextArea
                      rows={2}
                      placeholder="Ghi chú nội bộ (chỉ Admin thấy) ..."
                      style={{ marginTop: "4px" }}
                    />
                  </div>

                  <div>
                    <Text>Ghi chú công khai</Text>
                    <TextArea
                      rows={2}
                      placeholder="Ghi chú công khai (có thể hiển thị cho các bên khác) ..."
                      style={{ marginTop: "4px" }}
                    />
                  </div>
                  <Text style={{ fontSize: "11px" }}>
                    Cập nhật cuối: {dateTime} (GMT+7)
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card
          className="training-card"
          bordered={false}
          style={{ marginTop: 16 }}
        >
          <Title level={4}>Thông tin quá trình đào tạo</Title>
          <Row gutter={[12, 12]}>
            <Col span={24} className=" pl-20">
              <Space wrap style={{ marginBottom: 16 }}>
                <Checkbox checked>Ban ngày</Checkbox>
                <Checkbox checked>Ban đêm</Checkbox>
                <Checkbox checked>Trải nghiệm số tự động</Checkbox>
                <Checkbox checked>Nhận diện &lt;75%</Checkbox>
              </Space>
            </Col>
            <Col span={24}>
              <Flex justify="space-between">
                <Space>
                  <Text strong>DỮ LIỆU HỌC CABIN:</Text>

                  {data?.CABIN ? (
                    <>
                      <Text>
                        {data.CABIN.thoiLuong} - {data.CABIN.soBaiHoc} bài học -
                      </Text>
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Đạt
                      </Tag>
                    </>
                  ) : (
                    <Tag color="error" className="font-medium">
                      Chưa có dữ liệu Cabin
                    </Tag>
                  )}
                </Space>
                {dataSource.length > 0 && (
                  <div className="mt-4">
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => handleGoMap()}
                    >
                      Giám sát hành trình
                    </Button>
                  </div>
                )}
              </Flex>
            </Col>
            <Col span={24}>
              <Table
                columns={columns}
                dataSource={dataSource || []}
                pagination={false}
                size="middle"
                scroll={{ x: 1200 }}
                locale={{
                  emptyText:
                    "Không có phiên đào tạo nào trong khoảng thời gian đã chọn.",
                }}
              />
            </Col>
          </Row>
          {dataSource.length > 0 && (
            <div>
              <Row gutter={[12, 12]}>
                <Title level={4}>Tổng hợp</Title>
                <Col span={24} className="pl-20">
                  <Text>
                    Tổng thời lượng: <Text strong>{data?.TongTGFont}'</Text> ·
                    Tổng quãng đường:{" "}
                    <Text strong>{data?.TongQD || 0.0} km</Text>
                  </Text>
                </Col>
              </Row>
              <Row gutter={[12, 12]}>
                <Col span={24}>
                  <Card
                    style={{
                      marginTop: 16,
                      borderColor: isPass ? "#52c41a" : "#ff4d4f",
                      backgroundColor: isPass ? "#f6ffed" : "#fff2f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size="middle"
                      style={{ width: "100%" }}
                    >
                      {/* Header */}
                      <Space>
                        <Text strong style={{ fontSize: 16 }}>
                          Kết quả đánh giá:
                        </Text>
                        <Tag
                          color={isPass ? "success" : "error"}
                          icon={
                            isPass ? (
                              <CheckCircleOutlined />
                            ) : (
                              <CloseCircleOutlined />
                            )
                          }
                          style={{ fontSize: 14 }}
                        >
                          {isPass ? "Đạt" : "Chưa đạt"}
                        </Tag>
                      </Space>

                      {/* Issues List */}
                      {allIssues.length > 0 && (
                        <div>
                          <Text strong>Lý do:</Text>
                          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                            {allIssues.map((issue, index) => (
                              <li
                                key={index}
                                style={{
                                  color:
                                    issue.type === "error"
                                      ? "#990000"
                                      : "#CC9966",
                                  marginBottom: 8,
                                }}
                              >
                                {issue.type === "warning" ? (
                                  <WarningOutlined
                                    style={{ color: "#CC9966", marginRight: 4 }}
                                  />
                                ) : (
                                  <CloseCircleOutlined
                                    style={{ marginRight: 4 }}
                                  />
                                )}
                                <span className="font-medium text-[#CC9966]">
                                  {issue.type === "warning" && "Cảnh báo: "}
                                </span>
                                <span className="font-medium ">
                                  {issue.message}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Divider style={{ margin: "12px 0" }} />

                      {/* Summary */}
                      <Space direction="vertical" size={4}>
                        <Text className="text-[#888888] font-medium">
                          Ban ngày:{" "}
                          {getBanNgayTime(
                            data?.TongThoiGian,
                            data?.ThoiGianBanDem,
                          )}
                          ' -{" "}
                          {(data?.TongQD - data?.QuangDuongBanDem).toFixed(2)}{" "}
                          km
                        </Text>
                        <Text className="text-[#888888] font-medium">
                          Ban đêm:{" "}
                          {formatThoiGian(summaryData.thoiGianBanDemGio)}' -{" "}
                          {summaryData?.quangDuongBanDem.toFixed(2)} km
                        </Text>
                        {dataSource[0]?.HangDaoTao !== "B1" ||
                        dataSource[0]?.HangDaoTao !== "B11" ? (
                          <Text className="text-[#888888] font-medium">
                            Trải nghiệm hộp số tự động (17h-7h):{" "}
                            {formatThoiGian(summaryData.thoiGianTuDongGio)}' -{" "}
                            {summaryData.quangDuongTuDong.toFixed(2)} km
                          </Text>
                        ) : null}
                      </Space>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Card>
      </div>
    </Spin>
  );
};

export default StudentDetail;
