import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Tooltip,
  Select,
  Spin,
  List,
  Popconfirm,
  Switch,
  Divider,
} from "antd";
import {
  AimOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
  MenuOutlined,
  SearchOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import debounce from "lodash/debounce";
import {
  getForbiddenZones,
  createForbiddenZone,
  deleteForbiddenZone,
  updateForbiddenZone,
} from "../../apis/forbiddenZone";

const ForbiddenZonePage = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // ─── Sidebar/List State ─────────────────────────────────────────
  const [zonesList, setZonesList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // ─── Search Location State ──────────────────────────────────────
  const [searchOptions, setSearchOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchMarkerRef = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Draw Drawing State ─────────────────────────────────────────
  const [drawStep, setDrawStep] = useState(0); // 0: Idle, 1: Chọn tâm, 2: Chốt bán kính
  const [tempCenter, setTempCenter] = useState(null);
  const [tempRadius, setTempRadius] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const tempCircleRef = useRef(null);
  const tempCenterMarkerRef = useRef(null);
  const persistentZonesRef = useRef({}); // Lưu { zoneId: circleLayer } để dễ CRUD đơn lẻ

  const [form] = Form.useForm();

  // 1. Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Khởi tạo vị trí mặc định trung tâm Hà Nội hoặc Hải Dương (20.92, 106.32)
    const map = L.map(mapRef.current, {
      zoomControl: false, // Di chuyển zoom control xuống góc để thoáng
    }).setView([20.9393, 106.3147], 13);

    L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "© Google Maps",
    }).addTo(map);

    // Zoom control góc dưới bên phải
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstance.current = map;

    // Fetch & render
    fetchAndRenderAllZones();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Helper: Load & Render all zones
  const fetchAndRenderAllZones = async () => {
    const map = mapInstance.current;
    if (!map) return;

    setLoadingList(true);
    try {
      const res = await getForbiddenZones();
      const list = res?.data?.data || res?.data || [];
      setZonesList(list);

      // Clear existing layers
      Object.values(persistentZonesRef.current).forEach((layer) => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      });
      persistentZonesRef.current = {};

      // Render enabled zones
      list.forEach((z) => {
        if (z.lat && z.lng && (z.enabled === true || z.enabled === 1)) {
          const circle = L.circle([z.lat, z.lng], {
            radius: z.radius_m || 100,
            color: "#ea580c", // Cam đậm
            fillColor: "#ffedd5", // Cam nhẹ
            fillOpacity: 0.4,
            weight: 2,
          }).addTo(map);

          circle.bindPopup(`
            <div style="font-family: system-ui; min-width: 160px;">
              <div style="font-weight: 700; color: #ea580c; border-bottom: 1px solid #fed7aa; padding-bottom: 4px; margin-bottom: 4px; font-size:13px">
                🚫 ${z.name}
              </div>
              <div style="font-size: 11px; color: #4b5563; line-height:1.4;">${z.description || "Không có ghi chú"}</div>
              <div style="margin-top: 6px; font-size: 11px; display: flex; justify-content:space-between;">
                <span style="font-weight:600; color:#c2410c">Bán kính: ${z.radius_m}m</span>
              </div>
            </div>
          `);

          persistentZonesRef.current[z.id] = circle;
        }
      });
    } catch (err) {
      console.error("[fetchAndRenderAllZones]", err);
      message.error("Lỗi khi tải danh sách vùng cấm");
    } finally {
      setLoadingList(false);
    }
  };

  // Fly To Location & Highlight from Sidebar List
  const handleFlyToZone = (zone) => {
    const map = mapInstance.current;
    if (!map || !zone.lat || !zone.lng) return;

    map.setView([zone.lat, zone.lng], 16);

    // Tự động kích hoạt popup của vòng tròn đó
    const targetLayer = persistentZonesRef.current[zone.id];
    if (targetLayer) {
      targetLayer.openPopup();
    } else {
      // Nếu zone bị disabled chưa vẽ, tạo tạm marker nhấp nháy
      L.popup()
        .setLatLng([zone.lat, zone.lng])
        .setContent(`<b>${zone.name}</b> (Vùng cấm này đang tắt)`)
        .openOn(map);
    }
  };

  // Xử lý Delete Zone
  const handleDeleteZone = async (zoneId) => {
    try {
      await deleteForbiddenZone(zoneId);
      message.success("Đã xóa vùng cấm thành công!");
      fetchAndRenderAllZones();
    } catch (err) {
      console.error("Delete failed", err);
      message.error("Không thể xóa vùng cấm");
    }
  };

  // Xử lý Toggle Enable/Disable Zone
  const handleToggleZone = async (zone, checked) => {
    try {
      await updateForbiddenZone(zone.id, { enabled: checked ? 1 : 0 });
      message.success(`${checked ? "Đã kích hoạt" : "Đã vô hiệu hóa"} vùng cấm ${zone.name}`);
      fetchAndRenderAllZones();
    } catch (err) {
      console.error("Toggle failed", err);
      message.error("Thao tác lỗi");
    }
  };

  // ─── Hook Event Handling cho Vẽ Bản Đồ ────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (drawStep === 0) {
      map.getContainer().style.cursor = "";
      return;
    }

    map.getContainer().style.cursor = "crosshair";

    const handleMapClick = (e) => {
      if (drawStep === 1) {
        const center = e.latlng;
        setTempCenter(center);

        tempCircleRef.current = L.circle(center, {
          radius: 1,
          color: "#f87171",
          weight: 2,
          fillColor: "#fecaca",
          fillOpacity: 0.4,
        }).addTo(map);

        tempCenterMarkerRef.current = L.circleMarker(center, {
          radius: 5,
          color: "#ef4444",
          fillColor: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        }).addTo(map);

        setDrawStep(2);
      } else if (drawStep === 2) {
        const radius = map.distance(tempCenter, e.latlng);
        setTempRadius(Math.round(radius));
        setDrawStep(0);
        setOpenModal(true);
      }
    };

    const handleMapMouseMove = (e) => {
      if (drawStep === 2 && tempCenter && tempCircleRef.current) {
        const radius = map.distance(tempCenter, e.latlng);
        tempCircleRef.current.setRadius(radius);
        setTempRadius(Math.round(radius));
      }
    };

    map.on("click", handleMapClick);
    map.on("mousemove", handleMapMouseMove);

    return () => {
      map.off("click", handleMapClick);
      map.off("mousemove", handleMapMouseMove);
    };
  }, [drawStep, tempCenter]);

  const handleCancelDraw = () => {
    const map = mapInstance.current;
    if (map) {
      if (tempCircleRef.current) map.removeLayer(tempCircleRef.current);
      if (tempCenterMarkerRef.current) map.removeLayer(tempCenterMarkerRef.current);
    }
    tempCircleRef.current = null;
    tempCenterMarkerRef.current = null;
    setDrawStep(0);
    setTempCenter(null);
    setTempRadius(0);
  };

  useEffect(() => {
    if (openModal && tempCenter) {
      form.setFieldsValue({
        radius_m: tempRadius,
      });
    }
  }, [openModal, tempCenter, tempRadius, form]);

  const onRadiusChange = (value) => {
    const r = Number(value) || 1;
    setTempRadius(r);
    if (tempCircleRef.current) {
      tempCircleRef.current.setRadius(r);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      const result = {
        name: values.name,
        lat: Number(tempCenter.lat.toFixed(6)),
        lng: Number(tempCenter.lng.toFixed(6)),
        radius_m: Number(values.radius_m),
        description: values.description || "",
        enabled: 1,
      };

      setSaving(true);
      try {
        await createForbiddenZone(result);
        message.success("Đã thiết lập vùng cấm thành công!");

        // Xóa layer nháp
        const map = mapInstance.current;
        if (map) {
          if (tempCircleRef.current) map.removeLayer(tempCircleRef.current);
          if (tempCenterMarkerRef.current) map.removeLayer(tempCenterMarkerRef.current);
        }

        // Re-fetch sync
        await fetchAndRenderAllZones();
      } catch (err) {
        console.error("[createForbiddenZone]", err);
        message.error("Không thể kết nối server, đã xảy ra lỗi.");
      } finally {
        setSaving(false);
        tempCircleRef.current = null;
        tempCenterMarkerRef.current = null;
        setOpenModal(false);
        setTempCenter(null);
        setTempRadius(0);
        form.resetFields();
      }
    });
  };

  const handleModalCancel = () => {
    const map = mapInstance.current;
    if (map) {
      if (tempCircleRef.current) map.removeLayer(tempCircleRef.current);
      if (tempCenterMarkerRef.current) map.removeLayer(tempCenterMarkerRef.current);
    }
    tempCircleRef.current = null;
    tempCenterMarkerRef.current = null;
    setOpenModal(false);
    setTempCenter(null);
    setTempRadius(0);
    form.resetFields();
  };

  // ─── Nominatim Location Search API + Supercharged Smart Features ───
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query) => {
        if (!query || query.trim().length < 3) {
          setSearchOptions([]);
          return;
        }

        const trimmed = query.trim();

        // 1. HỖ TRỢ COORD COPIED TỪ GOOGLE MAPS (Vd: "20.939, 106.31")
        // Regex nhận diện cấu trúc "vĩ độ , kinh độ"
        const coordRegex = /^([-+]?([1-8]?\d(\.\d+)?|90(\.0+)?))\s*[,;\s]\s*([-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?))$/;
        const isCoord = trimmed.match(coordRegex);

        if (isCoord) {
          const lat = parseFloat(isCoord[1]);
          const lon = parseFloat(isCoord[5]);
          setSearchOptions([
            {
              value: `${lat},${lon}`,
              label: `📍 Bay tới Tọa độ: Vĩ độ ${lat.toFixed(6)}, Kinh độ ${lon.toFixed(6)}`,
              title: `Tọa độ: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
              subtitle: "Bay nhanh đến vị trí này",
            },
          ]);
          return;
        }

        setSearching(true);
        try {
          // Tối ưu tìm kiếm: Lấy bounds hiện tại của map để ưu tiên khu vực đang xem (Vd: Hải Dương)
          let boundsQuery = "";
          const map = mapInstance.current;
          if (map) {
            const b = map.getBounds();
            // viewbox = <left>,<top>,<right>,<bottom> -> <west>,<north>,<east>,<south>
            boundsQuery = `&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}&bounded=0`;
          }

          // Thêm &accept-language=vi để hiển thị tên Tiếng Việt thuần & addressdetails=1 để tăng độ chính xác
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=vn&limit=8&accept-language=vi&addressdetails=1${boundsQuery}`,
          );
          const list = await response.json();
          setSearchOptions(
            list.map((item) => {
              const parts = item.display_name.split(",");
              const title = parts[0]?.trim() || "";
              const subtitle = parts.slice(1).map(p => p.trim()).filter(Boolean).join(", ");
              return {
                value: `${item.lat},${item.lon}`,
                label: item.display_name,
                title: title,
                subtitle: subtitle,
              };
            }),
          );
        } catch (err) {
          console.error("[Nominatim search error]", err);
        } finally {
          setSearching(false);
        }
      }, 600),
    [],
  );

  const handleSearch = (val) => debouncedSearch(val);

  const handleSelectSearch = (val) => {
    if (!val) return;
    const map = mapInstance.current;
    if (!map) return;

    const [latStr, lonStr] = val.split(",");
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (!isNaN(lat) && !isNaN(lon)) {
      map.setView([lat, lon], 16);

      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }

      const match = searchOptions.find((o) => o.value === val);
      searchMarkerRef.current = L.circleMarker([lat, lon], {
        radius: 8,
        color: "#2563eb",
        fillColor: "#ffffff",
        weight: 3,
        fillOpacity: 1,
        zIndexOffset: 2000,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-size:12px; font-family:system-ui;">📍 <b>Vị trí tìm thấy:</b><br/>${match?.label || ""}</div>`,
        )
        .openPopup();
    }
  };

  return (
    <div className="relative w-full h-[100vh] flex">
      {/* MAP AREA */}
      <div className="flex-1 relative h-full">
        <div ref={mapRef} className="w-full h-full z-10" />

        {/* Sidebar Toggle Button Floating on top right of map */}
        <div className="absolute top-4 right-4 z-[1001]">
          <Button
            icon={<MenuOutlined />}
            className="shadow-lg bg-white border border-slate-200"
            onClick={() => setShowSidebar(!showSidebar)}
          />
        </div>

        {/* Google Maps Style Left Floating Search Panel */}
        <div
          ref={searchWrapperRef}
          className="absolute top-4 left-4 z-[1000] flex flex-col w-[360px] max-w-[90%]"
        >
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300">
            <SearchOutlined className="text-slate-400 text-[17px] flex shrink-0" />

            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-slate-800 placeholder-slate-400 font-medium"
              placeholder="Tìm kiếm trên Google Maps..."
              value={searchValue}
              onChange={(e) => {
                const val = e.target.value;
                setSearchValue(val);
                handleSearch(val);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
            />

            {searchValue && (
              <CloseOutlined
                onClick={() => {
                  setSearchValue("");
                  setSearchOptions([]);
                }}
                className="cursor-pointer text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 flex shrink-0 text-xs"
              />
            )}

            <div className="w-px h-6 bg-slate-200 shrink-0 mx-1" />

            {drawStep === 0 ? (
              <Tooltip title="Vẽ vùng cấm">
                <Button
                  type="text"
                  icon={<AimOutlined className="text-orange-600 text-lg flex" />}
                  onClick={() => setDrawStep(1)}
                  className="hover:!bg-orange-50 !p-1.5 rounded-full shrink-0 flex items-center justify-center"
                />
              </Tooltip>
            ) : (
              <Tooltip title="Hủy chế độ vẽ">
                <Button
                  type="text"
                  icon={<CloseOutlined className="text-red-500 text-lg flex" />}
                  onClick={handleCancelDraw}
                  className="hover:!bg-red-50 !p-1.5 rounded-full shrink-0 flex items-center justify-center"
                />
              </Tooltip>
            )}
          </div>

          {/* Draw Step Pulse Alert */}
          {drawStep !== 0 && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold py-2.5 px-4 rounded-xl flex justify-between items-center shadow-md animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span>
                  {drawStep === 1 ? "Chọn tâm trên bản đồ" : `Đang xác định, Bán kính = ${tempRadius}m`}
                </span>
              </div>
            </div>
          )}

          {/* Custom Search Results Dropdown */}
          {isSearchFocused && (searching || searchOptions.length > 0) && (
            <div className="mt-2 bg-white shadow-2xl rounded-2xl border border-slate-100 max-h-[380px] overflow-y-auto scrollbar-thin py-1 flex flex-col animate-in fade-in duration-200">
              {searching ? (
                <div className="p-4 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <Spin size="small" /> Đang tìm kiếm...
                </div>
              ) : (
                searchOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 active:bg-slate-100 border-b border-slate-50 last:border-b-0 transition-colors"
                    onClick={() => {
                      handleSelectSearch(opt.value);
                      setSearchValue(opt.title || opt.label);
                      setIsSearchFocused(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mt-0.5 shrink-0">
                      <HistoryOutlined className="text-sm" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="font-semibold text-[13.5px] text-slate-800 truncate leading-snug">
                        {opt.title}
                      </div>
                      <div className="text-[11.5px] text-slate-400 truncate leading-snug">
                        {opt.subtitle || "Việt Nam"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR PANEL */}
      <div
        className={`h-full bg-white border-l border-gray-200 transition-all duration-300 flex flex-col relative z-20 ${showSidebar ? "w-80 opacity-100" : "w-0 opacity-0 translate-x-10 overflow-hidden"
          }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-slate-50/50 backdrop-blur">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <EnvironmentOutlined className="text-orange-600" />
            Danh sách vùng cấm
          </h3>
          <span className="text-[11px] text-gray-500 font-medium">
            Tổng cộng: {zonesList.length} khu vực đã thiết lập
          </span>
        </div>

        {/* Sidebar List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <Spin spinning={loadingList}>
            <List
              dataSource={zonesList}
              locale={{ emptyText: "Chưa có vùng cấm nào." }}
              renderItem={(item) => (
                <div
                  className={`p-3 mb-2 rounded-xl border transition-all cursor-pointer ${item.enabled ? "border-slate-100 bg-white hover:shadow-md" : "border-slate-200 bg-slate-50/70 opacity-80 hover:shadow-sm"
                    }`}
                  onClick={() => handleFlyToZone(item)}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <div className="font-bold text-sm text-slate-700 leading-tight line-clamp-2">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-1">
                        R = {item.radius_m}m · ({Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)})
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        size="small"
                        checked={item.enabled === true || item.enabled === 1}
                        onChange={(checked) => handleToggleZone(item, checked)}
                      />
                      <Popconfirm
                        title="Xác nhận xóa vùng cấm này?"
                        okText="Có"
                        cancelText="Không"
                        onConfirm={() => handleDeleteZone(item.id)}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          className="!p-1 flex items-center"
                        />
                      </Popconfirm>
                    </div>
                  </div>

                  {item.description && (
                    <div className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50 px-2 py-1 rounded">
                      "{item.description}"
                    </div>
                  )}
                </div>
              )}
            />
          </Spin>
        </div>
      </div>

      {/* CREATE ZONE MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <AimOutlined className="text-orange-600 text-lg" />
            <span className="font-bold text-base">Thiết lập Thông tin Vùng Cấm</span>
          </div>
        }
        open={openModal}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Xác nhận lưu"
        cancelText="Hủy bỏ"
        confirmLoading={saving}
        destroyOnClose
        centered
        zIndex={10005}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label={<span className="font-bold text-slate-600 text-[13px]">Tên vùng cấm</span>}
            rules={[{ required: true, message: "Nhập tên phân khu / vùng" }]}
          >
            <Input placeholder="Ví dụ: Đoạn đường cấm Ngã 4 Hàng Xanh" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
            <Form.Item label={<span className="font-bold text-slate-500 text-xs">Vĩ độ (Lat)</span>}>
              <InputNumber className="!w-full" value={Number(tempCenter?.lat.toFixed(6))} disabled />
            </Form.Item>
            <Form.Item label={<span className="font-bold text-slate-500 text-xs">Kinh độ (Lng)</span>}>
              <InputNumber className="!w-full" value={Number(tempCenter?.lng.toFixed(6))} disabled />
            </Form.Item>
            <Form.Item
              name="radius_m"
              label={<span className="font-bold text-slate-700 text-xs">Bán kính (m)</span>}
              rules={[{ required: true, message: "Bán kính" }]}
            >
              <InputNumber
                className="!w-full"
                min={1}
                precision={0}
                onChange={onRadiusChange}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={<span className="font-bold text-slate-600 text-[13px]">Mô tả chi tiết lý do cấm</span>}
          >
            <Input.TextArea rows={3} placeholder="Nhập lý do (Vd: Khu dân cư đông đúc, cấm DAT...)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ForbiddenZonePage;
