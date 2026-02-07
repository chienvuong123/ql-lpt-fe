import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card, Input, Button, Table, Row, Col, message, Select } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { DanhSachGiaoVien } from "../../apis/giaoVien";
import { DanhSachLoaiXe, DanhSachXe } from "../../apis/xe";
import { useQuery } from "@tanstack/react-query";
import { DanhSachHocVien, DanhSachKhoaHoc } from "../../apis/hocVien";

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
  const debounceTimer = useRef(null);
  const [selectedStudentKeys, setSelectedStudentKeys] = useState([]);
  const [selectedCarKeys, setSelectedCarKeys] = useState([]);
  const [selectedKhoaHoc, setSelectedKhoaHoc] = useState("");

  // Fetch danh sách xe - gọi lúc mount, không cần tham số tìm kiếm
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

  // Fetch danh sách học viên - gọi khi searchParams thay đổi
  const {
    data: dataStudents = {},
    isLoading: isLoadingStudents,
    refetch: refetchStudents,
  } = useQuery({
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
    enabled: Object.keys(searchParams).length > 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchCar(searchCar);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchCar]);

  const khoaHocList = useMemo(() => {
    const courses = Array.isArray(resultsCourse?.data?.Data)
      ? resultsCourse.data.Data
      : [];
    return courses;
  }, [resultsCourse]);

  const carDataWithLoaiXe = useMemo(() => {
    return dataLoaiXe?.data?.Data || [];
  }, [dataLoaiXe]);

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
        render: (IDLoaiXe) => {
          const loaiXe = carDataWithLoaiXe.find(
            (lx) => String(lx.ID) === String(IDLoaiXe),
          );
          return loaiXe ? loaiXe.Ten : "";
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setSearchParams((prev) => {
        const trimmed = value.trim();

        if (trimmed.length >= 2) {
          return {
            ...prev,
            soCmt: trimmed,
          };
        }

        if (trimmed.length === 0) {
          const { ...rest } = prev;
          return rest;
        }

        return prev;
      });
    }, 1000);
  }, []);

  const handleKhoaHocChange = (value) => {
    setSelectedKhoaHoc(value);

    setSearchParams((prev) => {
      if (value) {
        return {
          ...prev,
          idkhoahoc: value,
        };
      }

      const { ...rest } = prev;
      return rest;
    });
  };

  // Lọc dữ liệu xe từ cached data - không cần call API lại
  const carData = useMemo(() => {
    const rawData = Array.isArray(dataCart?.data?.Data)
      ? dataCart.data.Data
      : [];

    if (!debouncedSearchCar) return rawData;

    return rawData.filter((car) =>
      car.BienSo?.toUpperCase().includes(debouncedSearchCar.toUpperCase()),
    );
  }, [dataCart, debouncedSearchCar]);

  const handleReload = (isCar = false) => {
    if (isCar) {
      setSelectedCarKeys([]);
      setSearchCar("");
      setDebouncedSearchCar("");
      refetchCars();
    } else {
      setSelectedStudentKeys([]);
      setSearchText("");
      setSelectedKhoaHoc("");
      setSearchParams({});
      refetchStudents();
    }
  };

  const handleToggleAll = (data, keyField, selectedKeys, setSelectedKeys) => {
    // Kiểm tra dữ liệu hợp lệ
    if (!data || !Array.isArray(data) || data.length === 0) {
      setSelectedKeys([]);
      return;
    }

    // Lấy tất cả key từ data
    const allKeys = data.map((item) => item[keyField]).filter(Boolean);

    const isAllSelected =
      selectedKeys.length === allKeys.length &&
      allKeys.every((key) => selectedKeys.includes(key));

    if (isAllSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(allKeys);
    }
  };

  const handleSubmit = () => {
    if (selectedStudentKeys.length === 0) {
      message.error("Vui lòng chọn ít nhất 1 học viên!", 3);
      return;
    }
    if (selectedCarKeys.length === 0) {
      message.error("Vui lòng chọn ít nhất 1 xe!", 3);
      return;
    }
    DanhSachXe({
      dsBienSo: selectedCarKeys,
      dsMaDk: selectedStudentKeys,
      idkhoahoc: selectedKhoaHoc,
    });
  };

  return (
    <div>
      <div className="max-w-5xl mx-auto mb-6">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Đồng bộ học viên vào xe
        </h1>
        <p className="text-[#64748b] text-sm">
          Chọn học viên, chọn xe rồi bấm Đồng bộ.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto space-y-4">
        <Row gutter={[12, 12]} className="mb-4">
          <Col span={12}>
            <Card
              className="shadow-sm rounded-lg border border-gray-200"
              bodyStyle={{ padding: "24px" }}
            >
              <h2 className="text-lg !font-bold text-gray-900 !mb-0">
                Học viên
              </h2>
              <p className="text-[#64748b] text-sm">
                Tìm kiếm theo tên hoặc mã HV, mã Khóa học.
              </p>

              <div className="flex gap-2 mt-5 mb-2">
                <Input
                  placeholder="Lọc (tên hoặc mã)..."
                  size="middle"
                  aria-label="lọc"
                  value={searchText}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <Select
                  placeholder="Chọn khóa học"
                  size="middle"
                  style={{ width: 320 }}
                  value={selectedKhoaHoc}
                  onChange={handleKhoaHocChange}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {khoaHocList.map((kh) => (
                    <Select.Option key={kh.ID} value={kh.ID} label={kh.Ten}>
                      {kh.Ten}
                    </Select.Option>
                  ))}
                </Select>
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
                      dataStudents?.data?.Data || [],
                      "MaDk",
                      selectedStudentKeys,
                      setSelectedStudentKeys,
                    )
                  }
                >
                  Chọn tất cả
                </Button>
              </div>

              <Table
                columns={studentColumns}
                dataSource={
                  Array.isArray(dataStudents?.data?.Data)
                    ? dataStudents.data.Data
                    : []
                }
                loading={isLoadingStudents}
                pagination={{ pageSize: 10 }}
                size="small"
                bordered
                rowKey="MaDk"
                sticky={true}
                className="h-60 overflow-y-auto overflow-x-hidden"
                rowSelection={{
                  selectedRowKeys: selectedStudentKeys,
                  onChange: (keys) => setSelectedStudentKeys(keys),
                }}
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
          <Col span={12}>
            <Card
              className="shadow-sm rounded-lg border border-gray-200"
              bodyStyle={{ padding: "24px" }}
            >
              <h2 className="text-lg !font-bold text-gray-900 !mb-0">Xe</h2>
              <p className="text-[#64748b] text-sm">
                Chọn 1 hoặc nhiều xe cần gán giáo viên.
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
                      carData || [],
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
                sticky={true}
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
            <Card
              className="shadow-sm rounded-lg border border-gray-200"
              bodyStyle={{ padding: "24px" }}
            >
              <h2 className="text-lg !font-bold text-gray-900 !mb-0">
                Thực hiện đồng bộ
              </h2>
              <p className="text-[#64748b] text-sm">
                Có thể đồng bộ 1 giáo viên vào nhiều xe: hệ thống sẽ gọi tuần tự
                cho từng xe.
              </p>

              <Row gutter={[8, 8]}>
                <Col span={10}>
                  <Input
                    placeholder="Mã GV đã chọn"
                    aria-label="mã giáo viên"
                    size="large"
                    disabled
                    value={selectedStudentKeys.join(",")}
                  />
                </Col>
                <Col span={10}>
                  <Input
                    placeholder="Biển số xe đã chọn (1 hoặc nhiều)"
                    size="large"
                    disabled
                    value={selectedCarKeys.join(",")}
                  />
                </Col>
                <Col span={2}>
                  <Button
                    type="primary"
                    size="large"
                    className="bg-blue-600"
                    onClick={handleSubmit}
                  >
                    Đồng bộ
                  </Button>
                </Col>
              </Row>

              <div className=" pt-4">
                <a
                  href="/"
                  className="text-blue-500 text-sm hover:text-blue-700"
                >
                  ← Quay lại Dashboard
                </a>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <div className="text-center text-gray-500 text-sm mt-12">
        © 2026 Lập Phương Thành. All rights reserved.
      </div>
    </div>
  );
}
