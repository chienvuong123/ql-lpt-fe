import React, { useMemo, useState } from "react";
import { Table, Select, Col } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuChoDuyet } from "../../../apis/apiHocbu";
import StudentMakeUpDetailDrawer from "../../make-up-lessons/StudentMakeUpDetailDrawer";
import HocBuFilterCard from "./HocBuFilterCard";
import { getChoDuyetColumns } from "./hocBuDatColumns";
import { useHocBuActions } from "./hooks/useHocBuActions";
import { filterByTrangThaiHocBu, normalizeApiList } from "./hocBuUtils";
import { TRANG_THAI_HOC_BU_MAP, TRANG_THAI_THUC_HANH_MAP } from "../../../constants";
import { useHocBuFilter } from "./hooks/useHocBuFilter";

const DEFAULT_FILTERS = { ma_khoa: null, text: "", trang_thai: [], trang_thai_hoc_bu: [] };

const ChoDuyetHocBuTab = ({ isLoadingKhoaHoc, courseOptions }) => {
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const { pagination, setPagination, appliedFilters, tempFilters, setTempFilter, applyFilter, resetFilter } =
        useHocBuFilter(DEFAULT_FILTERS);

    const { data: studentData, isFetching, refetch } = useQuery({
        queryKey: ["hocVienHocBuChoDuyetDat", appliedFilters, pagination],
        queryFn: () => getDanhSachHocVienHocBuChoDuyet({ loai: "dat", ...appliedFilters, ...pagination }),
        keepPreviousData: true,
    });

    const students = useMemo(() =>
        filterByTrangThaiHocBu(normalizeApiList(studentData), appliedFilters.trang_thai_hoc_bu),
        [studentData, appliedFilters]
    );

    const totalItems = studentData?.total || studentData?.pagination?.total || 0;
    const { handleDuyet, handleHuyDuyet } = useHocBuActions(refetch);

    const columns = getChoDuyetColumns({
        pagination,
        onOpenDetail: (record) => { setSelectedStudent(record); setIsDetailOpen(true); },
        handleDuyet,
        handleHuyDuyet,
    });

    const extraFilters = (
        <>
            <Col xs={24} sm={10} md={8} lg={5}>
                <label className="block text-xs text-gray-500 uppercase">Trạng thái</label>
                <Select className="w-full" mode="multiple" placeholder="Chọn trạng thái"
                    value={tempFilters.trang_thai} onChange={(v) => setTempFilter("trang_thai", v)}
                    allowClear maxTagCount="responsive"
                    options={Object.entries(TRANG_THAI_HOC_BU_MAP).map(([val, { label }]) => ({ label, value: Number(val) }))}
                />
            </Col>
            <Col xs={24} sm={10} md={8} lg={5}>
                <label className="block text-xs text-gray-500 uppercase">Trạng thái TH</label>
                <Select className="w-full" mode="multiple" placeholder="Chọn trạng thái TH"
                    value={tempFilters.trang_thai_hoc_bu} onChange={(v) => setTempFilter("trang_thai_hoc_bu", v)}
                    allowClear maxTagCount="responsive"
                    options={Object.entries(TRANG_THAI_THUC_HANH_MAP).map(([val, { label }]) => ({ label, value: Number(val) }))}
                />
            </Col>
        </>
    );

    return (
        <div>
            <HocBuFilterCard
                maKhoa={tempFilters.ma_khoa} setMaKhoa={(v) => setTempFilter("ma_khoa", v)}
                searchText={tempFilters.text} setSearchText={(v) => setTempFilter("text", v)}
                onApply={applyFilter} onReset={resetFilter}
                isLoadingKhoaHoc={isLoadingKhoaHoc} courseOptions={courseOptions}
                extraFilters={extraFilters}
            />
            <Table
                columns={columns} dataSource={students} rowKey={(r) => r.id || r.ma_dk}
                loading={isFetching}
                pagination={{ current: pagination.page, pageSize: pagination.limit, total: totalItems, showSizeChanger: true, onChange: (page, limit) => setPagination({ page, limit }) }}
                size="small" scroll={{ x: 1300 }} bordered className="table-blue-header"
            />
            <StudentMakeUpDetailDrawer open={isDetailOpen} onClose={() => setIsDetailOpen(false)} student={selectedStudent} />
        </div>
    );
};

export default ChoDuyetHocBuTab;