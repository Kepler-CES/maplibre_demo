// src/components/AdminBoundaryLayer.tsx
import { Layer, Source } from "react-map-gl/maplibre";

const adminBoundaryGeojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "서울시" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [126.75, 37.45],
            [127.2, 37.45],
            [127.2, 37.7],
            [126.75, 37.7],
            [126.75, 37.45],
          ],
        ],
      },
    },
  ],
};

export default function AdminBoundaryLayer() {
  return (
    <Source id="admin-boundary" type="geojson" data={""}>
      <Layer
        id="admin-boundary-layer"
        type="line"
        paint={{
          "line-color": "#ff6600",
          "line-width": 2,
        }}
      />
    </Source>
  );
}
