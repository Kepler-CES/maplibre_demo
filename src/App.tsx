import "maplibre-gl/dist/maplibre-gl.css";
import { useRef, useState } from "react";
import Map, {
  AttributionControl,
  FullscreenControl,
  GeolocateControl,
  LogoControl,
  MapRef,
  Marker,
  NavigationControl,
  ScaleControl,
  StyleSpecification,
} from "react-map-gl/maplibre";
import styled from "styled-components";
import DrawTools from "./components/DrawTools";
// import type {FillLayer} from 'react-map-gl/maplibre';

// import { DrawToolsControl } from "./components/DrawToolsControl";

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
  const [clickEvent, setClickEvent] = useState<maplibregl.MapMouseEvent | null>(
    null
  );
  const [dbClickEvent, setDbClickEvent] =
    useState<maplibregl.MapMouseEvent | null>(null);
  const [moveEvent, setMoveEvent] = useState<maplibregl.MapMouseEvent | null>(
    null
  );

  return (
    <MapContainer>
      <StyledMap
        {...viewState}
        ref={mapRef}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        mapLib={import("maplibre-gl")}
        doubleClickZoom={false}
        onClick={(e: any) => setClickEvent(e)}
        onDblClick={(e: any) => setDbClickEvent(e)}
        onMouseMove={(e: any) => setMoveEvent(e)} //이벤트 디바운싱 하니까 마우스 움직임에 따라 임시 폴리곤이 보이지 않는다
      >
        <Marker longitude={126.978} latitude={37.5665} anchor="bottom">
          <div style={{ color: "red", fontSize: "24px" }}>📍</div>
        </Marker>

        <NavigationControl position="top-left" />
        <FullscreenControl position="top-left" />
        <GeolocateControl
          position="top-left"
          onGeolocate={(e) => console.log("위치 찾음", e.coords)}
          onError={(e) => console.error("위치 에러", e)}
        />
        <LogoControl />
        <AttributionControl customAttribution="Map design by me" />
        <ScaleControl />
        {/* <TerrainControl source="terrainSource" /> */}
        {/* 지도에서 3D 지형(terrain)을 시각적으로 켜고 끄는 UI 컨트롤 버튼 */}
        <DrawTools
          mapRef={mapRef}
          clickEvent={clickEvent}
          dbClickEvent={dbClickEvent}
          moveEvent={moveEvent}
        />
      </StyledMap>
      {/* MapProvider는 지도 여러개 일때 사용하기 */}
    </MapContainer>
  );
}
