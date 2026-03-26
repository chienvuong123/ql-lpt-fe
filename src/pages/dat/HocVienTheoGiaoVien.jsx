/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  message,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DanhSachKhoaHoc } from "../../apis/hocVien";
import {
  fetchCheckStudents,
  kiemTraTrungThoiGian,
  optionTeacherCheck,
} from "../../apis/kiemTra";

const { Title, Text } = Typography;

const formatDate = (value) => {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "-";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY HH:mm:ss") : "-";
};

const conflictColors = [
  { border: "#ef4444", background: "#fef2f2", tag: "red" },
  { border: "#f59e0b", background: "#fffbeb", tag: "gold" },
  { border: "#10b981", background: "#ecfdf5", tag: "green" },
  { border: "#3b82f6", background: "#eff6ff", tag: "blue" },
  { border: "#8b5cf6", background: "#f5f3ff", tag: "purple" },
];

const HocVienTheoGiaoVien = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(undefined);
  const [selectedCourse, setSelectedCourse] = useState(undefined);
  const [submittedFilter, setSubmittedFilter] = useState({
    teacher: undefined,
    course: undefined,
  });
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  const { data: courseResponse = {}, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["hocVienTheoGiaoVien", "courses"],
    queryFn: () => DanhSachKhoaHoc(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: teacherResponse = {}, isLoading: isLoadingTeachers } = useQuery(
    {
      queryKey: ["hocVienTheoGiaoVien", "teachers", selectedCourse],
      queryFn: () =>
        optionTeacherCheck({
          khoa: selectedCourse,
        }),
      enabled: !!selectedCourse,
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  );

  useEffect(() => {
    setSelectedTeacher(undefined);
  }, [selectedCourse]);

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

  useEffect(() => {
    setDuplicateCheckResult(null);
    setIsConflictModalOpen(false);
  }, [submittedFilter]);

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
    const teachers = Array.isArray(teacherResponse?.data)
      ? teacherResponse.data
      : Array.isArray(teacherResponse?.Data)
        ? teacherResponse.Data
        : Array.isArray(teacherResponse?.result)
          ? teacherResponse.result
          : [];

    return teachers.filter(Boolean).map((teacher) => ({
      value: teacher,
      label: teacher,
    }));
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

  const filteredMaDkList = useMemo(
    () =>
      dataSource
        .map((item) => String(item?.ma_dk || item?.maDangKy || "").trim())
        .filter(Boolean),
    [dataSource],
  );

  const conflictList = useMemo(() => {
    if (Array.isArray(duplicateCheckResult?.conflicts)) {
      return duplicateCheckResult.conflicts;
    }

    if (Array.isArray(duplicateCheckResult?.data?.conflicts)) {
      return duplicateCheckResult.data.conflicts;
    }

    if (Array.isArray(duplicateCheckResult?.Data?.conflicts)) {
      return duplicateCheckResult.Data.conflicts;
    }

    return [];
  }, [duplicateCheckResult]);

  const conflictCount = Number(
    duplicateCheckResult?.tong_conflict ??
      duplicateCheckResult?.data?.tong_conflict ??
      duplicateCheckResult?.Data?.tong_conflict ??
      conflictList.length ??
      0,
  );

  const { mutate: handleDuplicateCheck, isPending: isCheckingDuplicate } =
    useMutation({
      mutationFn: () => {
        const today = dayjs().format("YYYY-MM-DD");

        return kiemTraTrungThoiGian({
          ngaybatdau: "2022-01-01",
          ngayketthuc: `${today}T23:59:00`,
          ma_dk_list: filteredMaDkList,
        });
      },
      onSuccess: (response) => {
        const tongConflict = Number(
          response?.tong_conflict ??
            response?.data?.tong_conflict ??
            response?.Data?.tong_conflict ??
            0,
        );

        setDuplicateCheckResult(response);
        setIsConflictModalOpen(false);

        if (tongConflict > 0) {
          message.warning(`Phát hiện ${tongConflict} cặp phiên bị trùng thời gian.`);
          return;
        }

        message.success(
          `Đã kiểm tra ${filteredMaDkList.length} mã đăng ký, không có phiên lỗi.`,
        );
      },
      onError: (error) => {
        setDuplicateCheckResult(null);
        setIsConflictModalOpen(false);
        message.error(error?.message || "Không thể kiểm tra trùng thời gian.");
      },
    });

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
        width: 230,
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
        width: 90,
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
              disabled={!selectedCourse}
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

          {submittedFilter.teacher &&
          submittedFilter.course &&
          filteredMaDkList.length > 0 ? (
            <div className="!flex !items-center !gap-2">
              <Button
                type="primary"
                onClick={() => handleDuplicateCheck()}
                loading={isCheckingDuplicate}
              >
                Kiểm tra
              </Button>
              {conflictCount > 0 ? (
                <Button onClick={() => setIsConflictModalOpen(true)}>
                  Xem chi tiết lỗi
                </Button>
              ) : null}
            </div>
          ) : null}
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

      <Modal
        title={`Chi tiết phiên lỗi (${conflictCount})`}
        open={isConflictModalOpen}
        onCancel={() => setIsConflictModalOpen(false)}
        footer={null}
        width={1000}
      >
        {conflictList.length > 0 ? (
          <div className="!space-y-4">
            {conflictList.map((conflict, index) => {
              const color = conflictColors[index % conflictColors.length];
              const sessions = [
                { key: "phien_1", label: "Phiên 1", data: conflict?.phien_1 },
                { key: "phien_2", label: "Phiên 2", data: conflict?.phien_2 },
              ];

              return (
                <div
                  key={`${conflict?.phien_1?.id || "p1"}-${conflict?.phien_2?.id || "p2"}-${index}`}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: color.border,
                    backgroundColor: color.background,
                  }}
                >
                  <div className="!mb-3 !flex !items-center !justify-between !gap-3">
                    <div className="!flex !items-center !gap-2 !flex-wrap">
                      <Tag color={color.tag}>Lỗi #{index + 1}</Tag>
                      <Text strong>{conflict?.giaoVien || "Không rõ giáo viên"}</Text>
                    </div>
                    <Text type="secondary">Cặp phiên bị trùng thời gian</Text>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {sessions.map((session) => (
                      <div
                        key={session.key}
                        className="rounded-lg border bg-white p-4"
                        style={{ borderColor: color.border }}
                      >
                        <div className="!mb-3">
                          <Tag color={color.tag}>{session.label}</Tag>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                          <div>
                            <Text type="secondary">Mã đăng ký</Text>
                            <div className="font-medium">
                              {session?.data?.ma_dk || "-"}
                            </div>
                          </div>
                          <div>
                            <Text type="secondary">Khóa học</Text>
                            <div className="font-medium">
                              {session?.data?.khoaHoc || "-"}
                            </div>
                          </div>
                          <div>
                            <Text type="secondary">Biển số</Text>
                            <div className="font-medium">
                              {session?.data?.bienSo || "-"}
                            </div>
                          </div>
                          <div>
                            <Text type="secondary">Mã phiên</Text>
                            <div className="font-medium">
                              {session?.data?.id || "-"}
                            </div>
                          </div>
                          <div>
                            <Text type="secondary">Đăng nhập</Text>
                            <div className="font-medium">
                              {formatDateTime(session?.data?.dangNhap)}
                            </div>
                          </div>
                          <div>
                            <Text type="secondary">Đăng xuất</Text>
                            <div className="font-medium">
                              {formatDateTime(session?.data?.dangXuat)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty description="Không có phiên lỗi." />
        )}
      </Modal>
    </div>
  );
};

export default HocVienTheoGiaoVien;
