import { useState, useEffect, useRef, useMemo } from "react";
import {
  Button,
  Card,
  Progress,
  Spin,
  Row,
  Col,
  Table,
  Flex,
  Typography,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  UserOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { LoTringOnline } from "../../apis/xeOnline";
import TrackingMap from ".";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";

const { Text } = Typography;

const TrackingPage = () => {
  const [trackingData, setTrackingData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState(null);

  const location = useLocation();

  const { duLieuPhienHoc = [], summaryData } = location.state || {};

  const timerRef = useRef(null);
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    setSelectedRowKey(duLieuPhienHoc[0]?.ID || null);
    if (hasCalledAPI.current) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        hasCalledAPI.current = true;

        const firstRecord = duLieuPhienHoc && duLieuPhienHoc[0];

        const datePart = firstRecord.ThoiDiemDangNhap.split("T")[0];

        const startDate = new Date(datePart);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);

        const ngaybatdau = `${datePart}T00:00:00`;
        const ngayketthuc = `${endDate.toISOString().split("T")[0]}T23:59:00`;

        // Gọi API
        const response = await LoTringOnline({
          ngaybatdau: ngaybatdau,
          ngayketthuc: ngayketthuc,
          madk: duLieuPhienHoc[0]?.MaDK,
        });

        const data = response.data;

        const routeData = Array.isArray(data) ? data[0] : data;

        if (routeData?.ListCoordinate && routeData.ListCoordinate.length > 0) {
          const formatted = routeData.ListCoordinate.map((point) => ({
            latitude: point.Latitude,
            longitude: point.Longitude,
            speed: point.VanToc,
            timestamp: point.ThoiGian,
            totalKm: point.TotalKm,
            driverName: point.HoTen,
            direction: point.Huong,
          }));

          setTrackingData(formatted);
        }
      } catch (err) {
        console.error(err);
        hasCalledAPI.current = false;
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Logic Tự động phát (Playback)
  useEffect(() => {
    if (isPlaying && currentIndex < trackingData.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev < trackingData.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, trackingData.length, currentIndex]);

  // Reset hành trình
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const progressPercent =
    trackingData.length > 0
      ? ((currentIndex + 1) / trackingData.length) * 100
      : 0;

  const currentPoint =
    trackingData.length > 0 ? trackingData[currentIndex] : null;

  const teacherColumns = useMemo(
    () => [
      {
        title: "Biển số xe",
        dataIndex: "BienSo",
        width: 120,
      },
      {
        title: "Bắt đầu",
        dataIndex: "ThoiDiemDangNhap",
        width: 120,
        render: (text) => dayjs(text).format("DD/MM/YYYY"),
      },
      {
        title: "Kết thúc",
        dataIndex: "ThoiDiemDangXuat",
        key: "ThoiDiemDangXuat",
        width: 140,
        render: (text) => dayjs(text).format("DD/MM/YYYY"),
      },
      {
        title: "Số Km",
        dataIndex: "TongQD",
        width: 90,
      },
    ],
    [],
  );

  const handleSelect = async (record) => {
    setSelectedRowKey(record.ID);
    try {
      setLoading(true);
      setIsPlaying(false);
      setCurrentIndex(0);

      const datePart = record?.ThoiDiemDangNhap?.split("T")[0];
      const startDate = new Date(datePart);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);

      const ngaybatdau = `${datePart}T00:00:00`;
      const ngayketthuc = `${endDate.toISOString().split("T")[0]}T23:59:00`;

      const response = await LoTringOnline({
        ngaybatdau: ngaybatdau,
        ngayketthuc: ngayketthuc,
        madk: record?.MaDK,
      });

      const data = response.data;
      const routeData = Array.isArray(data) ? data[0] : data;

      if (routeData?.ListCoordinate && routeData.ListCoordinate.length > 0) {
        const formatted = routeData.ListCoordinate.map((point) => ({
          latitude: point.Latitude,
          longitude: point.Longitude,
          speed: point.VanToc,
          timestamp: point.ThoiGian,
          totalKm: point.TotalKm,
          driverName: point.HoTen,
          direction: point.Huong,
        }));

        setTrackingData(formatted);
      } else {
        setTrackingData([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading} tip="Đang tải dữ liệu hành trình...">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-6xl mx-auto mb-6">
          <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
            Lộ trình theo học viên
          </h1>
          <p className="text-[#64748b] text-sm">
            Quãng đường di chuyển của xe trong các phiên học viên đã tham gia.
          </p>
          <div className=" pt-4">
            <a href="/" className="text-blue-500 text-sm hover:text-blue-700">
              ← Quay lại Dashboard
            </a>
          </div>
        </div>
        <Row gutter={[12, 12]} className="mb-3">
          <Col span={24}>
            <Card>
              <Row>
                <h1 className="text-xl !font-bold text-gray-900 !mb-1">
                  Thông tin học viên
                </h1>
                <Col span={24}>
                  <Flex
                    justify="space-between"
                    align="center"
                    className="!px-2"
                  >
                    <Flex vertical>
                      <h2 className="text-lg !font-semibold text-blue-700 !mb-0 flex items-center">
                        <UserOutlined className="mr-1" />
                        {summaryData?.HoTen || "N/A"}
                      </h2>
                    </Flex>

                    <Flex gap="middle" align="center">
                      <Flex
                        align="center"
                        className="bg-orange-50 !px-10 !py-1 rounded-full border border-orange-100"
                      >
                        <IdcardOutlined className="text-orange-500 mr-2" />
                        <span className="text-sm font-semibold">
                          Hạng: {summaryData?.HangDaoTao}
                        </span>
                      </Flex>

                      <Flex
                        align="center"
                        className="bg-blue-50 !px-10 !py-1 rounded-full border border-blue-100"
                      >
                        <ClockCircleOutlined className="text-blue-500 mr-2" />
                        <span className="text-sm font-semibold">
                          Tổng TG: {summaryData?.TongTGFont}'
                        </span>
                      </Flex>

                      <Flex
                        align="center"
                        className="bg-green-50 !px-10 !py-1 rounded-full border border-green-100"
                      >
                        <DashboardOutlined className="text-green-500 mr-2" />
                        <span className="text-sm font-semibold">
                          Tổng QD: {summaryData?.TongQD}km
                        </span>
                      </Flex>
                    </Flex>
                  </Flex>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Card className="shadow-md" bordered={false}>
              <Row className="!items-center">
                <Col span={12}>
                  <h2 className="text-lg !font-bold text-gray-900 !mb-0">
                    Lộ trình xe
                  </h2>
                  <p className="text-[#64748b] text-sm">
                    Hành trình di chuyển của xe.
                  </p>
                </Col>
                <Col span={12} className="!space-x-2 !flex !justify-end">
                  <Button
                    type="primary"
                    size="small"
                    icon={
                      isPlaying ? (
                        <PauseCircleOutlined />
                      ) : (
                        <PlayCircleOutlined />
                      )
                    }
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={trackingData.length === 0}
                  >
                    {isPlaying ? "Dừng" : "Phát"}
                  </Button>

                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                    disabled={trackingData.length === 0}
                  />
                </Col>
              </Row>
              <TrackingMap
                trackingData={trackingData}
                currentPoint={currentPoint}
                currentIndex={currentIndex}
              />
              <Row gutter={[12, 0]}>
                <Col span={22}>
                  <Progress
                    percent={progressPercent}
                    showInfo={false}
                    strokeColor={{
                      "0%": "#1890ff",
                      "100%": "#52c41a",
                    }}
                  />
                </Col>
                <Col span={2}>
                  <span className="text-xs text-gray-500 font-medium">
                    {progressPercent.toFixed(1)}%
                  </span>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={12} className="space-y-4 ">
            <Card className="shadow-md" bordered={false}>
              <h2 className="text-lg !font-bold text-gray-900 !mb-0">
                Thông tin phiên học
              </h2>
              <p className="text-[#64748b] text-sm">
                Thông tin từng phiên học viên đã tham gia.
              </p>
              <Table
                columns={teacherColumns}
                dataSource={duLieuPhienHoc || []}
                pagination={{ pageSize: 10 }}
                size="small"
                bordered
                rowKey="MaGV"
                sticky={true}
                className="h-115.5"
                onRow={(record) => ({
                  onClick: () => handleSelect(record),
                  style: { cursor: "pointer" },
                })}
                rowClassName={(record) =>
                  record.ID === selectedRowKey
                    ? "bg-blue-200 transition-colors"
                    : "hover:bg-gray-50 transition-colors"
                }
                locale={{
                  emptyText: (
                    <span className="text-xs font-medium">
                      Chưa có thông tin giáo viên
                    </span>
                  ),
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default TrackingPage;
