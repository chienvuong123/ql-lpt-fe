/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import { Card, Col, Empty, Row, Select, Table, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DanhSachGiaoVien } from "../../apis/giaoVien";
import { DanhSachKhoaHoc } from "../../apis/hocVien";
import { fetchCheckStudents } from "../../apis/kiemTra";

const { Title, Text } = Typography;

const formatDate = (value) => {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "-";
};

const HocVienTheoGiaoVien = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(undefined);
  const [selectedCourse, setSelectedCourse] = useState(undefined);
  const [submittedFilter, setSubmittedFilter] = useState({
    teacher: undefined,
    course: undefined,
  });

  const { data: teacherResponse = {}, isLoading: isLoadingTeachers } = useQuery(
    {
      queryKey: ["hocVienTheoGiaoVien", "teachers"],
      queryFn: () =>
        DanhSachGiaoVien({
          page: 1,
          limit: 1000,
        }),
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  );

  const { data: courseResponse = {}, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["hocVienTheoGiaoVien", "courses"],
    queryFn: () => DanhSachKhoaHoc(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (selectedTeacher && selectedCourse) {
      setSubmittedFilter({
        teacher: selectedTeacher,
        course: selectedCourse,
      });
      return;
    }

    setSubmittedFilter({
      teacher: undefined,
      course: undefined,
    });
  }, [selectedTeacher, selectedCourse]);

  const {
    data: dataCheckStudents = {},
    isLoading: isLoadingStudents,
    isFetching: isFetchingStudents,
  } = useQuery({
    queryKey: ["hocVienTheoGiaoVien", "students", submittedFilter],
    queryFn: () =>
      fetchCheckStudents({
        khoa: submittedFilter.course,
        giaoVien: submittedFilter.teacher,
      }),
    enabled: !!submittedFilter.teacher && !!submittedFilter.course,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const teacherOptions = useMemo(() => {
    const teachers = Array.isArray(teacherResponse?.data?.Data)
      ? teacherResponse.data.Data
      : [];

    return teachers
      .filter((teacher) => teacher?.HoTen || teacher?.MaGV)
      .map((teacher) => {
        const teacherName = teacher?.HoTen || teacher?.MaGV;
        const yearOfBirth = teacher?.NgaySinh
          ? new Date(teacher.NgaySinh).getFullYear()
          : null;

        return {
          value: teacherName,
          label: yearOfBirth ? `${teacherName} - ${yearOfBirth}` : teacherName,
        };
      });
  }, [teacherResponse]);

  const courseOptions = useMemo(() => {
    const courses = Array.isArray(courseResponse?.data?.Data)
      ? courseResponse.data.Data
      : [];

    return courses.map((course) => ({
      value: course?.Ten || "",
      label: course?.Ten || course?.MaKhoaHoc || `Khóa ${course?.ID || ""}`,
      searchText: `${course?.Ten || ""} ${course?.MaKhoaHoc || ""}`.trim(),
    }));
  }, [courseResponse]);

  const dataSource = useMemo(() => {
    const list =
      dataCheckStudents?.data ||
      dataCheckStudents?.Data ||
      dataCheckStudents?.result ||
      [];

    return Array.isArray(list) ? list : [];
  }, [dataCheckStudents]);

  const columns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "stt",
        key: "stt",
        width: 30,
        align: "center",
        render: (_value, _record, index) => index + 1,
      },
      {
        title: "Mã đăng ký",
        dataIndex: "maDangKy",
        key: "maDangKy",
        width: 220,
      },
      {
        title: "Họ và tên",
        dataIndex: "hoVaTen",
        key: "hoVaTen",
        width: 260,
        render: (value) => <span className="font-medium">{value || "-"}</span>,
      },
      {
        title: "Giới tính",
        dataIndex: "gioiTinh",
        key: "gioiTinh",
        width: 90,
        align: "center",
        render: (value) => value || "-",
      },
      {
        title: "Ngày sinh",
        dataIndex: "ngaySinh",
        key: "ngaySinh",
        width: 100,
        align: "center",
        render: formatDate,
      },
      {
        title: "CCCD/CMND",
        dataIndex: "soCMND",
        key: "soCMND",
        width: 140,
        align: "center",
        render: (value) => value || "-",
      },
      {
        title: "Khóa",
        dataIndex: "khoaHoc",
        key: "khoaHoc",
        width: 140,
        align: "center",
        render: (value) => value || "-",
      },
      {
        title: "Giáo viên",
        dataIndex: "giaoVien",
        key: "giaoVien",
        width: 180,
        render: (value) => value || "-",
      },
      {
        title: "Xe B1",
        dataIndex: "xeB1",
        key: "xeB1",
        width: 130,
        align: "center",
        render: (value) => value || "-",
      },
      {
        title: "Xe B2",
        dataIndex: "xeB2",
        key: "xeB2",
        width: 130,
        align: "center",
        render: (value) => value || "-",
      },
      {
        title: "Ngày nhập",
        dataIndex: "ngayNhap",
        key: "ngayNhap",
        width: 120,
        align: "center",
        render: formatDate,
      },
      {
        title: "Địa chỉ",
        dataIndex: "diaChiThuongTru",
        key: "diaChiThuongTru",
        width: 260,
        render: (value) => value || "-",
      },
    ],
    [],
  );

  return (
    <div className="!space-y-4">
      <div className="mx-auto mb-5">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Danh sách học viên theo giáo viên
        </h1>
      </div>

      <Card bodyStyle={{ padding: 16 }}>
        <Row gutter={[12, 12]} align="bottom">
          <Col xs={24} md={12}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Khóa học
            </label>
            <Select
              className="!w-full"
              size="middle"
              placeholder="Chọn khóa học"
              value={selectedCourse}
              onChange={setSelectedCourse}
              options={courseOptions}
              loading={isLoadingCourses}
              allowClear
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.searchText || option?.label || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} md={12}>
            <label className="block text-xs text-gray-500 uppercase mb-1 ml-1">
              Giáo viên
            </label>
            <Select
              className="!w-full"
              size="middle"
              placeholder="Chọn giáo viên"
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              options={teacherOptions}
              loading={isLoadingTeachers}
              allowClear
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 24 }}>
        <div className="!mb-4 !flex !items-center !justify-between !gap-3">
          <div>
            <Title level={5} className="!mb-1">
              Kết quả tìm kiếm
            </Title>
            <Text type="secondary">
              Giáo viên:{" "}
              <span className="!font-medium !text-slate-700">
                {submittedFilter.teacher || "--"}
              </span>
              {" | "}
              Khóa học:{" "}
              <span className="!font-medium !text-slate-700">
                {submittedFilter.course || "--"}
              </span>
            </Text>
          </div>
        </div>

        {submittedFilter.teacher && submittedFilter.course ? (
          <Table
            columns={columns}
            dataSource={dataSource}
            loading={isLoadingStudents || isFetchingStudents}
            rowKey={(record) => record?._id || record?.maDangKy}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} học viên`,
            }}
            locale={{
              emptyText: (
                <Empty description="Không có học viên nào khớp với điều kiện đã chọn" />
              ),
            }}
            size="small"
            bordered
            scroll={{ x: 1300 }}
            className="overflow-hidden table-blue-header"
          />
        ) : (
          <Empty description="Chọn khóa học và giáo viên để tải danh sách học viên" />
        )}
      </Card>
    </div>
  );
};

export default HocVienTheoGiaoVien;
