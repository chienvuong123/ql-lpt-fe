import { useState, useEffect, useRef, useMemo } from "react";
import { Button, Card, Progress, Spin, Row, Col, Table, Flex } from "antd";
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
import dayjs from "dayjs";

// ─── Helper ─────────────────────────────────────────────────────────────────

const formatCoordinates = (listCoordinate = []) =>
  listCoordinate.map((point) => ({
    latitude: point.Latitude,
    longitude: point.Longitude,
    speed: point.VanToc,
    timestamp: point.ThoiGian,
    totalKm: point.TotalKm,
    driverName: point.HoTen,
    direction: point.Huong,
  }));

const findRouteForRecord = (allRoutes, record, fallbackIndex) => {
  if (!allRoutes?.length) return null;

  // Match đến phút
  const recordTime = record?.ThoiDiemDangNhap?.slice(0, 16);
  const matched = allRoutes.find(
    (route) => route?.StartTime?.slice(0, 16) === recordTime,
  );
  if (matched) return matched;

  // Fallback: match đến giờ
  const recordHour = record?.ThoiDiemDangNhap?.slice(0, 13);
  const hourMatched = allRoutes.find(
    (route) => route?.StartTime?.slice(0, 13) === recordHour,
  );
  if (hourMatched) return hourMatched;

  // Fallback cuối: theo index
  return allRoutes[fallbackIndex] ?? allRoutes[0];
};

// ─── Component ───────────────────────────────────────────────────────────────

const TrackingPage = ({ duLieuPhienHoc, summaryData }) => {
  const [trackingData, setTrackingData] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState(null);

  const timerRef = useRef(null);
  const hasFetched = useRef(false);

  // ── 1. Gọi API MỘT LẦN duy nhất khi mount ───────────────────────────────
  useEffect(() => {
    if (hasFetched.current || !duLieuPhienHoc.length) return;
    hasFetched.current = true;

    const fetchAllRoutes = async () => {
      try {
        setLoading(true);

        const firstRecord = duLieuPhienHoc[0];
        const lastRecord = duLieuPhienHoc[duLieuPhienHoc.length - 1];

        const startDateStr = firstRecord.ThoiDiemDangNhap.split("T")[0];
        const endDateStr =
          lastRecord.ThoiDiemDangXuat?.split("T")[0] ??
          lastRecord.ThoiDiemDangNhap?.split("T")[0];

        const response = await LoTringOnline({
          ngaybatdau: `${startDateStr}T00:00:00`,
          ngayketthuc: `${endDateStr}T23:59:00`,
          madk: firstRecord.MaDK,
        });

        const data = response.data;
        const routes = Array.isArray(data) ? data : [data];
        setAllRoutes(routes);

        // Hiển thị phiên đầu tiên mặc định
        const firstRoute = findRouteForRecord(routes, firstRecord, 0);
        if (firstRoute?.ListCoordinate?.length > 0) {
          setTrackingData(formatCoordinates(firstRoute.ListCoordinate));
        }
        setSelectedRowKey(firstRecord.ID ?? firstRecord.MaDK);
      } catch (err) {
        console.error("Lỗi tải lộ trình:", err);
        hasFetched.current = false;
      } finally {
        setLoading(false);
      }
    };

    fetchAllRoutes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCurrentIndex(0);
  }, [trackingData]);

  // ── 2. Click vào phiên → lấy từ allRoutes, KHÔNG gọi API ─────────────────
  const handleSelect = (record, rowIndex) => {
    const rowKey = record.ID ?? record.MaDK;
    if (rowKey === selectedRowKey) return;

    setIsPlaying(false);
    clearInterval(timerRef.current);
    // setCurrentIndex(0);
    setSelectedRowKey(rowKey);

    const route = findRouteForRecord(allRoutes, record, rowIndex);

    if (route?.ListCoordinate?.length > 0) {
      setTrackingData(formatCoordinates(route.ListCoordinate));
    } else {
      setTrackingData([]);
    }
  };

  // ── 3. Playback ───────────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(timerRef.current);

    if (isPlaying && currentIndex < trackingData.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev < trackingData.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 500);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, trackingData.length, currentIndex]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  // ── 4. Computed values ────────────────────────────────────────────────────
  const progressPercent =
    trackingData.length > 0
      ? ((currentIndex + 1) / trackingData.length) * 100
      : 0;

  const currentPoint = trackingData[currentIndex] ?? null;

  // ── 5. Columns ────────────────────────────────────────────────────────────
  const teacherColumns = useMemo(
    () => [
      {
        title: "#",
        width: 40,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "Biển số xe",
        dataIndex: "BienSo",
        width: 110,
        align: "center",
      },
      {
        title: "Bắt đầu",
        dataIndex: "ThoiDiemDangNhap",
        width: 140,
        render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Kết thúc",
        dataIndex: "ThoiDiemDangXuat",
        width: 140,
        render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Số Km",
        dataIndex: "TongQD",
        width: 90,
      },
    ],
    [],
  );

  // ── 6. Render ─────────────────────────────────────────────────────────────
  return (
    <Spin spinning={loading} tip="Đang tải dữ liệu hành trình...">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
            Lộ trình theo học viên
          </h1>
          <p className="text-[#64748b] text-sm">
            Quãng đường di chuyển của xe trong các phiên học viên đã tham gia.
          </p>
        </div>

        {/* Thông tin học viên */}
        <Row gutter={[12, 12]} className="mb-3">
          <Col span={24}>
            <Card>
              <h1 className="text-xl !font-bold text-gray-900 !mb-3">
                Thông tin học viên
              </h1>
              <Flex justify="space-between" align="center" className="!px-2">
                <Flex vertical>
                  <h2 className="text-lg !font-semibold text-blue-700 !mb-0 flex items-center gap-1">
                    <UserOutlined />
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
            </Card>
          </Col>
        </Row>

        {/* Map + Bảng phiên */}
        <Row gutter={[12, 12]}>
          {/* Map */}
          <Col xs={24} md={12}>
            <Card className="shadow-md" bordered={false}>
              <Row className="!items-center !mb-2">
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
                    onClick={() => setIsPlaying((v) => !v)}
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

              <Row gutter={[12, 0]} className="!mt-2">
                <Col span={22}>
                  <Progress
                    percent={progressPercent}
                    showInfo={false}
                    strokeColor={{ "0%": "#1890ff", "100%": "#52c41a" }}
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

          {/* Bảng phiên học */}
          <Col xs={24} md={12}>
            <Card className="shadow-md" bordered={false}>
              <h2 className="text-lg !font-bold text-gray-900 !mb-0">
                Thông tin phiên học
              </h2>
              <p className="text-[#64748b] text-sm">
                Thông tin từng phiên học viên đã tham gia.
              </p>
              <Table
                columns={teacherColumns}
                dataSource={duLieuPhienHoc}
                pagination={{ pageSize: 10 }}
                size="small"
                bordered
                rowKey={(record) => record.ID ?? record.MaDK}
                sticky
                className="h-119"
                onRow={(record, rowIndex) => ({
                  onClick: () => handleSelect(record, rowIndex),
                  style: { cursor: "pointer" },
                })}
                rowClassName={(record) => {
                  const key = record.ID ?? record.MaDK;
                  return key === selectedRowKey
                    ? "!bg-blue-100 transition-colors"
                    : "hover:bg-gray-50 transition-colors";
                }}
                locale={{
                  emptyText: (
                    <span className="text-xs font-medium">
                      Chưa có dữ liệu phiên học
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
