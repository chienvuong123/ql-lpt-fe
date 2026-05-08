import React, { useMemo, useState } from "react";
import {
    Table,
    Button,
    Input,
    Select,
    Row,
    Col,
    Card,
    Image,
    Tag,
    Space,
    message,
    Checkbox,
} from "antd";
import { EyeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBu, updateHocBuStatus } from "../../../apis/apiHocbu";
import dayjs from "dayjs";
import { Typography } from 'antd'
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

const DanhSachChoDuyetHocBuThucHanh = () => {
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [trangThaiHocBu, setTrangThaiHocBu] = useState([1]);
    const [loai, setLoai] = useState(["theory", "practice"]);

    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        search: "",
        trang_thai: [2, 3],
        trang_thai_hoc_bu: [1],
        loai: [1, 2, 3],
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
                    trang_thai_hoc_bu: 2,
                    khoa_bu: values.ma_khoa,
                    thoi_gian_xep: new Date().toISOString(),
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
            appliedFilters.trang_thai,
            appliedFilters.trang_thai_hoc_bu,
            appliedFilters.loai,
            pagination.page,
            pagination.limit,
        ],
        queryFn: () =>
            getDanhSachHocVienHocBu({
                ma_khoa: appliedFilters.ma_khoa,
                search: appliedFilters.search,
                loai: "thuc_hanh",
                theory_status: "passed",
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
        let selectedLoai = [];
        if (loai && loai.includes("theory")) {
            selectedLoai.push(1);
        }
        if (loai && loai.includes("practice")) {
            selectedLoai.push(2, 3);
        }
        if (selectedLoai.length === 0) {
            selectedLoai = [1, 2, 3];
        }

        setAppliedFilters({
            ma_khoa,
            text: searchText,
            trang_thai: [2, 3],
            trang_thai_hoc_bu: trangThaiHocBu,
            loai: selectedLoai,
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilter = () => {
        setMaKhoa(null);
        setSearchText("");
        setTrangThaiHocBu([1]);
        setLoai(["theory", "practice"]);
        setAppliedFilters({
            ma_khoa: null,
            text: "",
            trang_thai: [2, 3],
            trang_thai_hoc_bu: [1],
            loai: [1, 2, 3],
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
            key: "ten_khoa",
            width: 100,
            align: "center",
            render: (_, record) => record.ten_khoa || "-",
        },
        {
            title: "Giáo viên",
            key: "thay_giao",
            width: 180,
            render: (_, record) => record.thay_giao || "-",
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
            title: "Cabin",
            key: "cabin_status",
            width: 100,
            align: "center",
            render: (_, record) => {
                const isDuyet = record.trang_thai_duyet?.[1];
                return (
                    <Tag color={isDuyet ? "green" : "orange"}>
                        {isDuyet ? "Đã duyệt" : "Chờ duyệt"}
                    </Tag>
                );
            }
        },
        {
            title: "DAT",
            key: "dat_status",
            width: 100,
            align: "center",
            render: (_, record) => {
                const isDuyet = record.trang_thai_duyet?.[2];
                return (
                    <Tag color={isDuyet ? "green" : "orange"}>
                        {isDuyet ? "Đã duyệt" : "Chờ duyệt"}
                    </Tag>
                );
            }
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
                    <Col xs={24} sm={12} md={10} lg={4}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Trạng thái học bù
                        </label>
                        <div className="mt-[6px]">
                            <Checkbox.Group
                                value={trangThaiHocBu}
                                onChange={setTrangThaiHocBu}
                                options={[
                                    { label: "Đang đăng ký", value: 1 },
                                ]}
                            />
                        </div>
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
                        const hasType1 = types.includes("1");
                        const hasType23 = types.some(t => ["2", "3"].includes(t));
                        if (hasType1 && hasType23) {
                            message.warning("Không được chọn học viên lý thuyết (loại 1) cùng với học viên thực hành (loại 2, 3) vào cùng một khóa!");
                            return;
                        }

                        if (hasType23) {
                            const teachers = selectedRows.map(st => st?.thay_giao).filter(Boolean);
                            const hasDuplicate = teachers.some((t, index) => teachers.indexOf(t) !== index);
                            if (hasDuplicate) {
                                message.warning("Mỗi thầy giáo chỉ được chọn tối đa 1 học viên trong cùng một lớp học bù!");
                                return;
                            }
                        }
                        setSelectedRowKeys(keys);
                    },
                    getCheckboxProps: (record) => {
                        const recordLoai = String(record?.loai ?? record?.student?.loai);
                        const isTheoryApproved = !!record.trang_thai_duyet?.[0];
                        const isCabinApproved = !!record.trang_thai_duyet?.[1];
                        const isDatApproved = !!record.trang_thai_duyet?.[2];

                        const isEligible = (recordLoai === "1") ? isTheoryApproved : (isCabinApproved || isDatApproved);

                        const currentKey = record.id || record.ma_dk;
                        const selectedStudents = students.filter(st =>
                            selectedRowKeys.includes(st.id || st.ma_dk) && (st.id || st.ma_dk) !== currentKey
                        );

                        // Check selected student types
                        const hasType1Selected = selectedStudents.some(st => String(st?.loai ?? st?.student?.loai) === "1");
                        const hasType23Selected = selectedStudents.some(st => ["2", "3"].includes(String(st?.loai ?? st?.student?.loai)));
                        const isTypeMismatch = (hasType1Selected && recordLoai !== "1") || (hasType23Selected && recordLoai === "1");

                        const selectedTeachers = selectedStudents.map(st => st.thay_giao).filter(Boolean);
                        const isTeacherRestricted = (recordLoai !== "1") && record.thay_giao && selectedTeachers.includes(record.thay_giao);

                        const hasKhoaBu = record.khoa_bu || record.student?.khoa_bu;
                        const hasThoiGianXep = record.thoi_gian_xep || record.student?.thoi_gian_xep;
                        const isAlreadyScheduled = hasKhoaBu && hasThoiGianXep;

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

export default DanhSachChoDuyetHocBuThucHanh;
