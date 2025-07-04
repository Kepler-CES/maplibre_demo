import "maplibre-gl/dist/maplibre-gl.css";
import { useRef, useState } from "react";
import Map, {
  FullscreenControl,
  GeolocateControl,
  MapRef,
  Marker,
  NavigationControl,
  ScaleControl,
  StyleSpecification,
} from "react-map-gl/maplibre";
import styled from "styled-components";
import DrawTools from "./components/DrawTools";

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
  sky: {},
};

export default function MapView() {
  const [viewState, setViewState] = useState({
    longitude: 126.978,
    latitude: 37.5665,
    zoom: 12,
  });
  const mapRef = useRef<MapRef>(null);

  return (
    <MapContainer>
      <StyledMap
        {...viewState}
        ref={mapRef}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        mapLib={import("maplibre-gl")}
        doubleClickZoom={false}
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
        {/* <LogoControl /> */}
        {/* <AttributionControl customAttribution="Map design by Kepler" /> */}
        <ScaleControl />
        <DrawTools mapRef={mapRef} />
      </StyledMap>
    </MapContainer>
  );
}
