import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Progress,
  Row,
  Col,
  Image,
  Upload,
  Spin,
} from "antd";
import { BsArrowLeft, BsArrowBarUp } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import StudentDetailModal from "./StudentDetailModal";
import { sourceOptions } from "../../apis/khoaHoc";
import dayjs from "dayjs";
import { LICENSE_PLATE_LABEL } from "../../constants";
import { hocVienTheoKhoa } from "../../apis/hocVien";

const Member = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [select, setSelected] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    cccd: "",
  });
  const [params, setParams] = useState({
    maKhoaHoc: null,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { enrolment_plan_iid, program_name, program_code } =
    location?.state || {};

  const { data: dataKhoaHoc = {} } = useQuery({
    queryKey: ["sourceOptions"],
    queryFn: () => sourceOptions(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: danhSachHocVien = {}, isLoading: isLoadingHocVien } = useQuery({
    queryKey: ["danhSachHocVien"],
    queryFn: () => hocVienTheoKhoa(enrolment_plan_iid),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const optionKhoaHoc = useMemo(() => {
    return (
      dataKhoaHoc?.data?.data?.map((item) => ({
        label: item.maKhoa,
        value: item.maKhoa,
        raw: item,
      })) || []
    );
  }, [dataKhoaHoc]);

  const students = useMemo(() => {
    return danhSachHocVien?.result || [];
  }, [danhSachHocVien]);

  const handleRowClick = (record) => {
    setSelected(record);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFilter = async () => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      ...filters,
    }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      cccd: "",
    });
  };

  const getCompletionStats = (record) => {
    const scoreByRubrik = record?.learning_progress?.score_by_rubrik || [];

    // bỏ qua các môn tổng hợp, chỉ lấy môn con
    const monHoc = scoreByRubrik.filter(
      (mon) =>
        !mon.name.includes("Bảng tổng hợp") &&
        !mon.name.includes("Điểm kiểm tra tổng hợp") &&
        !mon.name.includes("Tổng thời gian học"),
    );

    const tongSoMon = monHoc.length;
    const soMonDat = monHoc.filter((mon) => mon.passed === 1).length;
    const phanTramHoanThanh =
      tongSoMon > 0 ? Math.round((soMonDat / tongSoMon) * 100) : 0;

    return {
      soMonDat,
      tongSoMon,
      phanTramHoanThanh,
    };
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "#008000";
    if (progress >= 50) return "#faad14";
    return "#f5222d";
  };

  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Học viên",
      dataIndex: "user",
      key: "user",
      width: 280,
      render: (user) => (
        <div className="flex items-center gap-2">
          <Image
            src={user?.avatar}
            className="!h-11 !w-10.5 rounded-lg"
            alt="av"
          />

          <div className="flex flex-col">
            <span className="font-bold text-gray-600 text-sm">
              {user?.name?.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{user?.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Mã CT",
      width: 100,
      dataIndex: "program_code",
      align: "center",
      render: () => program_code,
    },
    {
      title: "Tên chương trình",
      width: 180,
      dataIndex: "program_name",
      align: "center",
      render: () => program_name,
    },
    {
      title: "CCCD",
      dataIndex: "user",
      key: "user",
      width: 160,
      align: "center",
      render: (date) => <span>{date?.identification_card}</span>,
    },
    {
      title: "Năm sinh",
      dataIndex: "user",
      key: "user",
      width: 160,
      align: "center",
      render: (date) => <span>{date?.birth_year}</span>,
    },
    {
      title: "Đăng nhập cuối",
      dataIndex: "__expand",
      key: "__expand",
      width: 160,
      align: "center",
      render: (data) => {
        const ts = data?.last_login_info?.ts;

        if (!ts) {
          return (
            <span style={{ color: "red", fontWeight: 500 }}>
              Chưa đăng nhập
            </span>
          );
        }

        return <span>{dayjs.unix(ts).format("DD/MM/YYYY HH:mm")}</span>;
      },
    },
    {
      title: "Tổng thời gian học",
      dataIndex: "__expand",
      key: "__expand",
      width: 170,
      align: "center",
      render: (time) => (
        <span>{Math.floor((time?.kpi_time?.seconds || 0) / 3600)} h</span>
      ),
    },
    {
      title: "Tiến độ",
      dataIndex: "learning_progress",
      key: "learning_progress",
      width: 130,
      align: "center",
      render: (_, record) => {
        const { phanTramHoanThanh } = getCompletionStats(record);

        return (
          <div className="w-full">
            <Progress
              percent={phanTramHoanThanh}
              size="small"
              showInfo={false}
              strokeColor={getProgressColor(phanTramHoanThanh)}
              strokeWidth={8}
            />
            <span className="text-xs text-gray-500">{phanTramHoanThanh}%</span>
          </div>
        );
      },
    },
    {
      title: "Passed/Total",
      key: "learning_progress",
      width: 120,
      align: "center",
      render: (_, record) => (
        <span>
          {getCompletionStats(record).soMonDat}/
          {getCompletionStats(record).tongSoMon}
        </span>
      ),
    },
    {
      title: "Chi tiết",
      key: "user",
      fixed: "right",
      width: 100,
      align: "center",
      render: (_, record) => (
        <div className="flex gap-1 justify-center">
          <Button
            type="primary"
            size="small"
            className="text-gray-600 !text-xs !bg-[#0000CC]"
            onClick={() => handleRowClick(record)}
          >
            🔍
          </Button>
          {/* <Button
            variant="primary"
            size="small"
            className="!text-[11px] !bg-gray-300"
          >
            ⏱
          </Button> */}
        </div>
      ),
    },
  ];

  return (
    <Spin spinning={isLoadingHocVien}>
      <div className=" p-4 mx-20 bg-gray-50 min-h-screen rounded-lg shadow-md ">
        <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
          Học viên lớp lý thuyết
        </h1>
        <p className="text-[#64748b] text-sm">
          Tra cứu và giám sát tiến độ học lý thuyết. Nhấn 🔍 để xem chi tiết
          nhanh.
        </p>

        <Space size="small" className="my-4">
          <Button
            type="text"
            icon={<BsArrowLeft size={20} />}
            onClick={() => navigate("/lop-hoc-ly-thuyet")}
            className="!font-medium !bg-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center !px-4 !py-2 !h-10 !rounded-xl"
          >
            Lớp lý thuyết
          </Button>
          <Button
            type="primary"
            icon={<BsArrowBarUp size={20} />}
            className="!font-medium !bg-[#0000CC] !shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 !px-4 !py-2 !h-10 !rounded-xl"
          >
            Xuất báo cáo theo môn học
          </Button>
        </Space>

        <Row gutter={[12, 12]} align="bottom">
          <Col span={3}>
            <label className="block text-xs text-gray-500">LỚP</label>
            <Select
              className="w-full"
              placeholder="--Tất cả--"
              value={filters.maKhoaHoc}
              // value={maKhoaHoc || filters.maKhoaHoc}
              // onChange={(value) => handleFilterChange("maKhoaHoc", value)}
              options={optionKhoaHoc}
              allowClear
            />
          </Col>

          <Col span={3}>
            <label className="block text-xs text-gray-500">TỪ KHÓA</label>
            <Input
              placeholder="Tên học viên"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </Col>
          <Col span={3}>
            <label className="block text-xs text-gray-500">CCCD</label>
            <Input
              placeholder="Nhập CCCD"
              value={filters.cccd}
              onChange={(e) => handleFilterChange("cccd", e.target.value)}
            />
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                className="!bg-[#0000CC]"
                onClick={handleFilter}
              >
                Lọc
              </Button>
              <Button onClick={handleReset}>Bỏ lọc</Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={students || []}
          pagination={false}
          rowKey="id"
          size="middle"
          scroll={{ x: 1200 }}
          className="rounded-lg overflow-hidden mt-10"
        />

        <StudentDetailModal
          studentData={select}
          visible={drawerVisible}
          onClose={handleDrawerClose}
          progress={getCompletionStats(select).phanTramHoanThanh}
          passed={getCompletionStats(select).soMonDat}
          total={getCompletionStats(select).tongSoMon}
        />
      </div>
    </Spin>
  );
};

export default Member;
