import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Input,
  Image,
  Drawer,
  Empty,
  Spin,
  Typography,
  message,
  Col,
  Button,
  Row,
} from "antd";
import { DanhSachHocVien, DanhSachKhoaHoc, HanhTrinh } from "../apis/hocVien";
import StudentDetail from "./StudentDetail";
import { exportReport } from "../apis/report";
import dayjs from "dayjs";

const { Title } = Typography;

export default function SearchStudents() {
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const debounceTimer = useRef(null);

  const { data: results = {}, isLoading } = useQuery({
    queryKey: ["danhSachHocVien", searchParams],
    queryFn: () => DanhSachHocVien(searchParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: Object.keys(searchParams).length > 0,
  });

  const { data: resultsCourse = {} } = useQuery({
    queryKey: ["danhSachKhoaHoc"],
    queryFn: () => DanhSachKhoaHoc(),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: Object.keys(searchParams).length > 0,
  });

  const dataSource = useMemo(() => {
    const students = Array.isArray(results?.data?.Data)
      ? results.data.Data
      : [];

    const courses = Array.isArray(resultsCourse?.data?.Data)
      ? resultsCourse.data.Data
      : [];

    return students.map((student) => {
      const course = courses.find(
        (c) => String(c.ID) === String(student.IDKhoaHoc),
      );

      return {
        ...student,
        TenKhoaHoc: course?.Ten || "",
      };
    });
  }, [results, resultsCourse]);

  const handleSearchChange = useCallback((value) => {
    setSearchText(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        setSearchParams({
          soCmt: value.trim(),
          page: 1,
          limit: 20,
        });
      } else if (value.trim().length === 0) {
        setSearchParams({});
      }
    }, 500);
  }, []);

  const handleView = (record) => {
    setSelectedRecord(record);
    setOpenedDrawer(true);
  };

  const getDrawerProps = () => {
    let config = {
      title: "học viên",
      content: null,
    };

    if (selectedRecord) {
      config = {
        title: "Thông tin chi tiết học viên",
        content: (
          <div className="bg-gray-50">
            <StudentDetail data={selectedRecord} />
          </div>
        ),
      };
    }
    return config;
  };

  const drawerProps = getDrawerProps();

  const handleCloseForm = () => {
    setOpenedDrawer(false);
    setSelectedRecord(null);
  };

  const handleReport = async () => {
    try {
      const resp = await exportReport(selectedRecord?.MaDK);

      const blob = resp?.data || resp;
      if (!blob) throw new Error("No file returned");

      const cd =
        resp?.headers?.["content-disposition"] ||
        resp?.headers?.["Content-Disposition"];
      let filename = "report.pdf";
      if (cd) {
        const m = cd.match(
          /filename\*=UTF-8''([^;\n\r]+)|filename="?([^";\n\r]+)"?/,
        );
        if (m) filename = decodeURIComponent(m[1] || m[2]);
      }

      const blobUrl = URL.createObjectURL(blob);

      // Try open in new tab; if blocked, trigger download
      const newWin = window.open(blobUrl, "_blank");
      if (!newWin) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch (err) {
      console.error("Export report failed", err);
      message.error("Không thể xuất báo cáo");
    }
  };

  // Render card list item
  const renderStudentCard = (student) => (
    <div
      key={student.MaDK}
      className="flex items-start gap-4 px-4 py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition cursor-pointer"
      onClick={() => handleView(student)}
    >
      <div className="flex-shrink-0">
        <Image
          src={student.srcAvatar}
          alt={student.HoTen}
          width={45}
          height={45}
          className="!rounded-lg"
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-gray-900">
            {student.HoTen}
          </h3>
          {student.HangDaoTao && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {student.HangDaoTao}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          <span>Mã: {student.MaDK}</span>
          {student.TenKhoaHoc && (
            <>
              <span className="mx-2">·</span>
              <span>Khóa: {student.TenKhoaHoc}</span>
            </>
          )}
          {student.NgaySinh && (
            <>
              <span className="mx-2">·</span>
              <span>NS: {dayjs(student.NgaySinh).format("YYYY-MM-DD")}</span>
            </>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleView(student);
          }}
          className="px-3 bg-white text-gray-800 border border-gray-300 rounded-full hover:bg-gray-50 transition font-medium text-sm cursor-pointer"
        >
          Chọn
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <Card className="!shadow-md">
        <div className="space-y-4">
          <Title level={3} className="!mb-3">
            Tìm kiếm học viên
          </Title>
          <div>
            <label className="text-[13px] text-gray-600 block mb-1">
              Từ khóa (tên / số CMT) (gõ để tìm nhanh)
            </label>
            <Row gutter={16}>
              <Col span={20}>
                <Input
                  placeholder="Nhập tối thiểu 2 ký tự..."
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  size="large"
                  className="!text-sm"
                />
              </Col>
              <Col span={4} className="pl-4 flex items-center">
                <Button
                  type="primary"
                  onClick={handleSearchChange}
                  className="!font-medium !py-4.5 !rounded-md"
                >
                  Tìm kiếm
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </Card>

      {Object.keys(searchParams).length > 0 && (
        <Card
          style={{ marginTop: 16 }}
          bodyStyle={{ padding: 0 }}
          className="!max-h-[60vh] !shadow-md overflow-y-auto"
        >
          <div className="mb-3 text-sm text-blue-600 font-medium px-3 py-2">
            {dataSource.length} kết quả
          </div>

          <Spin spinning={isLoading}>
            {dataSource.length > 0 ? (
              <div className="border-white rounded-lg overflow-hidden">
                {dataSource.map((student) => renderStudentCard(student))}
              </div>
            ) : (
              <Empty description="Không có dữ liệu" />
            )}
          </Spin>
        </Card>
      )}

      <Drawer
        title={drawerProps.title}
        onClose={handleCloseForm}
        open={openedDrawer}
        width={1280}
        maskClosable={false}
        extra={
          <div>
            <Button
              type="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleReport();
              }}
              className="!font-medium"
            >
              Báo cáo
            </Button>
          </div>
        }
      >
        {openedDrawer && drawerProps.content}
      </Drawer>
    </div>
  );
}
