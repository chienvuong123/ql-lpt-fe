import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Input, Button, Table, Row, Col, message, Select } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { DanhSachGiaoVien } from "../../apis/giaoVien";
import { DanhSachHocVien, DanhSachKhoaHoc } from "../../apis/hocVien";
import { DanhSachLoaiXe, DanhSachXe } from "../../apis/xe";

message.config({
  top: 100,
  duration: 3,
  maxCount: 3,
});

export default function DongBoHocVienVaoXe() {
  const [searchParams, setSearchParams] = useState({});
  const [searchText, setSearchText] = useState("");
  const [searchCar, setSearchCar] = useState("");
  const [debouncedSearchCar, setDebouncedSearchCar] = useState(searchCar);
  const [selectedStudentKeys, setSelectedStudentKeys] = useState([]);
  const [selectedTeacherKeys, setSelectedTeacherKeys] = useState([]);
  const [selectedCarKeys, setSelectedCarKeys] = useState([]);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");

  const {
    data: dataCart = {},
    isLoading: isLoadingCar,
    refetch: refetchCars,
  } = useQuery({
    queryKey: ["danhSachXe"],
    queryFn: () => DanhSachXe(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: dataLoaiXe = {} } = useQuery({
    queryKey: ["danhSachLoaiXe"],
    queryFn: () => DanhSachLoaiXe(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: resultsCourse = {} } = useQuery({
    queryKey: ["danhSachKhoaHoc"],
    queryFn: () => DanhSachKhoaHoc(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: dataStudents = {}, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["danhSachHocVien", searchParams],
    queryFn: () =>
      DanhSachHocVien({
        page: 1,
        limit: 20,
        soCmt: searchParams.soCmt || undefined,
        idkhoahoc: searchParams.idkhoahoc || undefined,
      }),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: dataTeachers = {}, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["danhSachGiaoVien"],
    queryFn: () =>
      DanhSachGiaoVien({
        page: 1,
        limit: 1000,
      }),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchCar(searchCar);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchCar]);

  const khoaHocOptions = useMemo(() => {
    const courses = Array.isArray(resultsCourse?.data?.Data)
      ? resultsCourse.data.Data
      : [];

    return courses.map((course) => ({
      value: course.ID,
      label: course.Ten,
    }));
  }, [resultsCourse]);

  const teacherData = useMemo(
    () =>
      Array.isArray(dataTeachers?.data?.Data) ? dataTeachers.data.Data : [],
    [dataTeachers],
  );

  const teacherOptions = useMemo(() => {
    return teacherData
      .filter((teacher) => teacher.MaGV)
      .map((teacher) => {
        const teacherName = teacher.HoTen || teacher.MaGV;
        const yearOfBirth = teacher.NgaySinh
          ? new Date(teacher.NgaySinh).getFullYear()
          : null;

        return {
          value: teacher.MaGV,
          label: yearOfBirth ? `${teacherName} - ${yearOfBirth}` : teacherName,
        };
      });
  }, [teacherData]);

  const carLoaiXeList = useMemo(
    () => dataLoaiXe?.data?.Data || [],
    [dataLoaiXe],
  );

  const studentData = useMemo(
    () =>
      Array.isArray(dataStudents?.data?.Data) ? dataStudents.data.Data : [],
    [dataStudents],
  );

  const carList = useMemo(
    () => (Array.isArray(dataCart?.data?.Data) ? dataCart.data.Data : []),
    [dataCart],
  );

  const isAllStudentsSelected = useMemo(() => {
    if (studentData.length === 0 || selectedStudentKeys.length === 0) {
      return false;
    }

    const allStudentKeys = studentData
      .map((student) => student.MaDK)
      .filter(Boolean);

    return (
      allStudentKeys.length > 0 &&
      selectedStudentKeys.length === allStudentKeys.length &&
      allStudentKeys.every((key) => selectedStudentKeys.includes(key))
    );
  }, [studentData, selectedStudentKeys]);

  const selectedStudentNames = useMemo(() => {
    return studentData
      .filter((student) => selectedStudentKeys.includes(student.MaDK))
      .map((student) => student.HoTen || student.MaDK);
  }, [studentData, selectedStudentKeys]);

  const selectedTeacherNames = useMemo(() => {
    return teacherData
      .filter((teacher) => selectedTeacherKeys.includes(teacher.MaGV))
      .map((teacher) => teacher.HoTen || teacher.MaGV);
  }, [teacherData, selectedTeacherKeys]);

  const selectedCarNames = useMemo(() => {
    return carList
      .filter((car) => selectedCarKeys.includes(car.BienSo))
      .map((car) => car.TenXe || car.BienSo);
  }, [carList, selectedCarKeys]);

  const studentColumns = useMemo(
    () => [
      {
        title: "Mã học viên",
        dataIndex: "MaDK",
        width: 100,
        ellipsis: true,
      },
      {
        title: "Họ tên",
        dataIndex: "HoTen",
        key: "HoTen",
        width: 140,
        ellipsis: true,
      },
      {
        title: "Số CCCD",
        dataIndex: "SoCMT",
        width: 90,
        ellipsis: true,
      },
    ],
    [],
  );

  const carColumns = useMemo(
    () => [
      {
        title: "Biển số",
        dataIndex: "BienSo",
        width: 100,
      },
      {
        title: "Số IMEI",
        dataIndex: "IMEI",
        width: 140,
      },
      {
        title: "Loại xe",
        dataIndex: "IDLoaiXe",
        width: 70,
        render: (idLoaiXe) => {
          const loaiXe = carLoaiXeList.find(
            (item) => String(item.ID) === String(idLoaiXe),
          );
          return loaiXe ? loaiXe.Ten : "";
        },
      },
    ],
    [carLoaiXeList],
  );

  const handleSearch = useCallback(() => {
    const trimmed = searchText.trim();
    const next = {};

    if (trimmed.length >= 2) {
      next.soCmt = trimmed;
    }

    if (selectedKhoaHoc) {
      next.idkhoahoc = selectedKhoaHoc;
    }

    setSearchParams(next);
  }, [searchText, selectedKhoaHoc]);

  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
  }, []);

  const handleKhoaHocChange = useCallback((value) => {
    setSelectedKhoaHoc(value || "");
  }, []);

  const handleTeacherChange = useCallback((value) => {
    setSelectedTeacherKeys(value || []);
  }, []);

  const carData = useMemo(() => {
    if (!debouncedSearchCar) {
      return carList;
    }

    return carList.filter((car) =>
      car.BienSo?.toUpperCase().includes(debouncedSearchCar.toUpperCase()),
    );
  }, [carList, debouncedSearchCar]);

  const handleReload = useCallback(
    (isCar = false) => {
      if (isCar) {
        setSelectedCarKeys([]);
        setSearchCar("");
        setDebouncedSearchCar("");
        refetchCars();
        return;
      }

      handleSearch();
    },
    [handleSearch, refetchCars],
  );

  const handleToggleAll = useCallback(
    (data, keyField, selectedKeys, setSelectedKeys) => {
      if (!Array.isArray(data) || data.length === 0) {
        setSelectedKeys([]);
        return;
      }

      const allKeys = data.map((item) => item[keyField]).filter(Boolean);
      const isAllSelected =
        selectedKeys.length === allKeys.length &&
        allKeys.every((key) => selectedKeys.includes(key));

      setSelectedKeys(isAllSelected ? [] : allKeys);
    },
    [],
  );

  const handleSubmit = async () => {
    if (selectedStudentKeys.length === 0) {
      message.error("Vui lòng chọn ít nhất 1 học viên!", 3);
      return;
    }

    if (selectedCarKeys.length === 0) {
      message.error("Vui lòng chọn ít nhất 1 xe!", 3);
      return;
    }

    if (!selectedKhoaHoc) {
      message.error("Vui lòng chọn khóa học của học viên!", 3);
      return;
    }

    const hide = message.loading("Đang xử lý dữ liệu...", 0);

    try {
      await DanhSachXe({
        dsBienSo: selectedCarKeys.join(","),
        dsMaDk: isAllStudentsSelected
          ? undefined
          : selectedStudentKeys.join(","),
        dsMaGV:
          selectedTeacherKeys.length > 0
            ? selectedTeacherKeys.join(",")
            : undefined,
        idkhoahoc: selectedKhoaHoc,
      });

      const khoaHocName =
        khoaHocOptions.find((k) => k.value === selectedKhoaHoc)?.label || "";

      const studentLabel = isAllStudentsSelected
        ? `khóa ${khoaHocName}`
        : selectedStudentNames.length > 0
          ? selectedStudentNames.join(", ")
          : selectedStudentKeys.join(", ");
      const teacherLabel =
        selectedTeacherNames.length > 0
          ? selectedTeacherNames.join(", ")
          : selectedTeacherKeys.join(", ");
      const carLabel =
        selectedCarNames.length > 0
          ? selectedCarNames.join(", ")
          : selectedCarKeys.join(", ");

      message.success(
        `Đồng bộ học viên ${studentLabel}${
          teacherLabel ? `, giáo viên ${teacherLabel}` : ""
        } vào xe ${carLabel} thành công!`,
        3,
      );
    } catch (error) {
      console.error("Lỗi API:", error);
      message.error("Có lỗi xảy ra khi gửi dữ liệu. Vui lòng thử lại!");
    } finally {
      hide();
    }
  };

  return (
    <div>
      <div className="mx-auto mb-5">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Đồng bộ học viên vào xe
        </h1>
      </div>

      <Row gutter={[12, 12]} className="mb-4">
        <Col span={12}>
          <Card>
            <h2 className="text-lg !font-bold text-gray-900 !mb-0">Học viên</h2>
            <p className="text-[#64748b] text-sm">
              Tìm kiếm theo tên hoặc mã HV, mã khóa học.
            </p>

            <Row gutter={6} className="mb-2">
              <Col span={6}>
                <Input
                  placeholder="Nhập tên học viên"
                  size="middle"
                  aria-label="lọc học viên"
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onPressEnter={handleSearch}
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Chọn giáo viên"
                  size="middle"
                  className="w-full"
                  value={
                    selectedTeacherKeys.length > 0
                      ? selectedTeacherKeys
                      : undefined
                  }
                  onChange={handleTeacherChange}
                  allowClear
                  showSearch
                  mode="multiple"
                  loading={isLoadingTeachers}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={teacherOptions}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Chọn khóa học"
                  size="middle"
                  className="w-full"
                  value={selectedKhoaHoc || undefined}
                  onChange={handleKhoaHocChange}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={khoaHocOptions}
                />
              </Col>
              <Col span={4} className="!flex gap-2">
                <Button
                  icon={<ReloadOutlined />}
                  size="middle"
                  className="!px-2"
                  type="primary"
                  onClick={() => handleReload(false)}
                />
                <Button
                  size="middle"
                  className="!px-2"
                  type="primary"
                  onClick={() =>
                    handleToggleAll(
                      studentData,
                      "MaDK",
                      selectedStudentKeys,
                      setSelectedStudentKeys,
                    )
                  }
                >
                  Chọn tất cả
                </Button>
              </Col>
            </Row>

            <Table
              columns={studentColumns}
              dataSource={studentData}
              loading={isLoadingStudents}
              pagination={{ pageSize: 10 }}
              size="small"
              bordered
              rowKey="MaDK"
              sticky
              className="h-60 overflow-y-auto overflow-x-hidden"
              rowSelection={{
                selectedRowKeys: selectedStudentKeys,
                onChange: (keys) => setSelectedStudentKeys(keys),
              }}
              locale={{
                emptyText: (
                  <span className="text-xs font-medium">
                    Chưa có thông tin học viên
                  </span>
                ),
              }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <h2 className="text-lg !font-bold text-gray-900 !mb-0">Xe</h2>
            <p className="text-[#64748b] text-sm">
              Chọn 1 hoặc nhiều xe cần gán học viên.
            </p>

            <div className="flex gap-2 mb-2 mt-5">
              <Input
                placeholder="Lọc (biển số hoặc hạng)..."
                className="flex-1"
                size="middle"
                value={searchCar}
                onChange={(e) => setSearchCar(e.target.value)}
              />
              <Button
                icon={<ReloadOutlined />}
                size="middle"
                className="!px-2"
                type="primary"
                onClick={() => handleReload(true)}
              />
              <Button
                size="middle"
                className="!px-2"
                type="primary"
                onClick={() =>
                  handleToggleAll(
                    carData,
                    "BienSo",
                    selectedCarKeys,
                    setSelectedCarKeys,
                  )
                }
              >
                Chọn tất cả
              </Button>
            </div>

            <Table
              columns={carColumns}
              dataSource={carData}
              pagination={{ pageSize: 10 }}
              loading={isLoadingCar}
              sticky
              className="h-60 overflow-y-auto !overflow-x-hidden"
              size="small"
              bordered
              rowKey="BienSo"
              rowSelection={{
                selectedRowKeys: selectedCarKeys,
                onChange: (keys) => setSelectedCarKeys(keys),
              }}
              locale={{
                emptyText: (
                  <span className="text-xs font-medium">
                    Chưa có thông tin xe
                  </span>
                ),
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <Card>
            <h2 className="text-lg !font-bold text-gray-900 !mb-0">
              Thực hiện đồng bộ
            </h2>
            <p className="text-[#64748b] text-sm">
              Có thể đồng bộ 1 học viên vào nhiều xe: hệ thống sẽ gọi tuần tự
              cho từng xe.
            </p>

            <Row gutter={[8, 8]} align="bottom" className="mt-6">
              <Col span={8}>
                <label className="block text-sm text-gray-500 uppercase mb-1 ml-1">
                  Mã HV đã chọn
                </label>
                <Input
                  placeholder="Mã HV đã chọn"
                  aria-label="mã học viên"
                  size="large"
                  disabled
                  value={selectedStudentKeys.join(",")}
                />
              </Col>
              <Col span={6}>
                <label className="block text-sm text-gray-500 uppercase mb-1 ml-1">
                  Mã GV đã chọn
                </label>
                <Input
                  placeholder="Mã GV đã chọn"
                  aria-label="mã giáo viên"
                  size="large"
                  disabled
                  value={selectedTeacherKeys.join(",")}
                />
              </Col>
              <Col span={8}>
                <label className="block text-sm text-gray-500 uppercase mb-1 ml-1">
                  Biển số xe đã chọn
                </label>
                <Input
                  placeholder="Biển số xe đã chọn"
                  size="large"
                  disabled
                  value={selectedCarKeys.join(",")}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="primary"
                  size="large"
                  className="w-full bg-blue-600"
                  onClick={handleSubmit}
                >
                  Đồng bộ
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <div className="text-center text-gray-500 text-sm mt-12">
        © 2026 Lập Phương Thành. All rights reserved.
      </div>
    </div>
  );
}
