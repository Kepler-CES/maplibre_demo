import { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, MapRef, Marker, Source } from "react-map-gl/maplibre";
import { styled } from "styled-components";

interface DrawToolsProps {
  mapRef: React.RefObject<MapRef | null>;
}
const POLY = "polygon";
const CIRC = "circle";
const RECT = "rect";
type DrawMode = "polygon" | "circle" | "rect" | null;

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

const RadiusLabel = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 4px 10px;
  font-weight: 600;
  font-size: 15px;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  pointer-events: none;
  transform: translateY(-10px);
  white-space: nowrap;
`;

function DrawTools({ mapRef }: DrawToolsProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [polygons, setPolygons] = useState<Array<Array<[number, number]>>>([]);
  const [circles, setCircles] = useState<
    Array<{ center: [number, number]; radius: number }>
  >([]);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [cursor, setCursor] = useState<{ lng: number; lat: number } | null>(
    null
  );
  const [isToolClicked, setIsToolClicked] = useState<boolean>();
  const [circleTemp, setCircleTemp] = useState<{
    center: [number, number];
    radius: number;
  } | null>(null);
  const [rectangles, setRectangles] = useState<
    Array<[[number, number], [number, number]]>
  >([]);
  const [rectTemp, setRectTemp] = useState<{
    start: [number, number];
    end: [number, number];
  } | null>(null);

  const pointsRef = useRef(points);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    if (!isDrawing) return;
    if (drawMode === POLY) {
      const handleClick = (e: maplibregl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        setPoints((prev) => [...prev, [lng, lat]]);
      };
      const handleDblClick = (e: maplibregl.MapMouseEvent) => {
        e.preventDefault();
        finishDrawing();
      };
      const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
        if (pointsRef.current.length >= 2) {
          setCursor({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        }
      };
      map.on("click", handleClick);
      map.on("dblclick", handleDblClick);
      map.on("mousemove", handleMouseMove);
      return () => {
        map.off("click", handleClick);
        map.off("dblclick", handleDblClick);
        map.off("mousemove", handleMouseMove);
      };
    }
    if (drawMode === CIRC) {
      let wheelTimeout: NodeJS.Timeout | null = null;
      const handleClick = (e: maplibregl.MapMouseEvent) => {
        if (!circleTemp) {
          setCircleTemp({ center: [e.lngLat.lng, e.lngLat.lat], radius: 100 });
        } else {
          setCircles((prev) => [
            ...prev,
            { center: circleTemp.center, radius: circleTemp.radius },
          ]);
          setCircleTemp(null);
          setIsDrawing(false);
          setDrawMode(null);
        }
      };
      const handleWheel = (e: maplibregl.MapWheelEvent) => {
        if (circleTemp) {
          e.preventDefault();
          //TODO: 마우스 휠 움직일때 뒤에 배경 움직이는거 방지필요
          let nextRadius =
            circleTemp.radius + (e.originalEvent.deltaY > 0 ? 20 : -20);
          if (nextRadius < 20) nextRadius = 20;
          setCircleTemp({ ...circleTemp, radius: nextRadius });
        }
      };
      map.on("click", handleClick);
      map.on("wheel", handleWheel);
      return () => {
        map.off("click", handleClick);
        map.off("wheel", handleWheel);
      };
    }
    if (drawMode === RECT) {
      let isRectStarted = false;
      const handleClick = (e: maplibregl.MapMouseEvent) => {
        if (!rectTemp) {
          setRectTemp({
            start: [e.lngLat.lng, e.lngLat.lat],
            end: [e.lngLat.lng, e.lngLat.lat],
          });
          isRectStarted = true;
        }
      };
      const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
        if (rectTemp) {
          setRectTemp({ ...rectTemp, end: [e.lngLat.lng, e.lngLat.lat] });
        }
      };
      const handleDblClick = (e: maplibregl.MapMouseEvent) => {
        if (rectTemp) {
          e.preventDefault();
          setRectTemp({ ...rectTemp, end: [e.lngLat.lng, e.lngLat.lat] });
          setRectangles((prev) => [
            ...prev,
            [rectTemp.start, [e.lngLat.lng, e.lngLat.lat]],
          ]);
          setRectTemp(null);
          setIsDrawing(false);
          setDrawMode(null);
        }
      };
      map.on("click", handleClick);
      map.on("mousemove", handleMouseMove);
      map.on("dblclick", handleDblClick);
      return () => {
        map.off("click", handleClick);
        map.off("mousemove", handleMouseMove);
        map.off("dblclick", handleDblClick);
      };
    }
  }, [mapRef, isDrawing, drawMode, circleTemp, rectTemp]);

  function getDistance(a: [number, number], b: [number, number]) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLng = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const aVal =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  }

  function circleToPolygon(
    center: [number, number],
    radius: number,
    steps = 64
  ): [number, number][] {
    const coords: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const dx = radius * Math.cos(angle);
      const dy = radius * Math.sin(angle);
      const deltaLng = dx / (111320 * Math.cos((center[1] * Math.PI) / 180));
      const deltaLat = dy / 110540;
      coords.push([center[0] + deltaLng, center[1] + deltaLat]);
    }
    return coords;
  }

  const finishDrawing = useCallback(() => {
    if (pointsRef.current.length < 3) {
      alert("폴리곤은 최소 3개의 점이 필요해요!");
      return;
    }
    setPolygons((prev) => [...prev, pointsRef.current]);
    setPoints([]);
    setIsDrawing(false);
    setCursor(null);
  }, []);

  const polygonCoords =
    points.length >= 2 && cursor
      ? [...points, [cursor.lng, cursor.lat], points[0]]
      : null;

  const polygonGeoJSON: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: polygons.map((coords, i) => ({
      type: "Feature",
      properties: { id: i },
      geometry: {
        type: "Polygon",
        coordinates: [[...coords, coords[0]]],
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

  const circlesGeoJSON: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: circles.map((circle, i) => ({
      type: "Feature",
      properties: { id: i },
      geometry: {
        type: "Polygon",
        coordinates: [circleToPolygon(circle.center, circle.radius)],
      },
    })),
  };

  const tempCircleGeoJSON: FeatureCollection<Polygon> | null = circleTemp
    ? {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                circleToPolygon(circleTemp.center, circleTemp.radius),
              ],
            },
          },
        ],
      }
    : null;

  function rectToPolygon(
    start: [number, number],
    end: [number, number]
  ): [number, number][] {
    const [x1, y1] = start;
    const [x2, y2] = end;
    return [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
      [x1, y1],
    ];
  }

  const rectanglesGeoJSON: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: rectangles.map((rect, i) => ({
      type: "Feature",
      properties: { id: i },
      geometry: {
        type: "Polygon",
        coordinates: [rectToPolygon(rect[0], rect[1])],
      },
    })),
  };

  const tempRectGeoJSON: FeatureCollection<Polygon> | null = rectTemp
    ? {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [rectToPolygon(rectTemp.start, rectTemp.end)],
            },
          },
        ],
      }
    : null;

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
                  opacity: isDrawing && drawMode !== POLY ? "0.5" : "1",
                }}
                onClick={() => {
                  setIsDrawing(true);
                  setDrawMode(POLY);
                }}
                disabled={isDrawing && drawMode !== POLY}
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
                  opacity: isDrawing && drawMode !== RECT ? "0.5" : "1",
                }}
                onClick={() => {
                  setIsDrawing(true);
                  setDrawMode(RECT);
                }}
                disabled={isDrawing && drawMode !== RECT}
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
                  opacity: isDrawing && drawMode !== CIRC ? "0.5" : "1",
                }}
                onClick={() => {
                  setIsDrawing(true);
                  setDrawMode(CIRC);
                }}
                disabled={isDrawing && drawMode !== CIRC}
              >
                <IconDiv padding={2}>
                  <img src="/circle.png" alt="draw" height={20} />
                </IconDiv>
              </button>
            </>
          )}
        </div>
      </div>
      {/* 완성 폴리곤 */}
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
      {/* 완성 원 */}
      <Source id="circles" type="geojson" data={circlesGeoJSON}>
        <Layer
          id="circle-fill"
          type="fill"
          paint={{ "fill-color": "rgba(248, 161, 55, 0.41)" }}
        />
        <Layer
          id="circle-line"
          type="line"
          paint={{ "line-color": "orange", "line-width": 2 }}
        />
      </Source>
      {/* 완성 사각형 */}
      <Source id="rectangles" type="geojson" data={rectanglesGeoJSON}>
        <Layer
          id="rectangle-fill"
          type="fill"
          paint={{ "fill-color": "rgba(248, 161, 55, 0.41)" }}
        />
        <Layer
          id="rectangle-line"
          type="line"
          paint={{ "line-color": "orange", "line-width": 2 }}
        />
      </Source>
      {/* 폴리곤 임시 모양 */}
      {drawMode === POLY && polygonCoords && (
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
            paint={{ "fill-color": "#088", "fill-opacity": 0.3 }}
          />
        </Source>
      )}
      {/* 폴리곤 선 */}
      {drawMode === POLY && currentLineString && (
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
      )}
      {/* 폴리곤 점 */}
      {drawMode === POLY && (
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
      )}
      {/* 임시 원 */}
      {tempCircleGeoJSON && (
        <>
          <Source id="temp-circle" type="geojson" data={tempCircleGeoJSON}>
            <Layer
              id="temp-circle-fill"
              type="fill"
              paint={{
                "fill-color": "#088",
                "fill-opacity": 0.3,
                "fill-outline-color": "blue",
              }}
            />
          </Source>
          {circleTemp && (
            <Marker
              longitude={circleTemp.center[0]}
              latitude={circleTemp.center[1]}
              anchor="bottom"
            >
              <RadiusLabel>
                반지름: {Math.round(circleTemp.radius)} m
              </RadiusLabel>
            </Marker>
          )}
        </>
      )}
      {/* 임시 사각형 */}
      {tempRectGeoJSON && (
        <Source id="temp-rectangle" type="geojson" data={tempRectGeoJSON}>
          <Layer
            id="temp-rectangle-fill"
            type="fill"
            paint={{ "fill-color": "#088", "fill-opacity": 0.3 }}
          />
          <Layer
            id="temp-rectangle-line"
            type="line"
            paint={{
              "line-color": "blue",
              "line-width": 2,
              "line-dasharray": [2, 2],
            }}
          />
        </Source>
      )}
    </div>
  );
}

export default DrawTools;
