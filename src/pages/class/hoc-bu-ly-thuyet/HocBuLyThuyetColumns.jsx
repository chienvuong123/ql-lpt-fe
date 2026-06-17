import React from "react";
import { Button, Tag, Space, Popconfirm, Image, Typography } from "antd";
import { EyeOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { renderTrangThaiHocBu } from "../../../constants/hocBuConstants";
import HocVienInfo from "../../../components/HocVienInfor";

export const getHocBuLyThuyetColumns = ({ pagination, onOpenDetail }) => [
  {
    title: "#",
    key: "stt",
    width: 50,
    align: "center",
    render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
  },
  {
    title: "Học viên",
    key: "hoc_vien",
    width: 280,
    render: (_, record) => <HocVienInfo record={record} />,
  },
  {
    title: "CCCD",
    key: "cccd",
    width: 140,
    align: "center",
    render: (_, record) => record?.cccd || "-",
  },
  {
    title: "Ngày sinh",
    key: "ngay_sinh",
    width: 100,
    align: "center",
    render: (_, record) => {
      const date = record?.ngay_sinh;
      return date ? dayjs(date).format("DD/MM/YYYY") : "-";
    },
  },
  {
    title: "Khóa",
    key: "khoa",
    width: 120,
    align: "center",
    render: (_, record) => record?.khoa || "-",
  },
  {
    title: "Giáo viên",
    key: "giao_vien",
    width: 150,
    render: (_, record) => record?.giao_vien || "-",
  },
  {
    title: "Đạt lý thuyết",
    key: "loai_ly_thuyet",
    width: 120,
    align: "center",
    render: (_, record) => (
      record?.theoryInfo?.loai_ly_thuyet ? (
        <Tag color="green">Đạt</Tag>
      ) : (
        <Tag color="red">Chưa đạt</Tag>
      )
    ),
  },
  {
    title: "Bài hết môn",
    key: "loai_het_mon",
    width: 120,
    align: "center",
    render: (_, record) => (
      record?.theoryInfo?.loai_het_mon ? (
        <Tag color="green">Đã làm</Tag>
      ) : (
        <Tag color="red">Chưa làm</Tag>
      )
    ),
  },
  {
    title: "Ghi chú",
    key: "ghi_chu",
    render: (_, record) => record?.ghi_chu || "-",
  },
  {
    title: "Thao tác",
    key: "action",
    width: 80,
    align: "center",
    render: (_, record) => (
      <Button
        type="primary"
        className="!bg-[#3366cc]"
        icon={<EyeOutlined />}
        size="small"
        onClick={() => onOpenDetail(record)}
      />
    ),
  },
];

export const getChoDuyetLyThuyetColumns = ({ pagination, onOpenDetail, handleDuyet, handleHuyDuyet, canEdit }) => [
  {
    title: "#",
    key: "stt",
    width: 35,
    align: "center",
    render: (_, __, index) => (pagination.page - 1) * pagination.limit + index + 1,
  },
  {
    title: "Học viên",
    key: "hoc_vien",
    width: 310,
    render: (_, record) => <HocVienInfo record={record} />,
  },
  {
    title: "CCCD",
    key: "cccd",
    width: 120,
    align: "center",
    render: (_, record) => record.cccd || "-",
  },
  {
    title: "Ngày sinh",
    key: "ngay_sinh",
    width: 100,
    align: "center",
    render: (_, record) => {
      const date = record.ngay_sinh;
      return date ? dayjs(date).format("DD/MM/YYYY") : "-";
    },
  },
  {
    title: "Khóa",
    key: "khoa",
    width: 100,
    align: "center",
    render: (_, record) => record.khoa || "-",
  },
  {
    title: "Giáo viên",
    key: "giao_vien",
    width: 200,
    render: (_, record) => record.giao_vien || "-",
  },
  {
    title: "Trạng thái",
    key: "trang_thai",
    align: "center",
    width: 100,
    render: (_, record) => renderTrangThaiHocBu(record.trang_thai),
  },
  {
    title: "Trạng thái học bù",
    key: "trang_thai_ly_thuyet",
    align: "center",
    width: 140,
    render: (_, record) => renderTrangThaiHocBu(record.trang_thai_ly_thuyet),
  },
  {
    title: "Thời gian đăng ký bù",
    key: "created_at",
    width: 180,
    align: "center",
    render: (_, record) => (
      <span>
        {dayjs(record.created_at).format("DD/MM/YYYY HH:mm:ss")}
      </span>
    ),
  },
  {
    title: "Thao tác",
    key: "action",
    width: 100,
    align: "center",
    render: (_, record) => {
      const isChoDuyet = String(record?.trang_thai_ly_thuyet) === "1";
      const isDaDuyet = String(record?.trang_thai_ly_thuyet) === "2";
      return (
        <Space>
          <Button
            type="primary"
            className="!bg-[#3366cc]"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => onOpenDetail(record)}
          />
          {isChoDuyet && (
            <Popconfirm
              title="Duyệt học bù"
              description="Bạn có chắc chắn muốn duyệt không?"
              onConfirm={() => handleDuyet(record.id, record)}
              okText="Có"
              cancelText="Không"
              disabled={!canEdit}
            >
              <Button
                type="primary"
                className="!bg-green-600 hover:!bg-green-700 border-none"
                icon={<CheckOutlined />}
                size="small"
                disabled={!canEdit}
              />
            </Popconfirm>
          )}
          {isDaDuyet && (
            <Popconfirm
              title="Hủy duyệt học bù"
              description="Bạn có chắc chắn muốn hủy duyệt không?"
              onConfirm={() => handleHuyDuyet(record.id, record)}
              okText="Có"
              cancelText="Không"
              disabled={!canEdit}
            >
              <Button
                type="primary"
                className="!bg-red-500 hover:!bg-red-600 border-none"
                icon={<CloseOutlined />}
                size="small"
                disabled={!canEdit}
              />
            </Popconfirm>
          )}
        </Space>
      );
    },
  },
];
