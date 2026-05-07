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
    Modal,
} from "antd";
import { EyeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuChoDuyet, updateHocBuStatus } from "../../../apis/apiHocbu";
import dayjs from "dayjs";
import { Typography } from 'antd'
import { optionLopLyThuyet } from "../../../apis/apiLyThuyetLocal";
import StudentMakeUpDetailDrawer from "../StudentMakeUpDetailDrawer";

const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const DanhSachHocVienBuThucHanh = () => {
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [trangThaiHocBu, setTrangThaiHocBu] = useState([1, 2]);
    const [loai, setLoai] = useState(["theory", "practice"]);

    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        search: "",
        trang_thai: [2, 3],
        trang_thai_hoc_bu: [1, 2],
        loai: [1, 2, 3],
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const handleUpdateStatus = (record) => {
        Modal.confirm({
            title: "Xác nhận đăng ký học bù",
            content: `Bạn có chắc chắn muốn đăng ký học bù cho học viên "${record.ho_ten || record.student?.ho_ten}" không?`,
            okText: "Xác nhận",
            cancelText: "Hủy",
            onOk: async () => {
                const userName = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
                const payload = {
                    id: record.id,
                    trang_thai: 2,
                    nguoi_update: userName,
                    updated_at: new Date().toISOString(),
                    trang_thai_hoc_bu: 1
                };
                try {
                    await updateHocBuStatus(payload);
                    message.success("Cập nhật trạng thái học bù thành công!");
                    refetchStudents();
                } catch (error) {
                    message.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
                }
            }
        });
    };

    const handleBulkUpdateStatus = () => {
        if (!selectedRowKeys.length) return;
        Modal.confirm({
            title: "Xác nhận đăng ký học bù hàng loạt",
            content: `Bạn có chắc chắn muốn đăng ký học bù cho ${selectedRowKeys.length} học viên đã chọn không?`,
            okText: "Xác nhận",
            cancelText: "Hủy",
            onOk: async () => {
                const userName = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
                try {
                    const selectedStudents = students.filter(item => selectedRowKeys.includes(item.id || item.ma_dk));
                    await Promise.all(selectedStudents.map(async (st) => {
                        const payload = {
                            id: st.id,
                            trang_thai: 2,
                            nguoi_update: userName,
                            updated_at: new Date().toISOString(),
                            trang_thai_hoc_bu: 1
                        };
                        await updateHocBuStatus(payload);
                    }));
                    message.success("Đăng ký học bù cho các học viên được chọn thành công!");
                    setSelectedRowKeys([]);
                    refetchStudents();
                } catch (error) {
                    message.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
                }
            }
        });
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
            getDanhSachHocVienHocBuChoDuyet({
                ma_khoa: appliedFilters.ma_khoa,
                search: appliedFilters.search,
                trang_thai: appliedFilters.trang_thai,
                trang_thai_hoc_bu: appliedFilters.trang_thai_hoc_bu,
                loai: appliedFilters.loai,
                page: pagination.page,
                limit: pagination.limit,
            }),
        keepPreviousData: true,
    });

    const students = useMemo(() => {
        const list = normalizeApiList(studentData);
        return list.filter((item) => {
            const st = item?.trang_thai ?? item?.student?.trang_thai;
            const stHocBu = item?.student?.trang_thai_hoc_bu ?? item?.trang_thai_hoc_bu;
            const itemLoai = item?.loai ?? item?.student?.loai;

            // Match appliedFilters.trang_thai
            const matchTrangThai = appliedFilters.trang_thai && appliedFilters.trang_thai.length > 0
                ? appliedFilters.trang_thai.some((val) => String(val) === String(st))
                : (String(st) === "2" || String(st) === "3");

            // Match appliedFilters.trang_thai_hoc_bu
            const matchTrangThaiHocBu = appliedFilters.trang_thai_hoc_bu && appliedFilters.trang_thai_hoc_bu.length > 0
                ? appliedFilters.trang_thai_hoc_bu.some((val) => String(val) === String(stHocBu))
                : true;

            // Match appliedFilters.loai
            const matchLoai = appliedFilters.loai && appliedFilters.loai.length > 0
                ? appliedFilters.loai.some((val) => String(val) === String(itemLoai))
                : true;

            // Match appliedFilters search text locally
            const kw = (appliedFilters.search || appliedFilters.text || "").trim().toLowerCase();
            const s = item?.student || item;
            const matchSearch = kw
                ? (String(s?.ho_ten || "").toLowerCase().includes(kw) || String(s?.ma_dk || "").toLowerCase().includes(kw) || String(s?.cccd || "").toLowerCase().includes(kw))
                : true;

            return matchTrangThai && matchTrangThaiHocBu && matchLoai && matchSearch;
        });
    }, [studentData, appliedFilters]);

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
        setTrangThaiHocBu([1, 2]);
        setLoai(["theory", "practice"]);
        setAppliedFilters({
            ma_khoa: null,
            text: "",
            trang_thai: [2, 3],
            trang_thai_hoc_bu: [1, 2],
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
            render: (value) => {
                if (!value) return <span className="text-gray-400 italic">Thiếu dữ liệu HV</span>;

                return (
                    <Space>
                        <Image
                            src={value.anh}
                            width={40}
                            height={40}
                            className="rounded-md"
                            fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
                        />
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">{value.ho_ten}</span>
                            <Typography.Text
                                className="!text-[12px]"
                                copyable={{ text: value.ma_dk }}
                            >
                                {value.ma_dk}
                            </Typography.Text>
                        </div>
                    </Space>
                );
            },
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
            width: 90,
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
            width: 100,
            align: "center",
            render: (_, record) => record.xe_b1 || "-",
        },
        {
            title: "Xe B2",
            key: "xe_b2",
            width: 100,
            align: "center",
            render: (_, record) => record.xe_b2 || "-",
        },
        {
            title: "Cabin",
            key: "cabin_status",
            width: 80,
            align: "center",
            render: (_, record) => {
                const cabin = record.detail?.cabinInfo;
                const isPass = (cabin?.tong_bai || 0) >= 8 && (cabin?.tong_thoi_gian || 0) >= 150;
                return (
                    <Tag color={isPass ? "green" : "red"}>
                        {isPass ? "Đạt" : "Chưa đạt"}
                    </Tag>
                );
            }
        },
        {
            title: "Tổng quãng đường",
            key: "tong_quang_duong",
            width: 120,
            align: "center",
            render: (_, record) => (
                <span className="font-medium">
                    {record.detail?.datInfo?.tong_quang_duong || 0} km
                </span>
            ),
        },
        {
            title: "Tổng thời gian",
            key: "tong_thoi_gian",
            width: 95,
            align: "center",
            render: (_, record) => (
                <span className="font-medium">
                    {record.detail?.datInfo?.tong_thoi_gian || "-"}
                </span>
            ),
        },
        {
            title: "Trạng thái học bù",
            key: "trang_thai_hoc_bu",
            align: "center",
            width: 100,
            render: (_, record) => {
                const val = record.student?.trang_thai_hoc_bu ?? record.trang_thai_hoc_bu;
                if (val === null || val === undefined) {
                    return <Tag variant="solid" color="default">Chưa học bù</Tag>;
                }
                const numVal = Number(val);
                if (isNaN(numVal)) {
                    return <Tag variant="solid" color="default">Chưa học bù</Tag>;
                }
                if (numVal === 1) {
                    return <Tag variant="solid" color="orange">Đang đăng ký</Tag>;
                }
                if (numVal >= 2) {
                    return <Tag variant="solid" color="green">Lần {numVal - 1}</Tag>;
                }
                return <Tag variant="solid" color="default">Chưa học bù</Tag>;
            },
        },
        // {
        //     title: "Thời gian đăng ký học bù",
        //     key: "created_at",
        //     width: 180,
        //     align: "center",
        //     render: (_, record) => (
        //         <span >
        //             {dayjs(record.created_at).format("DD/MM/YYYY HH:mm:ss")}
        //         </span>
        //     ),
        // },
        {
            title: "Thao tác",
            key: "action",
            width: 80,
            align: "left",
            render: (_, record) => {
                const hasKhoaBuAndThoiGian = String(record.student?.trang_thai_hoc_bu ?? record.trang_thai_hoc_bu) === "1";
                return (
                    <Space>
                        <Button
                            type="primary"
                            className="!bg-[#3366cc]"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleOpenDetail(record)}
                        />
                        {!hasKhoaBuAndThoiGian && (
                            <Button
                                type="primary"
                                className="!bg-[#52c41a]"
                                icon={<PlusCircleOutlined />}
                                size="small"
                                onClick={() => handleUpdateStatus(record)}
                            />
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Danh sách học bù thực hành
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
                    <Col xs={24} sm={12} md={10} lg={6}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Trạng thái học bù
                        </label>
                        <div className="mt-[6px]">
                            <Checkbox.Group
                                value={trangThaiHocBu}
                                onChange={setTrangThaiHocBu}
                                options={[
                                    { label: "Đang đăng ký", value: 1 },
                                    { label: "Đã đăng ký (Lần 1,2)", value: 2 },
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
                                onClick={handleBulkUpdateStatus}
                                className="!bg-[#3366cc] !text-white"
                                disabled={selectedRowKeys.length === 0}
                            >
                                Đăng ký học bù ({selectedRowKeys.length})
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Table
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys, selectedRows) => {
                        const teachers = selectedRows.map(st => st?.thay_giao).filter(Boolean);
                        const hasDuplicate = teachers.some((t, index) => teachers.indexOf(t) !== index);
                        if (hasDuplicate) {
                            message.warning("Mỗi thầy giáo chỉ được chọn tối đa 1 học viên trong cùng một lớp học bù!");
                            return;
                        }
                        setSelectedRowKeys(keys);
                    },
                    getCheckboxProps: (record) => {
                        const isCabinApproved = !!record.trang_thai_duyet?.[1];
                        const isDatApproved = !!record.trang_thai_duyet?.[2];

                        const isEligible = isCabinApproved || isDatApproved;
                        const isRegistered = String(record.student?.trang_thai_hoc_bu ?? record.trang_thai_hoc_bu) === "1";

                        const currentKey = record.id || record.ma_dk;
                        const selectedStudents = students.filter(st =>
                            selectedRowKeys.includes(st.id || st.ma_dk) && (st.id || st.ma_dk) !== currentKey
                        );
                        const selectedTeachers = selectedStudents.map(st => st.thay_giao).filter(Boolean);
                        const hasSameTeacherSelected = record.thay_giao && selectedTeachers.includes(record.thay_giao);

                        return {
                            disabled: !isEligible || hasSameTeacherSelected || isRegistered,
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

        </div>
    );
};

export default DanhSachHocVienBuThucHanh;
