import { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import { useState } from "react";
import Map, { Layer, Source } from "react-map-gl/maplibre";

export default function App2() {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygons, setPolygons] = useState<Array<Array<[number, number]>>>([]);

  // 클릭하면 점 추가
  const handleClick = (evt: any) => {
    if (!isDrawing) return;
    const { lngLat } = evt;
    setPoints((prev) => [...prev, [lngLat.lng, lngLat.lat]]);
  };

  // 그리기 종료
  const finishDrawing = () => {
    if (points.length < 3) {
      alert("폴리곤은 최소 3개의 점이 필요해요!");
      return;
    }
    setPolygons((prev) => [...prev, points]);
    setPoints([]);
    setIsDrawing(false);
  };

  // GeoJSON 폴리곤 데이터 만들기
  const polygonGeoJSON: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: polygons.map((coords, i) => ({
      type: "Feature",
      properties: { id: i },
      geometry: {
        type: "Polygon",
        coordinates: [[...coords, coords[0]]], // 첫점 닫기
      },
    })),
  };

  // 현재 그리고 있는 점들 라인 스트링
  const currentLineString: Feature<LineString> | null =
    points.length > 1
      ? {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: points,
          },
        }
      : null;

  return (
    <div style={{ height: "100vh" }}>
      <button onClick={() => setIsDrawing(true)}>폴리곤 그리기 시작</button>
      <button onClick={finishDrawing} disabled={!isDrawing}>
        폴리곤 그리기 종료
      </button>

      <Map
        initialViewState={{
          longitude: 127,
          latitude: 37.5,
          zoom: 10,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://api.maptiler.com/maps/streets/style.json?key=YOUR_API_KEY"
        onClick={handleClick}
      >
        <Source id="polygons" type="geojson" data={polygonGeoJSON}>
          <Layer
            id="polygon-fill"
            type="fill"
            paint={{ "fill-color": "rgba(0, 0, 255, 0.3)" }}
          />
          <Layer
            id="polygon-line"
            type="line"
            paint={{ "line-color": "blue", "line-width": 2 }}
          />
        </Source>

        {currentLineString && (
          <Source id="current-line" type="geojson" data={currentLineString}>
            <Layer
              id="current-line-layer"
              type="line"
              paint={{
                "line-color": "red",
                "line-width": 2,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
