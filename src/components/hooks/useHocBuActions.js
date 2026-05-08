import { message } from "antd";
import { updateHocBuStatus } from "../../apis/apiHocbu";

const getUsername = () =>
    sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";

export const useHocBuActions = (refetch) => {

    // Tạo đơn học bù lý thuyết
    const handleTaoDonLyThuyet = async (data) => {
        try {
            await updateHocBuStatus({
                ...data,
                loai: "ly_thuyet",
                trang_thai: 1,
                trang_thai_ly_thuyet: 1,
                trang_thai_thuc_hanh: data?.trang_thai_thuc_hanh || null,
                nguoi_tao: getUsername(),
                created_at: new Date().toISOString(),
            });
            message.success("Tạo đơn học bù lý thuyết thành công!");
            refetch();
        } catch {
            message.error("Tạo đơn học bù lý thuyết thất bại!");
        }
    };

    // Tạo đơn học bù thực hành (cabin/dat)
    const handleTaoDonThucHanh = async (data) => {
        try {
            await updateHocBuStatus({
                ...data,
                loai: data?.loai || "cabin",
                trang_thai: 4,
                trang_thai_thuc_hanh: 1,
                trang_thai_ly_thuyet: data?.trang_thai_ly_thuyet || null,
                nguoi_tao: getUsername(),
                created_at: new Date().toISOString(),
            });
            message.success("Tạo đơn học bù thực hành thành công!");
            refetch();
        } catch {
            message.error("Tạo đơn học bù thực hành thất bại!");
        }
    };

    // Duyệt lý thuyết: trang_thai 1 -> 2
    const handleDuyetLyThuyet = async (recordId, record) => {
        try {
            await updateHocBuStatus({
                id: recordId,
                trang_thai: 2,
                trang_thai_ly_thuyet: 2,
                nguoi_duyet_ly_thuyet: getUsername(),
                thoi_gian_duyet_ly_thuyet: new Date().toISOString(),
                nguoi_update: getUsername(),
                updated_at: new Date().toISOString(),
            });
            message.success("Duyệt lý thuyết thành công!");
            refetch();
        } catch {
            message.error("Duyệt lý thuyết thất bại!");
        }
    };

    // Hủy duyệt lý thuyết: trang_thai 2 -> 1
    const handleHuyDuyetLyThuyet = async (recordId) => {
        try {
            await updateHocBuStatus({
                id: recordId,
                trang_thai: 1,
                trang_thai_ly_thuyet: 1,
                nguoi_duyet_ly_thuyet: null,
                thoi_gian_duyet_ly_thuyet: null,
                nguoi_update: getUsername(),
                updated_at: new Date().toISOString(),
            });
            message.success("Hủy duyệt lý thuyết thành công!");
            refetch();
        } catch {
            message.error("Hủy duyệt lý thuyết thất bại!");
        }
    };

    // Duyệt thực hành: trang_thai 4 -> 5, trang_thai_thuc_hanh 1 -> 2
    const handleDuyetThucHanh = async (recordId, record, loaiThucHanh) => {
        try {
            await updateHocBuStatus({
                id: recordId,
                trang_thai: 5,
                trang_thai_thuc_hanh: 2,
                loai_thuc_hanh: loaiThucHanh || record?.loai_thuc_hanh || "cabin",
                nguoi_duyet_thuc_hanh: getUsername(),
                thoi_gian_duyet_thuc_hanh: new Date().toISOString(),
                nguoi_update: getUsername(),
                updated_at: new Date().toISOString(),
            });
            message.success("Duyệt thực hành thành công!");
            refetch();
        } catch {
            message.error("Duyệt thực hành thất bại!");
        }
    };

    // Hủy duyệt thực hành: trang_thai 5 -> 4, trang_thai_thuc_hanh 2 -> 1
    const handleHuyDuyetThucHanh = async (recordId) => {
        try {
            await updateHocBuStatus({
                id: recordId,
                trang_thai: 4,
                trang_thai_thuc_hanh: 1,
                nguoi_duyet_thuc_hanh: null,
                thoi_gian_duyet_thuc_hanh: null,
                nguoi_update: getUsername(),
                updated_at: new Date().toISOString(),
            });
            message.success("Hủy duyệt thực hành thành công!");
            refetch();
        } catch {
            message.error("Hủy duyệt thực hành thất bại!");
        }
    };

    // Tự động chọn đúng hàm duyệt dựa theo trang_thai hiện tại
    const handleDuyet = (recordId, record, loaiThucHanh) => {
        const st = Number(record?.trang_thai);
        if (st === 1) return handleDuyetLyThuyet(recordId, record);
        if (st === 4) return handleDuyetThucHanh(recordId, record, loaiThucHanh);
        message.warning("Trạng thái không hợp lệ để duyệt!");
    };

    // Tự động chọn đúng hàm hủy duyệt dựa theo trang_thai hiện tại
    const handleHuyDuyet = (recordId, record) => {
        const st = Number(record?.trang_thai);
        if (st === 2) return handleHuyDuyetLyThuyet(recordId);
        if (st === 5) return handleHuyDuyetThucHanh(recordId);
        message.warning("Trạng thái không hợp lệ để hủy duyệt!");
    };

    return {
        handleDuyet,
        handleHuyDuyet,
        handleDuyetLyThuyet,
        handleHuyDuyetLyThuyet,
        handleDuyetThucHanh,
        handleHuyDuyetThucHanh,
        handleTaoDonLyThuyet,
        handleTaoDonThucHanh,
    };
};