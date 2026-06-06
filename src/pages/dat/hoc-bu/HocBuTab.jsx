import React, { useMemo, useState } from "react";
import { Table, Button, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuDat } from "../../../apis/apiHocbu";
import HocBuFilterCard from "./HocBuFilterCard";
import dayjs from "dayjs";
import DATDetailModal from "../DATDetailModal";
import { getHocBuDatColumns } from "./HocBuDatColumns";
import { useHocBuFilter } from "./hooks/useHocBuFilter";
import { normalizeApiList } from "./hocBuUtils";
import { formatMinutesToHM } from "../../../util/helper";
import { useTableHeight } from "../../../components/hooks/useTableHeight";

const DEFAULT_FILTERS = { ma_khoa: null, text: "" };

const HocBuTab = ({ isLoadingKhoaHoc, courseOptions }) => {
    const [tableRef, tableHeight] = useTableHeight();
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const { pagination, setPagination, appliedFilters, tempFilters, setTempFilter, applyFilter, resetFilter } =
        useHocBuFilter(DEFAULT_FILTERS);

    const { data: studentData, isFetching } = useQuery({
        queryKey: ["hocVienHocBuDat", appliedFilters, pagination],
        queryFn: () => getDanhSachHocVienHocBuDat({ loai_thuc_hanh: "dat", ...appliedFilters, ...pagination }),
        keepPreviousData: true,
    });

    const students = useMemo(() => normalizeApiList(studentData), [studentData]);
    const totalItems = studentData?.total || studentData?.pagination?.total || 0;

    const extraColumns = [
        {
            title: "Km đã học", key: "tong_quang_duong", width: 110, align: "center",
            render: (_, r) => (
                <span className="font-medium text-blue-600">{r.tong_quang_duong || 0} km</span>
            ),
        },
        {
            title: "Thời gian học", key: "tong_thoi_gian", width: 140, align: "center",
            render: (_, r) => (
                <span className="font-medium text-orange-600">{formatMinutesToHM(r.tong_thoi_gian)}</span>
            ),
        },
        {
            title: "Thời gian đăng ký", key: "created_at", width: 160, align: "center",
            render: (_, r) => dayjs(r.created_at).format("DD/MM/YYYY HH:mm:ss"),
        },
        {
            title: "Thao tác", key: "action", width: 80, align: "center",
            render: (_, record) => (
                <Button type="primary" className="!bg-[#3366cc]" icon={<EyeOutlined />} size="small"
                    onClick={() => { setSelectedStudent(record); setIsDetailOpen(true); }}
                />
            ),
        },
    ];

    const columns = [...getHocBuDatColumns({ pagination }), ...extraColumns];

    return (
        <div>
            <HocBuFilterCard
                maKhoa={tempFilters.ma_khoa} setMaKhoa={(v) => setTempFilter("ma_khoa", v)}
                searchText={tempFilters.text} setSearchText={(v) => setTempFilter("text", v)}
                onApply={applyFilter} onReset={resetFilter}
                isLoadingKhoaHoc={isLoadingKhoaHoc} courseOptions={courseOptions}
            />
            <div ref={tableRef}>
                <Table
                    columns={columns} dataSource={students}
                    rowKey={(r) => r.id || r.ma_dk} loading={isFetching}
                    pagination={{
                        current: pagination.page, pageSize: pagination.limit,
                        total: totalItems, showSizeChanger: true,
                        onChange: (page, limit) => setPagination({ page, limit }),
                    }}
                    size="small" scroll={{ x: 1300, y: tableHeight }} bordered className="table-blue-header"
                />
            </div>
            <DATDetailModal
                visible={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                student={selectedStudent}
            />
        </div>
    );
};

export default HocBuTab;