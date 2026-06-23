"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import type { ViewStateChangeEvent, MapRef, MapLayerMouseEvent } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  Square, 
  Trash2, 
  Check, 
  X, 
  MapPin, 
  Navigation,
  Sparkles,
  MousePointerClick
} from "lucide-react";
import type { SearchListing, Coordinate } from "@/types/listing.types";
import { formatPrice, getRoomTypeLabel } from "@/lib/mockData";
import Link from "next/link";
import { toast } from "sonner";

// OSM Voyager Tile Style (Free, no token required)
const osmStyle = {
  version: 8 as const,
  sources: {
    "osm-tiles": {
      type: "raster" as const,
      tiles: [
        "https://basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, © CARTO",
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster" as const,
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Generates a circular polygon for visualization
function createGeoJSONCircle(center: Coordinate, radiusKm: number, points: number = 64) {
  const coords = [];
  const distanceX = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center.lng + x, center.lat + y]);
  }
  coords.push(coords[0]); // Close the circle

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: {},
  };
}

interface MapGeoSearchProps {
  listings: SearchListing[];
  selectedListing: SearchListing | null;
  onSelectListing: (listing: SearchListing | null) => void;
  polygon: Coordinate[];
  onPolygonChange: (polygon: Coordinate[]) => void;
  userCoords: Coordinate | null;
  radiusKm: number;
  searchMode: "standard" | "nearby";
  onViewportChange?: (lat: number, lng: number) => void;
}

export default function MapGeoSearch({
  listings,
  selectedListing,
  onSelectListing,
  polygon,
  onPolygonChange,
  userCoords,
  radiusKm,
  searchMode,
  onViewportChange
}: MapGeoSearchProps) {
  const mapRef = useRef<MapRef | null>(null);
  
  // Local Map Viewport state
  const [viewport, setViewport] = useState({
    latitude: 16.0544, // Da Nang default
    longitude: 108.2022,
    zoom: 13,
  });

  const [mapError, setMapError] = useState<string | null>(null);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Coordinate[]>([]);

  // Update viewport when userCoords changes (for GPS scan mode)
  useEffect(() => {
    if (searchMode === "nearby" && userCoords) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewport((prev) => ({
        ...prev,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        zoom: 14,
      }));
    }
  }, [userCoords, searchMode]);

  // Zoom to selected listing
  useEffect(() => {
    if (selectedListing && selectedListing.lat && selectedListing.lng) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewport((prev) => ({
        ...prev,
        latitude: selectedListing.lat,
        longitude: selectedListing.lng,
        zoom: 15,
      }));
    }
  }, [selectedListing]);

  // Adjust map viewport to fit listings center if standard mode and no polygon
  useEffect(() => {
    if (listings.length > 0 && searchMode === "standard" && polygon.length === 0 && !isDrawing) {
      const validListings = listings.filter(l => l.lat && l.lng);
      if (validListings.length > 0) {
        const avgLat = validListings.reduce((sum, l) => sum + l.lat, 0) / validListings.length;
        const avgLng = validListings.reduce((sum, l) => sum + l.lng, 0) / validListings.length;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewport((prev) => ({
          ...prev,
          latitude: avgLat,
          longitude: avgLng,
        }));
      }
    }
  }, [listings, searchMode, polygon.length, isDrawing]);

  // Client-side grid clustering based on current map zoom level
  const clusteredItems = useMemo(() => {
    const validListings = listings.filter((l) => l.lat !== undefined && l.lng !== undefined);
    
    // Zoom levels high enough do not cluster
    if (viewport.zoom >= 15) {
      return validListings.map((l) => ({
        id: `listing-${l.id}`,
        isCluster: false,
        lat: l.lat,
        lng: l.lng,
        count: 1,
        listing: l,
      }));
    }

    // Grid size scales with zoom level: smaller zoom -> larger grid -> more clustering
    const gridSize = 0.04 / Math.pow(2, viewport.zoom - 10);
    const clusters: Record<string, { latSum: number; lngSum: number; items: SearchListing[] }> = {};

    validListings.forEach((l) => {
      const lat = l.lat;
      const lng = l.lng;
      const gridX = Math.round(lng / gridSize);
      const gridY = Math.round(lat / gridSize);
      const key = `${gridX},${gridY}`;

      if (!clusters[key]) {
        clusters[key] = { latSum: 0, lngSum: 0, items: [] };
      }
      clusters[key].latSum += lat;
      clusters[key].lngSum += lng;
      clusters[key].items.push(l);
    });

    return Object.entries(clusters).map(([key, data]) => {
      const count = data.items.length;
      const avgLat = data.latSum / count;
      const avgLng = data.lngSum / count;

      if (count === 1) {
        return {
          id: `listing-${data.items[0].id}`,
          isCluster: false,
          lat: data.items[0].lat,
          lng: data.items[0].lng,
          count: 1,
          listing: data.items[0],
        };
      } else {
        return {
          id: `cluster-${key}`,
          isCluster: true,
          lat: avgLat,
          lng: avgLng,
          count,
          items: data.items,
        };
      }
    });
  }, [listings, viewport.zoom]);

  // Handle map click for drawing polygon
  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    if (!isDrawing) return;
    const { lng, lat } = e.lngLat;
    setDrawPoints((prev) => [...prev, { lat, lng }]);
  }, [isDrawing]);

  // Toggle Draw Mode
  const startDrawing = () => {
    setIsDrawing(true);
    setDrawPoints([]);
    onPolygonChange([]);
    onSelectListing(null);
    toast.info("Chế độ vẽ đã kích hoạt. Click trên bản đồ để thêm các đỉnh.");
  };

  // Finish Draw Mode
  const finishDrawing = () => {
    if (drawPoints.length < 3) {
      toast.warning("Vui lòng vẽ ít nhất 3 điểm để tạo thành vùng khoanh.");
      return;
    }
    setIsDrawing(false);
    onPolygonChange(drawPoints);
    toast.success(`Đã khép kín đa giác tìm kiếm với ${drawPoints.length} điểm.`);
  };

  // Cancel Drawing
  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawPoints([]);
    onPolygonChange([]);
  };

  // Clear Polygon
  const clearPolygon = () => {
    setDrawPoints([]);
    onPolygonChange([]);
    setIsDrawing(false);
    toast.info("Đã xóa vùng vẽ.");
  };

  // Zoom in on cluster click
  const handleClusterClick = (lat: number, lng: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewport((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: Math.min(prev.zoom + 2, 17),
    }));
  };

  // Handle viewport movement
  const handleMove = (evt: ViewStateChangeEvent) => {
    setViewport(evt.viewState);
  };

  // Notify parent on move end (for bounds-based queries if applicable)
  const handleMoveEnd = () => {
    if (onViewportChange) {
      onViewportChange(viewport.latitude, viewport.longitude);
    }
  };

  // GeoJSON features for polygon drawing
  const geojsonPoints = useMemo(() => {
    const pointsToUse = isDrawing ? drawPoints : polygon;
    return {
      type: "FeatureCollection" as const,
      features: pointsToUse.map((pt, idx) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [pt.lng, pt.lat] as [number, number],
        },
        properties: {
          index: idx,
        },
      })),
    };
  }, [drawPoints, polygon, isDrawing]);

  const geojsonLine = useMemo(() => {
    const pointsToUse = isDrawing ? drawPoints : polygon;
    if (pointsToUse.length < 2) return null;
    const coords = pointsToUse.map((pt) => [pt.lng, pt.lat]);
    
    // Close line if not drawing or if closed
    if (pointsToUse.length >= 3) {
      coords.push([pointsToUse[0].lng, pointsToUse[0].lat]);
    }
    
    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: coords,
      },
      properties: {},
    };
  }, [drawPoints, polygon, isDrawing]);

  const geojsonPolygon = useMemo(() => {
    const pointsToUse = isDrawing ? drawPoints : polygon;
    if (pointsToUse.length < 3) return null;
    const coords = pointsToUse.map((pt) => [pt.lng, pt.lat]);
    coords.push([pointsToUse[0].lng, pointsToUse[0].lat]); // Close polygon loop

    return {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [coords],
      },
      properties: {},
    };
  }, [drawPoints, polygon, isDrawing]);

  // GeoJSON circle for GPS radius
  const geojsonCircle = useMemo(() => {
    if (searchMode === "nearby" && userCoords && radiusKm > 0) {
      return createGeoJSONCircle(userCoords, radiusKm);
    }
    return null;
  }, [userCoords, radiusKm, searchMode]);

  return (
    <div className="w-full h-full relative">
      {/* Floating Drawing Controller Toolbar */}
      {searchMode === "standard" && (
        <div className="absolute top-4 left-4 z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-gray-150 shadow-lg">
          {!isDrawing && polygon.length === 0 ? (
            <button
              onClick={startDrawing}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-blue-500/10"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Vẽ vùng tìm kiếm</span>
            </button>
          ) : isDrawing ? (
            <>
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-semibold border border-amber-200">
                <MousePointerClick className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                <span>Click trên bản đồ để nối điểm...</span>
              </div>
              <div className="flex gap-1.5 mt-2 sm:mt-0">
                <button
                  onClick={finishDrawing}
                  disabled={drawPoints.length < 3}
                  className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Hoàn thành ({drawPoints.length})</span>
                </button>
                <button
                  onClick={cancelDrawing}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-250 text-gray-700 rounded-xl text-xs font-bold transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Hủy</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                <span>Đã khoanh vùng tìm kiếm</span>
              </div>
              <button
                onClick={clearPolygon}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition-all active:scale-95 mt-2 sm:mt-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa vùng vẽ</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating GPS Help Widget */}
      {searchMode === "nearby" && userCoords && (
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-gray-150 shadow-lg text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
          </span>
          <span>Đang quét bán kính {radiusKm} km từ tâm GPS</span>
        </div>
      )}

      <Map
        {...viewport}
        ref={mapRef}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
        mapLib={maplibregl}
        mapStyle={osmStyle}
        cursor={isDrawing ? "crosshair" : "grab"}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError={(e: any) => {
          console.error("Map rendering error:", e);
          setMapError("Không thể tải bản đồ.");
        }}
      >
        <NavigationControl position="bottom-right" />

        {/* GPS Scan Center Marker */}
        {searchMode === "nearby" && userCoords && (
          <Marker latitude={userCoords.lat} longitude={userCoords.lng}>
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-10 w-10 rounded-full bg-blue-500/25 opacity-40 animate-ping"></span>
              <span className="relative rounded-full h-6 w-6 bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
                <Navigation className="h-3 w-3 text-white fill-white rotate-45" />
              </span>
            </div>
          </Marker>
        )}

        {/* GPS Radius GeoJSON Overlay */}
        {geojsonCircle && (
          <Source id="gps-radius-source" type="geojson" data={geojsonCircle}>
            <Layer
              id="gps-radius-fill"
              type="fill"
              paint={{
                "fill-color": "#2563EB",
                "fill-opacity": 0.08,
              }}
            />
            <Layer
              id="gps-radius-stroke"
              type="line"
              paint={{
                "line-color": "#2563EB",
                "line-width": 1.5,
                "line-dasharray": [3, 2],
              }}
            />
          </Source>
        )}

        {/* Polygon GeoJSON Overlay */}
        {geojsonPolygon && (
          <Source id="polygon-source" type="geojson" data={geojsonPolygon}>
            <Layer
              id="polygon-fill"
              type="fill"
              paint={{
                "fill-color": "#3b82f6",
                "fill-opacity": 0.12,
              }}
            />
          </Source>
        )}
        {geojsonLine && (
          <Source id="polygon-line-source" type="geojson" data={geojsonLine}>
            <Layer
              id="polygon-line"
              type="line"
              paint={{
                "line-color": "#2563EB",
                "line-width": 2,
                "line-dasharray": isDrawing ? [2, 2] : [],
              }}
            />
          </Source>
        )}
        {geojsonPoints.features.length > 0 && (
          <Source id="polygon-points-source" type="geojson" data={geojsonPoints}>
            <Layer
              id="polygon-points"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": "#2563EB",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#FFFFFF",
              }}
            />
          </Source>
        )}

        {/* Clustered Items / HTML Markers */}
        {clusteredItems.map((item) => {
          if (item.isCluster) {
            // Render beautiful blue counts cluster
            const size = Math.min(30 + item.count * 2, 50); // scales with density
            const isMedium = item.count >= 5;
            const isLarge = item.count >= 10;
            const colorClass = isLarge 
              ? "bg-blue-800 text-white border-blue-900 shadow-blue-500/20" 
              : isMedium 
                ? "bg-blue-600 text-white border-blue-700 shadow-blue-500/10" 
                : "bg-blue-50 text-blue-600 border-blue-200 shadow-blue-500/5";

            return (
              <Marker
                key={item.id}
                latitude={item.lat}
                longitude={item.lng}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                }}
              >
                <button
                  onClick={(e) => handleClusterClick(item.lat, item.lng, e)}
                  style={{ width: `${size}px`, height: `${size}px` }}
                  className={`rounded-full flex items-center justify-center text-xs font-bold border shadow-md active:scale-90 transition-all ${colorClass}`}
                >
                  {item.count}
                </button>
              </Marker>
            );
          } else {
            // Render customized price tag marker
            const listing = item.listing!;
            const isSelected = selectedListing?.id === listing.id;

            return (
              <Marker
                key={item.id}
                latitude={item.lat}
                longitude={item.lng}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectListing(listing);
                  }}
                  className={`px-2 py-1 rounded-xl font-extrabold text-[10px] shadow-md border flex items-center gap-1 active:scale-95 transition-all duration-200 hover:-translate-y-0.5 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-700 shadow-blue-500/20 scale-105"
                      : listing.isPromoted
                        ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/10 hover:bg-amber-600"
                        : "bg-white text-blue-700 border-blue-100 hover:bg-blue-50"
                  }`}
                >
                  {listing.isPromoted && <Sparkles className="h-2.5 w-2.5 fill-white text-white" />}
                  <span>
                    {formatPrice(listing.price).replace("đ", "").replace(".000.000", "M").replace(".000", "k")}
                  </span>
                </button>
              </Marker>
            );
          }
        })}

        {/* Selected Popup Info */}
        {selectedListing && (
          <Popup
            latitude={selectedListing.lat}
            longitude={selectedListing.lng}
            anchor="bottom"
            onClose={() => onSelectListing(null)}
            closeOnClick={false}
            className="z-40"
          >
            <div className="w-52 p-0.5 animate-fade-in text-gray-900 font-sans">
              <div className="relative h-24 w-full bg-gray-100 rounded-lg overflow-hidden mb-2">
                <img
                  src={
                    selectedListing.images && selectedListing.images.length > 0
                      ? selectedListing.images[0]
                      : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"
                  }
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                  {selectedListing.isPromoted && (
                    <div className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px] font-bold shadow-sm uppercase tracking-wider">
                      ✨ Nổi bật
                    </div>
                  )}
                </div>
              </div>
              <h5 className="font-extrabold text-xs text-gray-900 line-clamp-1 mb-0.5">
                {selectedListing.title}
              </h5>
              <div className="flex items-center gap-0.5 text-gray-500 text-[10px] mb-1 font-semibold">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="line-clamp-1">{selectedListing.address}</span>
              </div>
              <p className="text-blue-600 font-extrabold text-xs">
                {formatPrice(selectedListing.price)}/tháng
              </p>
              <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1.5 mt-1.5 border-t border-gray-100 font-bold">
                <span>{selectedListing.area || 0} m² • {getRoomTypeLabel(selectedListing.roomType || "single")}</span>
                <Link 
                  href={`/app/listings/${selectedListing.id}`} 
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-0.5 text-[11px] font-extrabold"
                >
                  <span>Chi tiết</span>
                  <span className="text-[9px]">➔</span>
                </Link>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Error Boundary Frame */}
      {mapError && (
        <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col justify-center items-center p-6 text-center text-white backdrop-blur-md">
          <div className="max-w-xs bg-gray-900 border border-white/10 p-5 rounded-3xl">
            <MapPin className="h-10 w-10 text-red-500 mx-auto mb-4 animate-bounce" />
            <h4 className="text-sm font-extrabold text-red-400">Lỗi Kết Nối Bản Đồ</h4>
            <p className="text-xs text-white/70 leading-relaxed mt-2">
              Không thể tải hoặc hiển thị thông tin bản đồ vào lúc này. Vui lòng làm mới trang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
