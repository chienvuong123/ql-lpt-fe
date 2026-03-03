import React, { useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Row,
  Col,
  DatePicker,
  Card,
} from "antd";
import { lopHocLyThuyet } from "../../apis/khoaHoc";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DangNhapLopLyThuyet } from "../../apis/auth";

const HocVienKyDAT = () => {
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [params, setParams] = useState({
    text: "",
  });

  const { data: loginData } = useQuery({
    queryKey: ["loginLyThuyet"],
    queryFn: () => DangNhapLopLyThuyet(),
    staleTime: Infinity,
    select: (data) => data?.result,
  });

  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["lopHocLyThuyet", params],
    queryFn: () => lopHocLyThuyet(loginData, params),
    enabled: !!loginData,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const dataSource = useMemo(() => {
    return dataKhoaHoc?.result || [];
  }, [dataKhoaHoc]);

  const handleFilter = () => {
    const newParams = {
      text: searchText || undefined,
      start_date: startDate ? dayjs(startDate).unix() : undefined,
      end_date: endDate ? dayjs(endDate).unix() : undefined,
    };

    Object.keys(newParams).forEach(
      (key) => newParams[key] === undefined && delete newParams[key],
    );

    setParams(newParams);
  };

  const handleClearFilter = () => {
    setSearchText("");
    setStartDate(null);
    setEndDate(null);
    setParams({ page: 1, text: "" });
  };

  const asBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      return ["true", "1", "yes", "da", "co"].includes(value.toLowerCase());
    }
    return false;
  };

  const normalizeDate = (value, format = "DD/MM/YYYY") => {
    if (!value) return "";
    if (typeof value === "number") {
      const isUnixSeconds = String(value).length <= 10;
      const date = isUnixSeconds ? dayjs.unix(value) : dayjs(value);
      return date.isValid() ? date.format(format) : "";
    }
    const date = dayjs(value);
    return date.isValid() ? date.format(format) : "";
  };

  const renderAvatar = (url) => {
    if (!url) {
      return (
        <div className="h-[44px] w-[44px] rounded-lg border border-dashed border-gray-300 bg-gray-100 text-[11px] text-gray-400 flex items-center justify-center">
          N/A
        </div>
      );
    }

    return (
      <img
        src={url}
        alt="avatar"
        className="h-[44px] w-[44px] rounded-lg object-cover border border-gray-200"
      />
    );
  };

  const renderEmpty = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-slate-500">(tr?ng)</span>;
    }
    return value;
  };

  const columns = [
    {
      title: "#",
      key: "stt",
      width: 50,
      align: "center",
      fixed: "left",
      render: (_text, _record, index) => index + 1,
    },
    {
      title: "?nh",
      dataIndex: "srcAvatar",
      key: "srcAvatar",
      width: 68,
      align: "center",
      fixed: "left",
      render: (_text, record) =>
        renderAvatar(
          record?.srcAvatar ||
            record?.SrcdnAvatar ||
            record?.avatar ||
            record?.avatar_url ||
            "",
        ),
    },
    {
      title: "M� HV",
      dataIndex: "MaDK",
      key: "MaDK",
      width: 180,
      render: (_text, record) => (
        <span className="font-medium">
          {record?.MaDK || record?.student_code || record?.code || ""}
        </span>
      ),
    },
    {
      title: "H? t�n",
      dataIndex: "HoTen",
      key: "HoTen",
      width: 180,
      render: (_text, record) => (
        <span className="font-medium uppercase">
          {record?.HoTen || record?.name || ""}
        </span>
      ),
    },
    {
      title: "M� kh�a",
      dataIndex: "MaKhoaHoc",
      key: "MaKhoaHoc",
      width: 100,
      render: (_text, record) =>
        record?.MaKhoaHoc ||
        record?.course_code ||
        record?.__expand?.program?.code ||
        record?.suffix_name ||
        "",
    },
    {
      title: "Ng�y sinh",
      dataIndex: "NgaySinh",
      key: "NgaySinh",
      width: 100,
      render: (_text, record) =>
        normalizeDate(record?.NgaySinh || record?.dateOfBirth || record?.dob),
    },
    {
      title: "�� k�",
      dataIndex: "dat_confirmed",
      key: "dat_confirmed",
      width: 70,
      align: "center",
      render: (_text, record) => {
        const isSigned = asBoolean(
          record?.dat_confirmed ?? record?.signed ?? record?.da_ky,
        );

        return (
          <Tag
            className="!rounded-md !px-2 !py-0 !text-[12px] !font-semibold"
            color={isSigned ? "success" : "default"}
          >
            {isSigned ? "TRUE" : "FALSE"}
          </Tag>
        );
      },
    },
    {
      title: "Ghi ch� n?i b?",
      dataIndex: "internal_note",
      key: "internal_note",
      width: 130,
      render: (_text, record) => renderEmpty(record?.internal_note),
    },
    {
      title: "Ghi ch� c�ng khai",
      dataIndex: "public_note",
      key: "public_note",
      width: 130,
      render: (_text, record) => renderEmpty(record?.public_note),
    },
    {
      title: "H?ng d�o t?o",
      dataIndex: "HangDaoTao",
      key: "HangDaoTao",
      width: 100,
      render: (_text, record) =>
        record?.HangDaoTao || record?.trainingRank || "",
    },
    {
      title: "Ph�t CABIN",
      dataIndex: "CABIN",
      key: "phut_cabin",
      width: 90,
      align: "right",
      render: (_text, record) =>
        record?.CABIN?.thoiLuong ??
        record?.cabin_minutes ??
        record?.phut_cabin ??
        "",
    },
    {
      title: "B�i CABIN",
      dataIndex: "CABIN",
      key: "bai_cabin",
      width: 80,
      align: "right",
      render: (_text, record) =>
        record?.CABIN?.soBaiHoc ??
        record?.cabin_lessons ??
        record?.bai_cabin ??
        "",
    },
    {
      title: "C?p nh?t",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (_text, record) =>
        normalizeDate(
          record?.updatedAt || record?.updated_at || record?.ts,
          "YYYY-MM-DD HH:mm:ss",
        ),
    },
  ];

  return (
    <div className="mx-auto min-h-screen ">
      <h1 className="text-2xl !font-bold text-gray-900 !mb-1">
        Danh sách học viên đã ký DAT
      </h1>
      <Card className="!mt-4">
        <Row gutter={[12, 12]} align="bottom">
          <Col md={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Tên học viên
            </label>
            <Input
              placeholder="Tên học viên"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col md={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Ng�y b?t d?u
            </label>
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date)}
              format="DD/MM/YYYY"
              placeholder="Ch?n ng�y"
              className="!w-full"
            />
          </Col>
          <Col md={7}>
            <label className="block text-xs text-gray-500 uppercase">
              Ng�y k?t th�c
            </label>
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date)}
              format="DD/MM/YYYY"
              placeholder="Ch?n ng�y"
              className="!w-full"
              disabledDate={(current) => startDate && current < startDate}
            />
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                className="!bg-[#3366CC]"
                onClick={handleFilter}
              >
                Lọc
              </Button>
              <Button onClick={handleClearFilter}>Bỏ lọc</Button>
            </Space>
          </Col>
        </Row>
      </Card>
      <div className="py-5 !mt-2">
        <Row className="mb-3">
          <span>
            T?ng: <span className="font-bold">{dataSource?.length || 0}</span>{" "}
            h?c vi�n
          </span>
        </Row>
        <Table
          columns={columns}
          dataSource={dataSource || []}
          loading={isLoadingKhoaHoc}
          rowKey={(record) =>
            record?.ID || record?.id || record?.MaDK || record?.iid
          }
          pagination={false}
          size="middle"
          scroll={{ x: 1500, y: 540 }}
          bordered
          className="overflow-hidden hoc-vien-ky-dat-table"
        />
      </div>
    </div>
  );
};

export default HocVienKyDAT;
