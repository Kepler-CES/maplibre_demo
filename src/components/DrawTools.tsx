import { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useState } from "react";
import { Layer, MapRef, Source } from "react-map-gl/maplibre";
import { styled } from "styled-components";

interface DrawToolsProps {
  mapRef: React.RefObject<MapRef | null>;
  clickEvent: maplibregl.MapMouseEvent | null;
  dbClickEvent: maplibregl.MapMouseEvent | null;
  moveEvent: maplibregl.MapMouseEvent | null;
}

const IconDiv = styled.div<{ padding: number }>`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-filter: opacity(0.8);
  filter: opacity(0.8);
  padding: ${(props) => props.padding}px;
  box-sizing: border-box;
`;

function DrawTools({
  mapRef,
  clickEvent,
  dbClickEvent,
  moveEvent,
}: DrawToolsProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygons, setPolygons] = useState<Array<Array<[number, number]>>>([]);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [cursor, setCursor] = useState<{ lng: number; lat: number } | null>(
    null
  );
  const [isToolClicked, setIsToolClicked] = useState<boolean>();

  const polygonCoords =
    points.length >= 2 && cursor
      ? [
          ...points,
          [cursor.lng, cursor.lat],
          points[0], // 폴리곤 닫기
        ]
      : null;

  useEffect(() => {
    if (!isDrawing) return;
    if (clickEvent) {
      const { lng, lat } = clickEvent.lngLat;
      setPoints((prev) => [...prev, [lng, lat]]);
    }
  }, [clickEvent]);

  useEffect(() => {
    if (!isDrawing) return;

    if (dbClickEvent) {
      dbClickEvent.preventDefault(); // 줌 방지
      finishDrawing();
    }
  }, [dbClickEvent]);

  useEffect(() => {
    if (!isDrawing) return;

    if (moveEvent) {
      if (points.length >= 2) {
        setCursor({ lng: moveEvent.lngLat.lng, lat: moveEvent.lngLat.lat });
      }
    }
  }, [moveEvent]);

  // 그리기 종료
  const finishDrawing = useCallback(() => {
    if (points.length < 3) {
      alert("폴리곤은 최소 3개의 점이 필요해요!");
      return;
    }
    setPolygons((prev) => [...prev, points]);
    setPoints([]);
    setIsDrawing(false);
    setCursor(null);
  }, [points]);

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

  const pointsGeoJSON: FeatureCollection = {
    type: "FeatureCollection",
    features: points.map((coord, index) => ({
      type: "Feature",
      properties: { id: index },
      geometry: {
        type: "Point",
        coordinates: coord,
      },
    })),
  };

  return (
    <div>
      <div className="maplibregl-ctrl-top-right">
        <div
          className="maplibregl-ctrl maplibregl-ctrl-group"
          style={{ display: "flex", flexDirection: "row-reverse" }}
        >
          <button
            type="button"
            aria-label="Draw Tool"
            title="Draw Tool"
            onClick={() => setIsToolClicked((prev) => !prev)}
          >
            <IconDiv padding={3}>
              <img src="/draw-line.png" alt="draw" height={20} />
            </IconDiv>
          </button>
          {isToolClicked && (
            <>
              <button
                type="button"
                title="Polygon"
                aria-label="Polygon"
                aria-disabled="false"
                style={{
                  borderRight: "1px solid #ddd",
                  borderTop: "none",
                }}
                onClick={() => setIsDrawing(true)}
              >
                <IconDiv padding={0}>
                  <img src="/polygon.png" alt="draw" height={20} />
                </IconDiv>
              </button>
              <button
                type="button"
                title="Rectangle"
                aria-label="Rectangle"
                aria-disabled="false"
                style={{
                  borderRight: "1px solid #ddd",
                  borderLeft: "1px solid #ddd",
                  borderTop: "none",
                }}
              >
                <IconDiv padding={2}>
                  <img src="/rectangle.png" alt="draw" height={20} />
                </IconDiv>
              </button>
              <button
                type="button"
                title="Circle"
                aria-label="Circle"
                aria-disabled="false"
                style={{
                  borderLeft: "1px solid #ddd",
                  borderTop: "none",
                }}
              >
                <IconDiv padding={2}>
                  <img src="/circle.png" alt="draw" height={20} />
                </IconDiv>
              </button>
            </>
          )}
        </div>
      </div>

      <Source id="polygons" type="geojson" data={polygonGeoJSON}>
        <Layer
          id="polygon-fill"
          type="fill"
          paint={{ "fill-color": "rgba(248, 161, 55, 0.41)" }}
        />
        <Layer
          id="polygon-line"
          type="line"
          paint={{ "line-color": "orange", "line-width": 2 }}
        />
      </Source>

      {polygonCoords && (
        <Source
          id="temp-polygon"
          type="geojson"
          data={
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [polygonCoords],
              },
            } as Feature
          }
        >
          <Layer
            id="temp-polygon-layer"
            type="fill"
            paint={{ "fill-color": "#088", "fill-opacity": 0.5 }}
          />
        </Source>
      )}

      {currentLineString && (
        <>
          <Source id="current-line" type="geojson" data={currentLineString}>
            <Layer
              id="current-line-layer"
              type="line"
              paint={{
                "line-color": "blue",
                "line-width": 2,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>
        </>
      )}
      <Source id="current-points" type="geojson" data={pointsGeoJSON}>
        <Layer
          id="current-points-layer"
          type="circle"
          paint={{
            "circle-color": "blue",
            "circle-radius": 5,
          }}
        />
      </Source>
    </div>
  );
}

export default DrawTools;
