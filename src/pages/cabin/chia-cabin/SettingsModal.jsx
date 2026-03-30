import { Modal, Tabs, Input, InputNumber, Switch, Button, message } from "antd";

const SettingsModal = ({
  settingsModal,
  setSettingsModal,
  settingsTab,
  setSettingsTab,
  globalConfig,
  setGlobalConfig,
  dayConfigs,
  setDayConfigs,
  setSchedule,
}) => {
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
                        <div className="grid grid-cols-2 gap-6">
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
                      )}
                    </div>
                  );
                })}
              </div>
            ),
          },
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
