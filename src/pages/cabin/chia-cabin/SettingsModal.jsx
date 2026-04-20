import React, { useState } from "react";
import { Modal, Tabs, Input, InputNumber, Switch, Button, message, Select, Divider } from "antd";

const SettingsModal = ({
  settingsModal,
  setSettingsModal,
  settingsTab,
  setSettingsTab,
  globalConfig,
  setGlobalConfig,
  dayConfigs,
  setDayConfigs,
  cabinConfigs,
  setCabinConfigs,
  uniqueKhoaHoc,
  setSchedule,
  courseRankMap = {},
}) => {
  const [selectedCabin, setSelectedCabin] = useState(1);

  // Xác định hạng của Cabin đang chọn
  const b1Count = globalConfig.b1Cabins;
  const cabinType = Number(selectedCabin) > 5 - b1Count ? "B1" : "B2";

  // Lọc danh sách khóa học theo hạng của Cabin
  const filteredKhoaHoc = uniqueKhoaHoc.filter((k) => {
    const courseRank = (courseRankMap[k] || "").toUpperCase();
    return courseRank === cabinType;
  });

  return (
    <Modal
      title="Cài đặt thời gian"
      open={settingsModal}
      onCancel={() => setSettingsModal(false)}
      width={720}
      footer={null}
    >
      <Tabs
        activeKey={settingsTab}
        onChange={setSettingsTab}
        items={[
          {
            key: "global",
            label: "Cài đặt chung",
            children: (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Giờ bắt đầu chung
                    </label>
                    <Input
                      type="time"
                      value={globalConfig.startTime}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Giờ kết thúc chung
                    </label>
                    <Input
                      type="time"
                      value={globalConfig.endTime}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Giờ bắt đầu tính học bù
                    </label>
                    <Input
                      type="time"
                      value={globalConfig.makeupThreshold || "17:00"}
                      onChange={(e) =>
                        setGlobalConfig({
                          ...globalConfig,
                          makeupThreshold: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Các ca học bắt đầu từ giờ này sẽ chỉ nhận HV học bù (nếu ngày đó cho phép).</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Thời lượng mỗi ca (phút)
                  </label>
                  <InputNumber
                    min={30}
                    max={240}
                    value={globalConfig.duration}
                    onChange={(v) =>
                      setGlobalConfig({ ...globalConfig, duration: v })
                    }
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 pb-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Số Cabin hạng B1
                    </label>
                    <InputNumber
                      min={0}
                      max={5}
                      value={globalConfig.b1Cabins}
                      onChange={(v) =>
                        setGlobalConfig({
                          ...globalConfig,
                          b1Cabins: v,
                          b2Cabins: 5 - v,
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Số Cabin hạng B2
                    </label>
                    <InputNumber
                      min={0}
                      max={5}
                      value={globalConfig.b2Cabins}
                      onChange={(v) =>
                        setGlobalConfig({
                          ...globalConfig,
                          b1Cabins: 5 - v,
                          b2Cabins: v,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "daily",
            label: "Cài đặt ngày đặc biệt",
            children: (
              <div className="space-y-6 pt-4 max-h-[520px] overflow-y-auto pr-2">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, idx) => {
                  const dayIdx = idx === 6 ? 0 : idx + 1;
                  const override = dayConfigs[dayIdx] || {};

                  return (
                    <div key={day} className="border rounded-2xl p-5 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{day}</h3>

                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            Không nhận ca nào
                          </span>
                          <Switch
                            checked={override.noSessions || false}
                            onChange={(checked) =>
                              setDayConfigs({
                                ...dayConfigs,
                                [dayIdx]: {
                                  ...override,
                                  noSessions: checked,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      {!override.noSessions && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-400 mb-1">Giờ bắt đầu</label>
                              <Input
                                type="time"
                                value={override.start || globalConfig.startTime}
                                onChange={(e) =>
                                  setDayConfigs({
                                    ...dayConfigs,
                                    [dayIdx]: {
                                      ...override,
                                      start: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-gray-400 mb-1">Giờ kết thúc</label>
                              <Input
                                type="time"
                                value={override.end || globalConfig.endTime}
                                onChange={(e) =>
                                  setDayConfigs({
                                    ...dayConfigs,
                                    [dayIdx]: {
                                      ...override,
                                      end: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Nhận hv học bù</span>
                              <Switch
                                size="small"
                                checked={override.acceptMakeup || false}
                                onChange={(checked) =>
                                  setDayConfigs({
                                    ...dayConfigs,
                                    [dayIdx]: {
                                      ...override,
                                      acceptMakeup: checked,
                                    },
                                  })
                                }
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium">Số cabin B1</span>
                              <InputNumber
                                min={0}
                                max={5}
                                size="small"
                                value={override.b1Cabins ?? globalConfig.b1Cabins}
                                onChange={(v) =>
                                  setDayConfigs({
                                    ...dayConfigs,
                                    [dayIdx]: {
                                      ...override,
                                      b1Cabins: v,
                                    },
                                  })
                                }
                                style={{ width: 60 }}
                              />
                            </div>
                          </div>
                          {override.acceptMakeup && (
                            <p className="text-[10px] text-blue-500 italic">
                              * Ngày này sẽ có các ca từ {globalConfig.makeupThreshold || "17:00"} dành riêng cho học viên học bù.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ),
          },
          {
            key: "cabin",
            label: "Cấu hình Cabin riêng",
            children: (
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-medium">Chọn Cabin:</span>
                  <Select
                    value={selectedCabin}
                    onChange={setSelectedCabin}
                    style={{ width: 120 }}
                    options={[1, 2, 3, 4, 5].map((n) => ({
                      value: n,
                      label: `Cabin ${n}`,
                    }))}
                  />
                </div>

                <Divider className="my-2" />

                {selectedCabin && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Khóa học được phép ở Cabin {selectedCabin}
                      </label>
                      <Select
                        mode="multiple"
                        placeholder="Chọn các khóa học"
                        className="w-full"
                        value={(cabinConfigs[selectedCabin] || {}).courses || []}
                        onChange={(vals) => {
                          const oldCfg = cabinConfigs[selectedCabin] || {};
                          const newRatios = { ...(oldCfg.ratios || {}) };
                          // Dọn dẹp ratios cũ không còn trong vals
                          Object.keys(newRatios).forEach(k => {
                            if (!vals.includes(k)) delete newRatios[k];
                          });
                          // Khởi tạo ratios mới nếu chưa có
                          vals.forEach(v => {
                             if (!newRatios[v]) newRatios[v] = Math.round(100 / vals.length);
                          });

                          setCabinConfigs({
                            ...cabinConfigs,
                            [selectedCabin]: {
                              ...oldCfg,
                              courses: vals,
                              ratios: newRatios
                            }
                          });
                        }}
                        options={filteredKhoaHoc.map((k) => ({ value: k, label: k }))}
                      />
                    </div>

                    {(cabinConfigs[selectedCabin]?.courses || []).length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-semibold mb-3">
                          Phân bổ tỷ lệ % (Tổng nên là 100)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          {(cabinConfigs[selectedCabin]?.courses || []).map(course => (
                            <div key={course} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border">
                              <span className="text-xs font-medium truncate max-w-[120px]" title={course}>{course}</span>
                              <InputNumber
                                min={0}
                                max={100}
                                size="small"
                                formatter={value => `${value}%`}
                                parser={value => value.replace('%', '')}
                                value={cabinConfigs[selectedCabin]?.ratios?.[course] || 0}
                                onChange={(val) => {
                                  const oldCfg = cabinConfigs[selectedCabin] || {};
                                  setCabinConfigs({
                                    ...cabinConfigs,
                                    [selectedCabin]: {
                                      ...oldCfg,
                                      ratios: {
                                        ...(oldCfg.ratios || {}),
                                        [course]: val
                                      }
                                    }
                                  });
                                }}
                                style={{ width: 80 }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-[11px] text-gray-400 italic">
                          * Tỷ lệ này sẽ được sử dụng khi bạn bấm "Chia theo cấu hình Cabin" ở màn hình chính.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }
        ]}
      />

      <div className="flex justify-end gap-3 pt-6 border-t mt-6">
        <Button onClick={() => setSettingsModal(false)}>Hủy</Button>

        <Button
          type="primary"
          onClick={() => {
            setSettingsModal(false);
            message.success("Đã lưu cài đặt thời gian!");
          }}
        >
          Lưu cài đặt
        </Button>
      </div>
    </Modal>
  );
};

export default SettingsModal;
