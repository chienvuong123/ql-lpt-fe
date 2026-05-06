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
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Typography } from 'antd'
import { optionLopLyThuyet } from "../../../apis/apiLyThuyetLocal";
import { getDanhSachHocVienHocBuDangHocBu } from "../../../apis/apiHocbu";
import StudentMakeUpDetailDrawer from "../StudentMakeUpDetailDrawer";

const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const DanhSachDaDuyetThucHanh = () => {
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [trangThai, setTrangThai] = useState([2, 3]);
    const [trangThaiHocBu, setTrangThaiHocBu] = useState([]);
    const [loai, setLoai] = useState([]);

    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        search: "",
        trang_thai: [2, 3],
        trang_thai_hoc_bu: [],
        loai: [],
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);



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
            "hocVienHocBuDangHocBu",
            appliedFilters.ma_khoa,
            appliedFilters.search,
            appliedFilters.trang_thai,
            appliedFilters.trang_thai_hoc_bu,
            appliedFilters.loai,
            pagination.page,
            pagination.limit,
        ],
        queryFn: () =>
            getDanhSachHocVienHocBuDangHocBu({
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
        let mappedLoai = [];
        if (loai.includes("ly_thuyet")) mappedLoai.push(1);
        if (loai.includes("thuc_hanh")) {
            mappedLoai.push(2);
            mappedLoai.push(3);
        }
        setAppliedFilters({
            ma_khoa,
            text: searchText,
            trang_thai: trangThai,
            trang_thai_hoc_bu: trangThaiHocBu,
            loai: mappedLoai,
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilter = () => {
        setMaKhoa(null);
        setSearchText("");
        setTrangThai([2, 3]);
        setTrangThaiHocBu([]);
        setLoai([]);
        setAppliedFilters({
            ma_khoa: null,
            text: "",
            trang_thai: [2, 3],
            trang_thai_hoc_bu: [],
            loai: [],
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
            width: 310,
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
            title: "Khóa học CK",
            key: "ten_khoa",
            width: 100,
            align: "center",
            render: (_, record) => record.ten_khoa || "-",
        },
        {
            title: "Khóa bù",
            key: "khoa_bu",
            width: 100,
            align: "center",
            render: (_, record) => record.khoa_bu || "-",
        },
        {
            title: "Giáo viên",
            key: "thay_giao",
            width: 180,
            render: (_, record) => record.thay_giao || "-",
        },
        {
            title: "Bắt đầu Cabin",
            key: "bat_dau_cabin",
            width: 110,
            align: "center",
            render: (_, record) => record.bat_dau_cabin ? dayjs(record.bat_dau_cabin).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Kết thúc Cabin",
            key: "ket_thuc_cabin",
            width: 110,
            align: "center",
            render: (_, record) => record.ket_thuc_cabin ? dayjs(record.ket_thuc_cabin).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Bắt đầu DAT",
            key: "bat_dau_dat",
            width: 110,
            align: "center",
            render: (_, record) => record.bat_dau_dat ? dayjs(record.bat_dau_dat).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Kết thúc DAT",
            key: "ket_thuc_dat",
            width: 110,
            align: "center",
            render: (_, record) => record.ket_thuc_dat ? dayjs(record.ket_thuc_dat).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Xe B1",
            key: "xe_b1",
            width: 110,
            align: "center",
            render: (_, record) => record.xe_b1 || "-",
        },
        {
            title: "Xe B2",
            key: "xe_b2",
            width: 110,
            align: "center",
            render: (_, record) => record.xe_b2 || "-",
        },
        {
            title: "Kết thúc môn",
            key: "kiem_tra_het_mon",
            width: 110,
            align: "center",
            render: (_, record) => record.kiem_tra_het_mon ? dayjs(record.kiem_tra_het_mon).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Trạng thái học bù",
            key: "trang_thai_hoc_bu",
            align: "center",
            width: 140,
            render: (_, record) => {
                const st = record.student?.trang_thai_hoc_bu ?? record.trang_thai_hoc_bu;
                if (String(st) === "1") {
                    return <Tag color="red">Chưa đăng ký</Tag>;
                }
                if (String(st) === "2") {
                    return <Tag color="blue">Đã đăng ký</Tag>;
                }
                return <Tag color="default">Chưa đăng ký</Tag>;
            },
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
                    Học viên đang học bù
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
                    <Col xs={24} sm={10} md={8} lg={4}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Trạng thái
                        </label>
                        <Select
                            className="w-full"
                            mode="multiple"
                            placeholder="Chọn trạng thái"
                            value={trangThai}
                            onChange={setTrangThai}
                            allowClear
                            maxTagCount="responsive"
                            options={[
                                { label: "Chờ duyệt", value: 2 },
                                { label: "Đã duyệt", value: 3 },
                            ]}
                        />
                    </Col>
                    <Col xs={24} sm={10} md={8} lg={4}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Trạng thái học bù
                        </label>
                        <Select
                            className="w-full"
                            mode="multiple"
                            placeholder="Chọn trạng thái"
                            value={trangThaiHocBu}
                            onChange={setTrangThaiHocBu}
                            allowClear
                            maxTagCount="responsive"
                            options={[
                                { label: "Chưa đăng ký", value: 1 },
                                { label: "Đã đăng ký", value: 2 },
                            ]}
                        />
                    </Col>
                    <Col xs={24} sm={10} md={8} lg={4}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Loại học bù
                        </label>
                        <Select
                            className="w-full"
                            mode="multiple"
                            placeholder="Chọn loại học bù"
                            value={loai}
                            onChange={setLoai}
                            allowClear
                            maxTagCount="responsive"
                            options={[
                                { label: "Lý thuyết", value: "ly_thuyet" },
                                { label: "Thực hành", value: "thuc_hanh" },
                            ]}
                        />
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
            </Card>

            <Table
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
                scroll={{ x: 1800 }}
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

export default DanhSachDaDuyetThucHanh;
