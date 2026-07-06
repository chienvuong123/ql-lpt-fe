import { useState, useMemo, useEffect } from "react";
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
  Select,
  Switch,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { searchStudent, DanhSachHocVien } from "../apis/hocVien";
import StudentDetail from "./StudentDetail";
import { exportReport } from "../apis/report";
import dayjs from "dayjs";
import { courseOptions } from "../apis/khoaHoc";
import { DangNhap } from "../apis/auth";

const { Title } = Typography;

const getCourseStartDate = (course) => {
  const rawValue =
    course?.start_date ??
    course?.StartDate ??
    course?.NgayKhaiGiang ??
    course?.ngay_khai_giang ??
    course?.NgayBatDau ??
    course?.ngay_bat_dau;

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const numericValue = Number(rawValue);
  if (Number.isFinite(numericValue) && String(rawValue).trim() !== "") {
    const unixDate = dayjs.unix(numericValue);
    if (unixDate.isValid()) return unixDate;
  }

  const parsedDate = dayjs(rawValue);
  return parsedDate.isValid() ? parsedDate : null;
};

export default function SearchStudents() {
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");

  const [accountType, setAccountType] = useState("old");
  const useNewAccount = useMemo(() => accountType === "new", [accountType]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [tokenReadyFor, setTokenReadyFor] = useState(null);

  useEffect(() => {
    let active = true;
    const performLogin = async () => {
      setIsLoggingIn(true);
      setTokenReadyFor(null);
      try {
        const username = useNewAccount
          ? import.meta.env.VITE_USERNAME_NEW || "dltx_lpt_31011"
          : import.meta.env.VITE_PUBLIC_CHECK_USERNAME || "chienvx";
        const password = useNewAccount
          ? import.meta.env.VITE_PASSWORD_NEW || "@tcdbvn"
          : import.meta.env.VITE_PUBLIC_CHECK_PASSWORD || "@chienvx";

        const res = await DangNhap({
          Username: username,
          Password: password,
        });

        if (active) {
          if (res?.data?.ID !== 0 && res?.data?.Token) {
            sessionStorage.setItem("token", res.data.Token);
            setTokenReadyFor(useNewAccount ? "new" : "old");
          } else {
            throw new Error(res?.data?.Name || "Đăng nhập DAT thất bại");
          }
        }
      } catch (err) {
        if (active) {
          message.error(err.message || "Đăng nhập thất bại");
        }
      } finally {
        if (active) {
          setIsLoggingIn(false);
        }
      }
    };

    performLogin();

    return () => {
      active = false;
    };
  }, [useNewAccount]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["danhSachHocVien", searchParams, useNewAccount],
    queryFn: () => {
      if (useNewAccount) {
        const apiParams = {
          page: 1,
          limit: 100,
        };
        if (searchParams.search) {
          apiParams.soCmt = searchParams.search;
        }
        const courseObj = (dataKhoaHoc?.data?.Data || []).find(
          (kh) => String(kh.MaKhoaHoc || "") === String(searchParams.ma_khoa || "")
        );
        if (courseObj?.ID) {
          apiParams.idkhoahoc = courseObj.ID;
        }
        return DanhSachHocVien(apiParams);
      } else {
        const apiParams = {};
        if (searchParams.search) {
          apiParams.search = searchParams.search;
        }
        if (searchParams.ma_khoa) {
          apiParams.ma_khoa = searchParams.ma_khoa;
        }
        return searchStudent(apiParams);
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: Object.keys(searchParams).length > 0 && !isLoggingIn && tokenReadyFor === accountType,
  });

  const { data: dataKhoaHoc, isLoading: loadingKhoaHoc } = useQuery({
    queryKey: ["khoahocOptions", useNewAccount],
    queryFn: () => courseOptions(),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: false,
    enabled: !isLoggingIn && tokenReadyFor === accountType,
  });

  const dataSource = useMemo(() => {
    let students = [];
    if (useNewAccount) {
      students = Array.isArray(results?.data?.Data)
        ? results.data.Data
        : Array.isArray(results?.data)
          ? results.data
          : Array.isArray(results)
            ? results
            : [];
    } else {
      students = Array.isArray(results)
        ? results
        : Array.isArray(results?.data)
          ? results.data
          : [];
    }

    const currentYear = dayjs().format("YY");

    const getYear = (str) => {
      const match = str?.match(/K(\d+)/i);
      return match ? match[1] : null;
    };

    const courses = dataKhoaHoc?.data?.Data || [];

    return students
      .map((student) => {
        const courseId = student.IDKhoaHoc || student.idkhoahoc || student.id_khoa_hoc || student.idKhoaHoc;
        const studentCourseCode = student.MaKhoaHoc || student.ma_khoa;

        const course = courses.find((c) => {
          const matchId = courseId && (String(c.ID) === String(courseId) || String(c.id) === String(courseId));
          const matchCode = studentCourseCode && (
            String(c.MaKhoaHoc || c.ma_khoa || c.maKhoaHoc || "").toUpperCase() === String(studentCourseCode).toUpperCase()
          );
          return matchId || matchCode;
        });

        const tenKhoaHoc = student.TenKhoaHoc || student.ten_khoa || course?.Ten || course?.ten || course?.TenKhoaHoc || course?.ten_khoa || "";

        return {
          ...student,
          MaDK: student.MaDK || student.ma_dk,
          HoTen: student.HoTen || student.ho_ten,
          TenKhoaHoc: tenKhoaHoc,
          NgaySinh: student.NgaySinh || student.ngay_sinh,
          srcAvatar: student.srcAvatar || student.anh,
          HangDaoTao: student.HangDaoTao || student.hang_gplx || student.hang || "",
          ma_khoa: course?.MaKhoaHoc || course?.ma_khoa || student.MaKhoaHoc || student.ma_khoa || "",
        };
      })
      .sort((a, b) => {
        const yearA = getYear(a.TenKhoaHoc || a.ma_khoa);
        const yearB = getYear(b.TenKhoaHoc || b.ma_khoa);

        // Prioritize current year (e.g., K26)
        const isCurrentA = yearA === currentYear;
        const isCurrentB = yearB === currentYear;

        if (isCurrentA && !isCurrentB) return -1;
        if (!isCurrentA && isCurrentB) return 1;

        // Then sort by year descending
        if (yearA && yearB && yearA !== yearB) {
          return parseInt(yearB, 10) - parseInt(yearA, 10);
        }

        // Final fallback: alphabetical by course name
        return (a.TenKhoaHoc || "").localeCompare(b.TenKhoaHoc || "");
      });
  }, [results, useNewAccount]);

  const khoaHocOptions = useMemo(() => {
    const options = dataKhoaHoc?.data?.Data || [];
    return [
      { label: "Tất cả khóa học", value: "" },
      ...options.map((kh) => ({
        label: kh.Ten || kh.MaKhoaHoc || "Không có tên",
        value: kh.MaKhoaHoc || "",
      })),
    ];
  }, [dataKhoaHoc]);

  const handleSearch = () => {
    const params = {};

    if (searchText.trim()) {
      params.search = searchText.trim();
    }

    if (selectedKhoaHoc) {
      params.ma_khoa = selectedKhoaHoc;
    }

    if (Object.keys(params).length === 0) {
      message.warning("Vui lòng nhập từ khóa hoặc chọn khóa học để tìm kiếm");
      return;
    }

    setSearchParams(params);
  };

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
            {isLoggingIn ? (
              <div className="p-10 text-center">
                <Spin tip="Đang chuyển đổi tài khoản..." />
              </div>
            ) : (
              <StudentDetail data={selectedRecord} />
            )}
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
    <div className="relative">
      {isLoggingIn && (
        <div className="fixed inset-0 flex flex-col justify-center items-center">
          <Spin size="middle" />
          <div className="mt-4 font-medium text-base text-[#1890ff]">
            Đang chuyển đổi dữ liệu...
          </div>
        </div>
      )}
      <div>
        <Title level={3} className="!mb-1">
          Tìm kiếm học viên
        </Title>
        <Card className="!mt-5">
          <Row gutter={16} align="bottom">
            <Col xs={24} sm={12} md={3}>
              <label className="block text-xs text-gray-500 uppercase mb-1.5 ml-1 font-semibold text-blue-600">
                Dữ liệu mới
              </label>
              <div className="flex items-center h-10 pl-1">
                <Switch
                  checked={accountType === "new"}
                  disabled={isLoggingIn}
                  onChange={(checked) => {
                    setIsLoggingIn(true);
                    setTokenReadyFor(null);
                    setAccountType(checked ? "new" : "old");
                    setSelectedKhoaHoc("");
                    setSearchParams({});
                  }}
                  checkedChildren="Mới"
                  unCheckedChildren="Cũ"
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={9}>
              <label className="block text-xs text-gray-500 uppercase mb-1.5 ml-1">
                Khóa học
              </label>
              <Select
                className="w-full !text-sm"
                placeholder="-- Chọn khóa học --"
                loading={loadingKhoaHoc || isLoggingIn}
                disabled={isLoggingIn}
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
                size="large"
              />
            </Col>
            <Col span={9}>
              <label className="block text-xs text-gray-500 uppercase mb-1.5 ml-1">
                Từ khóa
              </label>
              <Input
                placeholder="Nhập tối thiểu 2 ký tự..."
                disabled={isLoggingIn}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="large"
                className="!text-sm"
                onPressEnter={handleSearch}
              />
            </Col>
            <Col span={3}>
              <Button
                type="primary"
                size="large"
                className="w-full !font-medium !rounded-md !bg-[#3366CC] !text-sm"
                onClick={handleSearch}
                disabled={isLoggingIn}
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
                <Empty description="Không có dữ liệu" />
              )}
            </Spin>
          </Card>
        )}

        <Drawer
          title={drawerProps.title}
          onClose={handleCloseForm}
          open={openedDrawer}
          width="100vw"
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
    </div>
  );
}
