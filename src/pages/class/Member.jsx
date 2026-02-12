import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Progress,
  message,
  Row,
  Col,
  Image,
  Upload,
} from "antd";
import { BsArrowLeft, BsArrowBarUp } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import StudentDetailModal from "./StudentDetailModal";
import { importStudents, studentList } from "../../apis/student";
import { importCourses, sourceOptions } from "../../apis/khoaHoc";
import dayjs from "dayjs";
import { LICENSE_PLATE_LABEL } from "../../constants";

const Member = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [select, setSelected] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    cccd: "",
  });
  const [params, setParams] = useState({
    maKhoaHoc: null,
  });

  const navigate = useNavigate();

  const { data: dataKhoaHoc = {} } = useQuery({
    queryKey: ["sourceOptions"],
    queryFn: () => sourceOptions(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: studentRes = {} } = useQuery({
    queryKey: ["studentList", params],
    queryFn: () => studentList(params),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
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
    return studentRes?.data || [];
  }, [studentRes]);

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
    setParams({
      page: 1,
      limit: 10,
      maKhoaHoc: null,
    });
  };

  const getCompletionStats = (data) => {
    const monHoc = [
      data.kyThuatLaiXe,
      data.cauTaoSuaChua,
      data.daoDucVHGT,
      data.phapLuatGT08?.pl1,
      data.phapLuatGT08?.pl2,
      data.phapLuatGT08?.pl3,
      data.moPhong,
    ];

    const soMonDat = monHoc.filter((mon) => mon?.trangThaiDat === "Đạt").length;

    const tongSoMon = monHoc.length;

    const phanTramHoanThanh =
      tongSoMon > 0 ? Math.round((soMonDat / tongSoMon) * 100) : 0;

    return {
      soMonDat,
      tongSoMon,
      phanTramHoanThanh,
      trangThaiChung: data.trangThaiDat,
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
      title: "Khóa",
      dataIndex: "khoaHoc",
      key: "khoaHoc",
      width: 100,
      render: (_, record) => {
        return <span>#{record?.khoaHoc?.tenKhoaHoc || "Không có data"}</span>;
      },
    },
    {
      title: "Học viên",
      dataIndex: "ten",
      key: "ten",
      width: 260,

      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Image
            src={record?.anhChanDung}
            className="!h-10 !w-10 rounded-lg"
            alt="av"
          />

          <div className="flex flex-col">
            <span className="font-bold text-gray-800">
              {text.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{record?.ma}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Mã CT",
      dataIndex: "khoaHoc",
      key: "khoaHoc",
      width: 80,
      align: "center",
      render: (_, record) => {
        return <span>{record?.khoaHoc?.hangDaoTao || "Không có data"}</span>;
      },
    },
    {
      title: "Loại hình đào tạo",
      dataIndex: "khoaHoc",
      key: "khoaHoc",
      width: 150,
      align: "center",
      render: (khoaHoc) => (
        <div className="flex flex-col">
          <span>{LICENSE_PLATE_LABEL[khoaHoc?.hangDaoTao] || "-"}</span>
        </div>
      ),
    },
    // {
    //   title: "Loại hình",
    //   dataIndex: "type",
    //   key: "type",
    //   width: 100,
    // },
    {
      title: "CCCD",
      dataIndex: "ma",
      key: "ma",
      width: 130,
    },
    {
      title: "Năm sinh",
      dataIndex: "ngaySinh",
      key: "ngaySinh",
      width: 100,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Đã đăng nhập?",
      dataIndex: "lanCuoiDangNhap",
      key: "lanCuoiDangNhap",
      width: 130,
      align: "center",
      render: (val) => (
        <span className={val ? "text-green-600 font-medium" : "text-red-500"}>
          {val ? "Đã" : "Chưa "}
        </span>
      ),
    },
    {
      title: "Đăng nhập cuối",
      dataIndex: "lanCuoiDangNhap",
      key: "lanCuoiDangNhap",
      width: 160,
      align: "center",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thời gian học hôm nay",
      dataIndex: "thoiGianDaHocHomNay",
      key: "thoiGianDaHocHomNay",
      width: 170,
      align: "center",
    },
    {
      title: "Tiến độ",
      dataIndex: "trangThaiDat",
      key: "trangThaiDat",
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
      key: "trangThaiDat",
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
      key: "details",
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

  const handleUpload = async () => {
    if (fileList.length === 0) return message.warning("Vui lòng chọn file!");

    const formData = new FormData();

    fileList.forEach((file) => {
      if (file.name.endsWith(".xlsx")) {
        formData.append("excelFile", file);
      } else if (file.name.endsWith(".xml")) {
        formData.append("xmlFile", file);
      }
    });

    setUploading(true);
    try {
      await importStudents(formData);
      message.success("Import dữ liệu thành công!");
      setFileList([]);
    } catch (err) {
      console.log(err);
      message.error("Import thất bại!");
    } finally {
      setUploading(false);
    }
  };

  const props = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // Kiểm tra định dạng file
      const isAllowed =
        file.name.endsWith(".xlsx") || file.name.endsWith(".xml");
      if (!isAllowed) {
        message.error(`${file.name} không phải file Excel hoặc XML`);
        return Upload.LIST_IGNORE;
      }
      setFileList([...fileList, file]);
      return false; // Chặn upload tự động
    },
    fileList,
    multiple: true,
  };

  const courses = {
    accept: ".xlsx,.csv",
    showUploadList: false,
    beforeUpload: async (file) => {
      try {
        await importCourses(file);
        message.success("Import khóa học thành công");
      } catch (err) {
        console.log(err);
        message.error("Import thất bại");
      }
      return false;
    },
  };

  return (
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
        <Space>
          <Upload {...props}>
            <Button>Chọn Files (Excel/XML)</Button>
          </Upload>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
          >
            Bắt đầu Import
          </Button>
        </Space>
        <Upload {...courses}>
          <Button>Thêm khóa</Button>
        </Upload>
      </Space>

      <Row gutter={[12, 12]} align="bottom">
        <Col span={3}>
          <label className="block text-xs text-gray-500">LỚP</label>
          <Select
            className="w-full"
            placeholder="--Tất cả--"
            value={filters.maKhoaHoc}
            onChange={(value) => handleFilterChange("maKhoaHoc", value)}
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
        dataSource={students?.data || []}
        rowKey="id"
        pagination={false}
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
  );
};

export default Member;
