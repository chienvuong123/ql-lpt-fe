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
      fadeAnimation: false,
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

  // 2. Vẽ lộ trình — chạy lại mỗi khi trackingData thay đổi
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !trackingData || trackingData.length === 0) return;

    // Xóa các layer cũ
    [routePolylineRef, startMarkerRef, endMarkerRef].forEach((ref) => {
      if (ref.current) {
        map.removeLayer(ref.current);
        ref.current = null;
      }
    });

    // Xóa marker xe khi đổi route
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    const validPoints = trackingData.filter(
      (p) => p && typeof p.latitude === "number" && !isNaN(p.latitude),
    );

    if (validPoints.length === 0) return;

    const latlngs = validPoints.map((p) => [p.latitude, p.longitude]);

    // Vẽ đường route màu xanh đặc
    routePolylineRef.current = L.polyline(latlngs, {
      color: "#3b82f6",
      weight: 4,
      opacity: 0.85,
    }).addTo(map);

    // Điểm xuất phát (xanh lá)
    startMarkerRef.current = L.circleMarker(latlngs[0], {
      radius: 8,
      fillColor: "#10b981",
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup("Điểm xuất phát");

    // Điểm kết thúc (đỏ)
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

  // 3. Cập nhật vị trí xe
  useEffect(() => {
    const map = mapInstance.current;
    if (
      !map ||
      !currentPoint ||
      typeof currentPoint !== "object" ||
      !currentPoint.latitude
    )
      return;

    const { latitude, longitude, speed, timestamp, totalKm } = currentPoint;

    // Khai báo popupContent TRƯỚC khi dùng
    const popupContent = `
      <div style="min-width:150px;font-family:sans-serif;padding:4px">
        <div style="display:flex;flex-direction:column;gap:2px;font-size:12px;color:#374151">
          <p style="margin:2px 0">Vận tốc: <strong style="color:#111827">${speed}</strong></p>
          <p style="margin:2px 0">Quãng đường: <strong style="color:#111827">${totalKm}</strong></p>
          <p style="margin:4px 0 0;font-size:10px;color:#9ca3af">
            Thời gian: ${new Date(timestamp).toLocaleTimeString("vi-VN")}
          </p>
        </div>
      </div>`;

    if (markerRef.current && map.hasLayer(markerRef.current)) {
      // Cập nhật marker hiện có
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setPopupContent(popupContent);
    } else {
      markerRef.current = L.circleMarker([latitude, longitude], {
        radius: 8,
        fillColor: "#ef4444",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(popupContent, {
          offset: [0, -10],
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
        });
    }

    markerRef.current.openPopup();

    map.panTo([latitude, longitude], {
      animate: true,
      duration: 0.3,
      noMoveStart: true,
    });
  }, [currentPoint]);

  return (
    <div className="relative w-full h-110 rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gray-50">
      <div ref={mapRef} className="w-full h-full z-10" />

      {/* Legend */}
      <div className="absolute bottom-0 right-0 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 text-[11px] font-medium text-gray-700 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
          <span>Điểm đi</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 bg-blue-500 rounded-full flex-shrink-0" />
          <span>Lộ trình</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
          <span>Điểm đến</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
          <span>Vị trí xe</span>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
