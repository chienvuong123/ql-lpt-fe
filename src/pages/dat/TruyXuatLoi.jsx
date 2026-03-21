import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Input,
  Image,
  Empty,
  Spin,
  Typography,
  message,
  Col,
  Button,
  Row,
  Select,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { DanhSachHocVien, HanhTrinh } from "../../apis/hocVien";
import dayjs from "dayjs";
import { courseOptions } from "../../apis/khoaHoc";
import { fetchCheckStudents } from "../../apis/kiemTra";
import TruyVetModal from "./TruyVetModal";

const { Title } = Typography;

export default function TruyXuatLoi() {
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useState({});
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDatModalOpen, setIsDatModalOpen] = useState(false);

  const { data: results = {}, isLoading } = useQuery({
    queryKey: ["danhSachHocVien", searchParams],
    queryFn: () => DanhSachHocVien(searchParams),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: Object.keys(searchParams).length > 0,
  });

  const { data: dataKhoaHoc, isLoading: loadingKhoaHoc } = useQuery({
    queryKey: ["khoahocOptions"],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const selectedCourseLabel = useMemo(() => {
    const list = dataKhoaHoc?.data?.Data || [];
    const found = list.find(
      (item) => String(item?.ID) === String(selectedKhoaHoc || ""),
    );
    return found?.Ten || found?.MaKhoaHoc || selectedStudent?.TenKhoaHoc || "";
  }, [dataKhoaHoc, selectedKhoaHoc, selectedStudent]);

  const dataSource = useMemo(() => {
    const students = Array.isArray(results?.data?.Data)
      ? results.data.Data
      : [];

    const courses = Array.isArray(dataKhoaHoc?.data?.Data)
      ? dataKhoaHoc.data.Data
      : [];

    return students.map((student) => {
      const course = courses.find(
        (c) => String(c.ID) === String(student.IDKhoaHoc),
      );

      return {
        ...student,
        TenKhoaHoc: course?.Ten || "",
        MaKhoaHoc: course?.MaKhoaHoc || "",
        IDKhoaHoc: course?.ID || "",
      };
    });
  }, [results, dataKhoaHoc]);

  const khoaHocOptions = useMemo(() => {
    const options = dataKhoaHoc?.data?.Data || [];
    return [
      { label: "Tất cả khóa học", value: "" },
      ...options.map((kh) => ({
        label: kh.Ten || kh.MaKhoaHoc || "Khong co ten",
        value: kh.ID || "",
      })),
    ];
  }, [dataKhoaHoc]);

  const { data: dataDat, isLoading: loadingDat } = useQuery({
    queryKey: [
      "hanhTrinhTruyXuatLoi",
      selectedStudent?.MaDK,
      selectedStudent?.MaKhoaHoc,
    ],
    queryFn: () =>
      HanhTrinh({
        ngaybatdau: "2020-01-01",
        ngayketthuc: "2026-12-31",
        ten: selectedStudent?.MaDK,
        makhoahoc: selectedStudent?.MaKhoaHoc,
        limit: 20,
        page: 1,
      }),
    enabled:
      isDatModalOpen && !!selectedStudent?.MaDK && !!selectedStudent?.MaKhoaHoc,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: dataCheckStudents = {} } = useQuery({
    queryKey: ["checkStudentTruyXuatLoi"],
    queryFn: () => fetchCheckStudents(),
    enabled: isDatModalOpen && !!selectedStudent?.MaDK,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const datJourneyRows = useMemo(() => {
    const list = dataDat?.data?.Data || dataDat?.data || [];
    return Array.isArray(list) ? list : [];
  }, [dataDat]);

  const studentCheckInfo = useMemo(() => {
    const list = dataCheckStudents?.data || [];
    if (!Array.isArray(list) || !selectedStudent?.MaDK) return null;
    const code = String(selectedStudent.MaDK).trim();
    return (
      list.find((item) => String(item?.maDangKy || "").trim() === code) || null
    );
  }, [dataCheckStudents, selectedStudent]);

  const handleSearch = () => {
    const params = {};

    if (searchText.trim().length >= 2) {
      params.soCmt = searchText.trim();
    }

    if (selectedKhoaHoc) {
      params.idkhoahoc = selectedKhoaHoc;
    }

    if (Object.keys(params).length === 0) {
      message.warning("Vui lòng nhập từ khóa để tìm kiếm");
      return;
    }

    setSearchParams({ ...params, page: 1, limit: 20 });
  };

  const openStudentDatModal = (student) => {
    setSelectedStudent(student);
    setIsDatModalOpen(true);
  };

  const renderStudentCard = (student) => (
    <div
      key={student.MaDK}
      className="flex items-start gap-4 px-4 py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition cursor-pointer"
      onClick={() => openStudentDatModal(student)}
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

      <div className="flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openStudentDatModal(student);
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
      <Title level={3} className="!mb-1">
        Truy vết lỗi DAT của học viên
      </Title>
      <Card className="!mt-5">
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={12} md={10}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Khóa học
            </label>
            <Select
              className="w-full"
              placeholder="-- Chọn khóa học --"
              loading={loadingKhoaHoc}
              value={selectedKhoaHoc}
              onChange={(value) => setSelectedKhoaHoc(value)}
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
          <Col span={11}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Từ khóa
            </label>
            <Input
              placeholder="Nhập tối thiểu 2 từ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              className="!text-sm"
              onPressEnter={handleSearch}
            />
          </Col>
          <Col span={3} className="pl-4 flex items-center">
            <Button
              type="primary"
              className="w-full !font-medium !py-4.5 !rounded-md !bg-[#3366CC] "
              onClick={handleSearch}
              icon={<SearchOutlined />}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            >
              Tìm kiếm
            </Button>
          </Col>
        </Row>
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
              <Empty description="Khong co du lieu" />
            )}
          </Spin>
        </Card>
      )}

      <TruyVetModal
        open={isDatModalOpen}
        onCancel={() => setIsDatModalOpen(false)}
        loading={loadingDat}
        student={
          selectedStudent
            ? {
                user: {
                  name: selectedStudent?.HoTen,
                  admission_code: selectedStudent?.MaDK,
                  birth_year: selectedStudent?.NgaySinh
                    ? dayjs(selectedStudent?.NgaySinh).year()
                    : null,
                  avatar: selectedStudent?.srcAvatar || "",
                  default_avatar: selectedStudent?.srcAvatar || "",
                },
              }
            : null
        }
        courseLabel={selectedStudent?.TenKhoaHoc || selectedCourseLabel}
        studentCheckInfo={studentCheckInfo}
        rows={datJourneyRows}
      />
    </div>
  );
}
