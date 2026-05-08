import { Card, Row, Col, Select, Input, Button, Space } from "antd";

const HocBuFilterCard = ({
    maKhoa, setMaKhoa,
    searchText, setSearchText,
    onApply, onReset,
    isLoadingKhoaHoc, courseOptions,
    extraFilters,
}) => {
    return (
        <Card className="!mb-5">
            <Row gutter={[16, 16]} align="bottom">
                <Col xs={24} sm={10} md={8} lg={5}>
                    <label className="block text-xs text-gray-500 uppercase">Khóa Học</label>
                    <Select
                        className="w-full"
                        placeholder="Chọn khóa học"
                        loading={isLoadingKhoaHoc}
                        value={maKhoa}
                        onChange={setMaKhoa}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={courseOptions}
                    />
                </Col>
                <Col xs={24} sm={10} md={8} lg={5}>
                    <label className="block text-xs text-gray-500 uppercase">Học viên / Mã DK</label>
                    <Input
                        placeholder="Nhập tên hoặc mã học viên"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onPressEnter={onApply}
                    />
                </Col>

                {/* Extra filters (trang_thai, trang_thai_hoc_bu...) */}
                {extraFilters}

                <Col xs={24} sm={4} md={8} lg={4}>
                    <Space>
                        <Button type="primary" className="!bg-[#3366cc]" onClick={onApply}>
                            Tìm kiếm
                        </Button>
                        <Button onClick={onReset}>Làm mới</Button>
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default HocBuFilterCard;