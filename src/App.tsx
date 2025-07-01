import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import Map, {
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  Layer,
  LogoControl,
  MapRef,
  Marker,
  NavigationControl,
  ScaleControl,
  Source,
  StyleSpecification,
} from "react-map-gl/maplibre";
import styled from "styled-components";
import DrawTools from "./components/DrawTools";
// import type {FillLayer} from 'react-map-gl/maplibre';
import { Feature, FeatureCollection, LineString, Polygon } from "geojson";

const MapContainer = styled.div`
  width: 100%;
  height: 100vh;
`;

const StyledMap = styled(Map)`
  width: 100%;
  height: 100%;
`;

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    // terrainSource: {
    //   type: "raster-dem",
    //   url: "https://demotiles.maplibre.org/terrain-tiles/tiles.json",
    //   tileSize: 256,
    // },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
  // terrain: {
  //   source: "terrainSource",
  //   exaggeration: 1,
  // },
  sky: {},
};

export default function MapView() {
  const [viewState, setViewState] = useState({
    longitude: 126.978,
    latitude: 37.5665,
    zoom: 12,
    // pitch: 60,
    // bearing: -20,
  });
  const mapRef = useRef<MapRef>(null);
  const [mode, setMode] = useState<"draw" | "edit" | "view">("draw");
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  useEffect(() => {
    console.log("##mode", mode);

    if (!mapRef.current) return;
    const mapCanvas = mapRef.current.getCanvas();
    if (mapCanvas) {
      mapCanvas.style.cursor = mode === "draw" ? "crosshair" : "default";
    }
  }, [mode]);

  const handleCreate = (features: GeoJSON.Feature[]) => {
    setGeojson((prev) => ({
      ...prev,
      features: [...prev.features, ...features],
    }));
  };

  const handleUpdate = (features: GeoJSON.Feature[]) => {
    setGeojson((prev) => {
      const updatedIds = features.map((f) => f.id);
      const newFeatures = [
        ...prev.features.filter((f) => !updatedIds.includes(f.id)),
        ...features,
      ];
      return {
        ...prev,
        features: newFeatures,
      };
    });
  };

  const handleDelete = (features: GeoJSON.Feature[]) => {
    setGeojson((prev) => {
      const deletedIds = features.map((f) => f.id);
      return {
        ...prev,
        features: prev.features.filter((f) => !deletedIds.includes(f.id)),
      };
    });
  };
  const handleMarkerClick = () => {
    console.log("##marker clicked");
  };

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
    <MapContainer>
      <div style={{ position: "absolute", zIndex: 1, top: 10, left: 10 }}>
        <button
          // onClick={() => setMode("draw")}
          onClick={() => setIsDrawing(true)}
        >
          Draw
        </button>
        <button onClick={finishDrawing} disabled={!isDrawing}>
          폴리곤 그리기 종료
        </button>
        <button onClick={() => setMode("edit")}>Edit</button>
        <button onClick={() => setMode("view")}>View</button>
      </div>
      <StyledMap
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        mapLib={import("maplibre-gl")}
        onClick={handleClick}
      >
        <Marker
          longitude={126.978}
          latitude={37.5665}
          anchor="bottom"
          onClick={handleMarkerClick}
        >
          <div style={{ color: "red", fontSize: "24px" }}>📍</div>
        </Marker>

        <Layer
          id="landuse_park"
          type="fill"
          source="vector"
          source-layer="landuse"
          filter={["==", "class", "park"]}
          paint={{
            "fill-color": "red",
          }}
        />

        <NavigationControl />
        <AttributionControl customAttribution="Map design by me" />
        <FullscreenControl />
        <GeolocateControl
          onGeolocate={(e) => console.log("위치 찾음", e.coords)}
          onError={(e) => console.error("위치 에러", e)}
        />
        <LogoControl />
        <ScaleControl />
        {/* <TerrainControl source="terrainSource" /> */}
        {/* 지도에서 3D 지형(terrain)을 시각적으로 켜고 끄는 UI 컨트롤 버튼 */}
        {mapRef && (
          <DrawTools
            mapRef={mapRef}
            mode={mode}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
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
      </StyledMap>
      {/* MapProvider는 지도 여러개 일때 사용하기 */}
    </MapContainer>
  );
}
