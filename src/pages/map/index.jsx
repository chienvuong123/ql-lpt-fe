import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TrackingMap = ({ trackingData = [], currentPoint }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);

  // 1. Khởi tạo Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      fadeAnimation: false, // Tắt animation mờ khi load tile để giảm nhòe
    }).setView([20.921986, 106.326658], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // 2. Vẽ Lộ trình
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !trackingData || trackingData.length === 0) return;

    [routePolylineRef, startMarkerRef, endMarkerRef].forEach((ref) => {
      if (ref.current) {
        map.removeLayer(ref.current);
        ref.current = null;
      }
    });

    const validPoints = trackingData.filter(
      (p) => p && typeof p.latitude === "number" && !isNaN(p.latitude),
    );

    if (validPoints.length === 0) return;
    const latlngs = validPoints.map((p) => [p.latitude, p.longitude]);

    routePolylineRef.current = L.polyline(latlngs, {
      color: "#3b82f6",
      weight: 5,
      opacity: 0.8,
    }).addTo(map);

    startMarkerRef.current = L.circleMarker(latlngs[0], {
      radius: 8,
      fillColor: "#10b981",
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup("Điểm xuất phát");

    endMarkerRef.current = L.circleMarker(latlngs[latlngs.length - 1], {
      radius: 8,
      fillColor: "#ef4444",
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup("Điểm kết thúc");

    map.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50] });
  }, [trackingData]);

  // 3. Cập nhật vị trí XE (Sửa lỗi nhòe và dùng Tailwind)
  useEffect(() => {
    const map = mapInstance.current;
    if (
      !map ||
      !currentPoint ||
      typeof currentPoint !== "object" ||
      !currentPoint.latitude
    )
      return;

    const { latitude, longitude, direction, speed, timestamp, totalKm } =
      currentPoint;
    const rotation = direction ? direction * 360 : 0;

    // ICON XE: Bỏ transition transform 0.3s để tránh bị "đuôi" khi map pan
    const vehicleIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/744/744465.png" 
            style="width: 30px; height: 30px; transform: rotate(${rotation}deg);"
          />
        </div>`,
      className: "",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // POPUP CONTENT: Dùng Tailwind CSS hoàn toàn
    const popupContent = `
        <div class="min-w-[150px] font-sans p-1">
            <div class="flex flex-col gap-0 text-xs text-gray-700">
            <p class="!m-0.5">Vận tốc: <span class="font-bold text-gray-900">${speed} Km/h</span></p>
            <p class="!m-0.5">Quãng đường: <span class="font-bold text-gray-900">${totalKm} Km</span></p>
            <p class="!m-0.5 text-[10px] text-gray-400 mt-1">Thời gian: ${new Date(timestamp).toLocaleTimeString("vi-VN")}</p>
            </div>
        </div>`;

    if (markerRef.current && map.hasLayer(markerRef.current)) {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(vehicleIcon);
      markerRef.current.setPopupContent(popupContent);
    } else {
      markerRef.current = L.marker([latitude, longitude], {
        icon: vehicleIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(popupContent, {
          offset: [0, -10],
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          className: "custom-smooth-popup",
        });
    }

    markerRef.current.openPopup();

    map.panTo([latitude, longitude], {
      animate: true,
      duration: 0.3, // Ngắn hơn interval 0.5s của timer
      noMoveStart: true,
    });
  }, [currentPoint]);

  return (
    <div className="relative w-full h-110 rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gray-50">
      <div ref={mapRef} className="w-full h-full z-10" />
      <div className=" absolute bottom-0 right-0 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 text-[11px] font-medium text-gray-700 space-y-2">
        <div className="flex items-center gap-2 mb-0.5">
          <span class="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>
          <span>Điểm đi</span>
        </div>
        <div className="flex items-center gap-2 mb-0.5">
          <span class="w-6 h-1 bg-blue-500 rounded-full"></span>
          <span>Lộ trình</span>
        </div>
        <div className="flex items-center gap-2 mb-0.5">
          <span class="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
          <span>Điểm đến</span>
        </div>
        <div className="flex items-center gap-2 mb-0.5">
          <img
            src="https://cdn-icons-png.flaticon.com/512/744/744465.png"
            class="w-4 h-4"
          />
          <span>Vị trí xe</span>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
