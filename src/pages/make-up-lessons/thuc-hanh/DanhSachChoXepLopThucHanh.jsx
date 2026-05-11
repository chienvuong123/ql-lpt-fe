import React, { useMemo, useState } from "react";
import {
    Table,
    Button,
    Input,
    Select,
    Row,
    Col,
    Card,
    Tag,
    Space,
    message,
    Checkbox,
} from "antd";
import { EyeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBu, updateHocBuStatus } from "../../../apis/apiHocbu";
import dayjs from "dayjs";
import { optionLopLyThuyet } from "../../../apis/apiLyThuyetLocal";
import StudentMakeUpDetailDrawer from "../StudentMakeUpDetailDrawer";
import TienDoHocBuModal from "../TienDoHocBuModal";
import { dongBoTienDoDaoTaoSql } from "../../../apis/apiSynch";
import { renderTrangThaiHocBu } from "../../../constants/hocBuConstants";
import HocVienInfo from "../../../components/HocVienInfor";

const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const DanhSachChoXepLopThucHanh = () => {
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [loai, setLoai] = useState(["theory", "practice"]);

    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        search: "",
        loai: undefined,
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

    const [isSavingCourse, setIsSavingCourse] = useState(false);

    const handleCourseSubmit = async (values) => {
        const userName = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
        const payload = {
            ...values,
            loai: 1,
            luu_luong: selectedRowKeys.length,
            created_by: userName,
            updated_by: userName,
        };

        setIsSavingCourse(true);
        try {
            await dongBoTienDoDaoTaoSql(payload);

            const selectedStudents = students.filter(item => selectedRowKeys.includes(item.id || item.ma_dk));
            await Promise.all(selectedStudents.map(async (st) => {
                await updateHocBuStatus({
                    ...st,
                    trang_thai: 6,
                    trang_thai_thuc_hanh: 3,
                    khoa_bu_thuc_hanh: values.ma_khoa,
                    thoi_gian_xep_thuc_hanh: new Date().toISOString(),
                });
            }));

            message.success('Thêm mới tiến độ thành công');
            setIsCourseModalOpen(false);
            setSelectedRowKeys([]);
            refetchStudents?.();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
        } finally {
            setIsSavingCourse(false);
        }
    };

    // 1. Lấy danh sách khóa học
    const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
        queryKey: ["optionLopLyThuyet"],
        queryFn: () => optionLopLyThuyet(),
        staleTime: 1000 * 60 * 10,
    });

    const courseOptions = useMemo(() => {
        const list = normalizeApiList(dataKhoaHoc);
        return list.map((item) => ({
            label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
            value: item?.code,
        }));
    }, [dataKhoaHoc]);

    // 2. Lấy danh sách học viên cần bù
    const { data: studentData, isFetching: isFetchingStudents, refetch: refetchStudents } = useQuery({
        queryKey: [
            "hocVienHocBuChoDuyet",
            appliedFilters.ma_khoa,
            appliedFilters.search,
            appliedFilters.loai,
            pagination.page,
            pagination.limit,
        ],
        queryFn: () =>
            getDanhSachHocVienHocBu({
                ma_khoa: appliedFilters.ma_khoa,
                search: appliedFilters.search,
                loai: appliedFilters.loai,
                trang_thai: 5,
                page: pagination.page,
                limit: pagination.limit,
            }),
        keepPreviousData: true,
    });

    const students = useMemo(() => {
        const list = normalizeApiList(studentData);
        return list;
    }, [studentData]);

    const totalItems = studentData?.total || studentData?.pagination?.total || 0;

    const handleApplyFilter = () => {
        let selectedLoai = undefined;
        if (loai && loai.length === 1) {
            selectedLoai = loai[0] === "theory" ? "ly_thuyet" : "thuc_hanh";
        }

        setAppliedFilters({
            ma_khoa,
            search: searchText,
            loai: selectedLoai,
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilter = () => {
        setMaKhoa(null);
        setSearchText("");
        setLoai(["theory", "practice"]);
        setAppliedFilters({
            ma_khoa: null,
            search: "",
            loai: undefined,
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleOpenDetail = (record) => {
        setSelectedStudent(record);
        setIsDetailOpen(true);
    };

    const columns = [
        {
            title: "#",
            key: "stt",
            width: 35,
            align: "center",
            render: (_, __, index) =>
                (pagination.page - 1) * pagination.limit + index + 1,
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
            width: 100,
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
                return (
                    date ? dayjs(date).format("DD/MM/YYYY") : "-"
                );
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
            width: 180,
            render: (_, record) => record.giao_vien || "-",
        },
        {
            title: "Xe B1",
            key: "xe_b1",
            width: 95,
            align: "center",
            render: (_, record) => record.xe_b1 || "-",
        },
        {
            title: "Xe B2",
            key: "xe_b2",
            width: 95,
            align: "center",
            render: (_, record) => record.xe_b2 || "-",
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
            key: "trang_thai_thuc_hanh",
            align: "center",
            width: 100,
            render: (_, record) => renderTrangThaiHocBu(record.trang_thai_thuc_hanh),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 80,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        className="!bg-[#3366cc]"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleOpenDetail(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Danh sách học chờ xếp lớp bù thực hành
                </h1>
            </div>

            <Card className="!mb-5">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={10} md={8} lg={4}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Khóa Học
                        </label>
                        <Select
                            className="w-full"
                            placeholder="Chọn khóa học"
                            loading={isLoadingKhoaHoc}
                            value={ma_khoa}
                            onChange={setMaKhoa}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={courseOptions}
                        />
                    </Col>
                    <Col xs={24} sm={10} md={8} lg={4}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Học viên / Mã DK
                        </label>
                        <Input
                            placeholder="Nhập tên hoặc mã học viên"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onPressEnter={handleApplyFilter}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={10} lg={5}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Loại học bù
                        </label>
                        <div className="mt-[6px]">
                            <Checkbox.Group
                                value={loai}
                                onChange={setLoai}
                                options={[
                                    { label: "Lý thuyết", value: "theory" },
                                    { label: "Thực hành", value: "practice" },
                                ]}
                            />
                        </div>
                    </Col>

                    <Col xs={24} sm={14} md={12} lg={4}>
                        <Space className="w-full justify-start flex-wrap">
                            <Button
                                type="primary"
                                className="!bg-[#3366cc]"
                                onClick={handleApplyFilter}
                            >
                                Tìm kiếm
                            </Button>
                            <Button onClick={handleResetFilter}>
                                Làm mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col>
                        <Space>
                            <Button
                                type="primary"
                                icon={<PlusCircleOutlined />}
                                onClick={() => setIsCourseModalOpen(true)}
                                className="!bg-[#3366cc] !text-white"
                                disabled={selectedRowKeys.length === 0}
                            >
                                Thêm vào khóa ({selectedRowKeys.length})
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Table
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys, selectedRows) => {
                        const types = selectedRows.map(st => String(st?.loai ?? st?.student?.loai)).filter(Boolean);

                        const hasLyThuyet = types.some(t => t === "ly_thuyet");
                        const hasThucHanh = types.some(t => t === "thuc_hanh");

                        if (hasLyThuyet && hasThucHanh) {
                            message.warning("Không thể xếp học viên lý thuyết cùng với học viên thực hành vào cùng một lớp!");
                            return;
                        }

                        if (hasThucHanh) {
                            const teachers = selectedRows.map(st => st?.giao_vien).filter(Boolean);
                            const hasDuplicate = teachers.some((t, index) => teachers.indexOf(t) !== index);
                            if (hasDuplicate) {
                                message.warning("Mỗi thầy giáo chỉ được chọn tối đa 1 học viên trong cùng một lớp học bù thực hành!");
                                return;
                            }
                        }
                        setSelectedRowKeys(keys);
                    },
                    getCheckboxProps: (record) => {
                        const st = record.trang_thai ?? record.student?.trang_thai;
                        const stTH = record.trang_thai_thuc_hanh ?? record.student?.trang_thai_thuc_hanh;

                        const isEligible = String(st) === "5" && String(stTH) === "2";

                        const recordLoai = String(record?.loai ?? record?.student?.loai);
                        const isTypeLyThuyet = recordLoai === "ly_thuyet";

                        const currentKey = record.id || record.ma_dk;
                        const selectedStudents = students.filter(st =>
                            selectedRowKeys.includes(st.id || st.ma_dk) && (st.id || st.ma_dk) !== currentKey
                        );

                        const hasLyThuyetSelected = selectedStudents.some(st => {
                            const t = String(st?.loai ?? st?.student?.loai);
                            return t === "ly_thuyet";
                        });
                        const hasThucHanhSelected = selectedStudents.some(st => {
                            const t = String(st?.loai ?? st?.student?.loai);
                            return t === "thuc_hanh";
                        });

                        const isTypeMismatch = (hasLyThuyetSelected && !isTypeLyThuyet) || (hasThucHanhSelected && isTypeLyThuyet);

                        const selectedTeachers = selectedStudents.map(st => st.giao_vien).filter(Boolean);
                        const isTeacherRestricted = (!isTypeLyThuyet) && record.giao_vien && selectedTeachers.includes(record.giao_vien);

                        const hasKhoaBu = record.khoa_bu_thuc_hanh || record.student?.khoa_bu_thuc_hanh || record.khoa_bu || record.student?.khoa_bu;
                        const hasThoiGianXep = record.thoi_gian_xep_thuc_hanh || record.student?.thoi_gian_xep_thuc_hanh || record.thoi_gian_xep || record.student?.thoi_gian_xep;
                        
                        const isScheduledStatus = String(st) === "3" || String(stTH) === "3";
                        const isAlreadyScheduled = isScheduledStatus || (hasKhoaBu && hasThoiGianXep);

                        return {
                            disabled: !isEligible || isTeacherRestricted || isTypeMismatch || isAlreadyScheduled,
                            name: record.ho_ten || record.student?.ho_ten,
                        };
                    }
                }}
                columns={columns}
                dataSource={students}
                rowKey={(record) => record.id || record.ma_dk}
                loading={isFetchingStudents}
                pagination={{
                    current: pagination.page,
                    pageSize: pagination.limit,
                    total: totalItems,
                    showSizeChanger: true,
                    onChange: (page, limit) => setPagination({ page, limit }),
                }}
                size="small"
                scroll={{ x: 1300 }}
                bordered
                className="table-blue-header"
                rowClassName={(record) => {
                    const graduationDate = record.be_giang || record.student?.be_giang;
                    if (!graduationDate) return "";

                    const deadline = dayjs(graduationDate).add(1, "year");
                    const today = dayjs();
                    const monthsLeft = deadline.diff(today, "month", true);

                    if (monthsLeft < 3) {
                        return "!bg-red-100 hover:!bg-red-200 transition-colors";
                    } else if (monthsLeft <= 6) {
                        return "!bg-blue-50 hover:!bg-blue-200 transition-colors";
                    }
                    return "";
                }}
            />

            <StudentMakeUpDetailDrawer
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                student={selectedStudent}
            />

            <TienDoHocBuModal
                visible={isCourseModalOpen}
                onCancel={() => setIsCourseModalOpen(false)}
                selectedCount={selectedRowKeys.length}
                onSubmit={handleCourseSubmit}
                loading={isSavingCourse}
                type="practice"
            />
        </div>
    );
};

export default DanhSachChoXepLopThucHanh;
