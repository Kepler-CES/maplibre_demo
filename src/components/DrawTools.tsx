// components/DrawControl.tsx
import mapboxDraw from "@mapbox/mapbox-gl-draw";
import type { Map } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/maplibre";

type DrawMode = "draw" | "edit" | "view";

type DrawControlProps = {
  mapRef: React.RefObject<MapRef | null>;
  mode: DrawMode;
  onCreate?: (features: GeoJSON.Feature[]) => void;
  onUpdate?: (features: GeoJSON.Feature[]) => void;
  onDelete?: (features: GeoJSON.Feature[]) => void;
};

export default function DrawControl({
  mapRef,
  mode,
  onCreate = () => {},
  onUpdate = () => {},
  onDelete = () => {},
}: DrawControlProps) {
  const draw = useRef<any>(null);

  useEffect(() => {
    const map = mapRef.current?.getMap() as Map;

    if (!map || map.getSource("mapbox-gl-draw-cold")) return;

    draw.current = new mapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });

    map.addControl(draw.current);

    const handleCreate = (e: any) => onCreate(e.features);
    const handleUpdate = (e: any) => onUpdate(e.features);
    const handleDelete = (e: any) => onDelete(e.features);

    map.on("draw.create", handleCreate);
    map.on("draw.update", handleUpdate);
    map.on("draw.delete", handleDelete);

    return () => {
      map.off("draw.create", handleCreate);
      map.off("draw.update", handleUpdate);
      map.off("draw.delete", handleDelete);
      map.removeControl(draw.current);
    };
  }, []);

  // 👉 모드 전환 처리
  useEffect(() => {
    if (!draw.current) return;

    if (mode === "draw") {
      draw.current.changeMode("draw_polygon");
    } else if (mode === "edit") {
      draw.current.changeMode("simple_select"); // 선택 모드
    } else if (mode === "view") {
      draw.current.changeMode("simple_select");
      // 선택은 가능하지만 편집 막고 싶으면 아래 코드 추가
      const features = draw.current.getAll();
      draw.current.set(features); // 편집모드에서 interaction 없애려면 custom 필요
    }
  }, [mode]);

  return null;
}
