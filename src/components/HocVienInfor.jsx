import { Space, Image, Typography } from "antd";

const HocVienInfo = ({ record }) => {
    if (!record) return <span className="text-gray-400 italic">Thiếu dữ liệu HV</span>;
    return (
        <Space>
            <Image
                src={record.anh}
                width={40}
                height={40}
                className="rounded-md"
                fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
            />
            <div className="flex flex-col">
                <span className="font-semibold text-sm">{record.ho_ten}</span>
                <Typography.Text className="!text-[12px]" copyable={{ text: record.ma_dk }}>
                    {record.ma_dk}
                </Typography.Text>
            </div>
        </Space>
    );
};

export default HocVienInfo;