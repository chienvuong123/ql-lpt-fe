import React, { useMemo, useState } from "react";
import { Table, Select, Col, Modal, message, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { CheckCircleOutlined } from "@ant-design/icons";
import { getDanhSachHocVienHocBuChoDuyetThucHanh } from "../../../apis/apiHocbu";
import StudentMakeUpDetailDrawer from "../../make-up-lessons/StudentMakeUpDetailDrawer";
import HocBuFilterCard from "./HocBuFilterCard";
import { getChoDuyetColumns } from "./HocBuDatColumns";
import { filterByTrangThaiHocBu, normalizeApiList } from "./hocBuUtils";
import { TRANG_THAI_HOC_BU_MAP, TRANG_THAI_THUC_HANH_MAP } from "../../../constants";
import { useHocBuFilter } from "./hooks/useHocBuFilter";
import { useHocBuActions } from "../../../components/hooks/useHocBuActions";
import { useTableHeight } from "../../../components/hooks/useTableHeight";

const DEFAULT_FILTERS = { ma_khoa: null, text: "", trang_thai: [], trang_thai_hoc_bu: [] };

const ChoDuyetHocBuTab = ({ isLoadingKhoaHoc, courseOptions }) => {
    const [tableRef, tableHeight] = useTableHeight();
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [modal, contextHolder] = Modal.useModal();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isSelectingAllPages, setIsSelectingAllPages] = useState(false);
    const [totalValidKeys, setTotalValidKeys] = useState(-1);
    const [selectedStudentMap, setSelectedStudentMap] = useState({});

    const { pagination, setPagination, appliedFilters, tempFilters, setTempFilter, applyFilter, resetFilter } =
        useHocBuFilter(DEFAULT_FILTERS);

    const { data: studentData, isFetching, refetch } = useQuery({
        queryKey: ["hocVienHocBuChoDuyetDat", appliedFilters, pagination],
        queryFn: () => getDanhSachHocVienHocBuChoDuyetThucHanh({ loai_thuc_hanh: "dat", ...appliedFilters, ...pagination }),
        keepPreviousData: true,
    });

    const handleToggleSelectAllPages = async (checked) => {
        if (!checked) {
            setSelectedRowKeys([]);
            setSelectedStudentMap({});
            return;
        }

        setIsSelectingAllPages(true);
        try {
            message.loading({ content: 'Đang tải toàn bộ dữ liệu...', key: 'selectAll' });
            const res = await getDanhSachHocVienHocBuChoDuyetThucHanh({
                loai_thuc_hanh: "dat",
                ma_khoa: appliedFilters.ma_khoa,
                text: appliedFilters.text,
                page: 1,
                limit: 10000,
            });
            const list = normalizeApiList(res);
            const validRecords = list.filter(record => ["1", "4"].includes(String(record.trang_thai)));
            const validKeys = validRecords.map(record => record.id || record.ma_dk);

            setSelectedRowKeys(validKeys);
            setTotalValidKeys(validKeys.length);
            
            const newMap = {};
            validRecords.forEach(r => { newMap[r.id || r.ma_dk] = r; });
            setSelectedStudentMap(newMap);

            message.success({ content: `Đã chọn ${validKeys.length} bản ghi`, key: 'selectAll' });
        } catch (error) {
            message.error({ content: 'Có lỗi xảy ra khi chọn tất cả', key: 'selectAll' });
        } finally {
            setIsSelectingAllPages(false);
        }
    };

    const handleToggleSelectRecord = (record, checked) => {
        const rowKey = record.id || record.ma_dk;
        if (!rowKey) return;

        setSelectedRowKeys((prev) =>
            checked ? Array.from(new Set([...prev, rowKey])) : prev.filter((key) => key !== rowKey),
        );

        setSelectedStudentMap(prev => {
            const next = { ...prev };
            if (checked) next[rowKey] = record; else delete next[rowKey];
            return next;
        });
    };

    const students = useMemo(() =>
        filterByTrangThaiHocBu(normalizeApiList(studentData), appliedFilters.trang_thai_hoc_bu),
        [studentData, appliedFilters]
    );

    const totalItems = studentData?.total || studentData?.pagination?.total || 0;
    
    const currentTotal = totalValidKeys !== -1 ? totalValidKeys : totalItems;
    const isAllSelected = currentTotal > 0 && selectedRowKeys.length >= currentTotal;
    const isIndeterminate = selectedRowKeys.length > 0 && !isAllSelected;

    const { handleDuyet, handleHuyDuyet, handleBulkDuyetThucHanh } = useHocBuActions(() => {
        refetch();
        setSelectedRowKeys([]);
        setSelectedStudentMap({});
    });

    const onBulkDuyet = React.useCallback(() => {
        if (!selectedRowKeys.length) return;
        const selectedRecords = selectedRowKeys.map(key => selectedStudentMap[key]).filter(Boolean);
        if (!selectedRecords.length) return;

        modal.confirm({
            title: "Xác nhận duyệt học bù hàng loạt",
            content: `Bạn có chắc muốn duyệt học bù cho ${selectedRecords.length} học viên đã chọn?`,
            okText: "Xác nhận",
            cancelText: "Hủy",
            centered: true,
            onOk: async () => {
                await handleBulkDuyetThucHanh(selectedRecords, "dat");
            },
        });
    }, [selectedRowKeys, selectedStudentMap, handleBulkDuyetThucHanh, modal]);

    const columns = getChoDuyetColumns({
        pagination,
        onOpenDetail: (record) => { setSelectedStudent(record); setIsDetailOpen(true); },
        handleDuyet,
        handleHuyDuyet,
        selectionConfig: {
            isAllSelected,
            isIndeterminate,
            isFetching,
            isSelectingAllPages,
            handleToggleSelectAllPages,
            selectedRowKeys,
            handleToggleSelectRecord,
        }
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
            {contextHolder}
            <HocBuFilterCard
                maKhoa={tempFilters.ma_khoa} setMaKhoa={(v) => setTempFilter("ma_khoa", v)}
                searchText={tempFilters.text} setSearchText={(v) => setTempFilter("text", v)}
                onApply={applyFilter} onReset={resetFilter}
                isLoadingKhoaHoc={isLoadingKhoaHoc} courseOptions={courseOptions}
                extraFilters={extraFilters}
            />
            <div className="flex mb-3">
                <Button
                    type="primary"
                    className="!bg-green-600 hover:!bg-green-700 border-none"
                    icon={<CheckCircleOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={onBulkDuyet}
                >
                    Duyệt ({selectedRowKeys.length})
                </Button>
            </div>
            <div ref={tableRef}>
                <Table
                    columns={columns} dataSource={students} rowKey={(r) => r.id || r.ma_dk}
                    loading={isFetching}
                    pagination={{ current: pagination.page, pageSize: pagination.limit, total: totalItems, showSizeChanger: true, onChange: (page, limit) => setPagination({ page, limit }) }}
                    size="small" scroll={{ x: 1300, y: tableHeight }} bordered className="table-blue-header"
                />
            </div>
            <StudentMakeUpDetailDrawer open={isDetailOpen} onClose={() => setIsDetailOpen(false)} student={selectedStudent} />
        </div>
    );
};

export default ChoDuyetHocBuTab;