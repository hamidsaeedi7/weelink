"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Ellipse, RegularPolygon, Star, Line, Text as KText, Image as KImage, Transformer, Group } from "react-konva";
// Value import, not type-only: Konva.Filters is needed at runtime.
import Konva from "konva";
import { useEditor } from "@/lib/editor/store";
import { ensureFont } from "@/lib/editor/presets";
import type { Background, EditorObject, ImageCrop, ImageObject, ShapeObject, TextObject } from "@/lib/editor/types";

/** Distance (canvas px) within which an edge snaps to a guide. */
const SNAP_TOLERANCE = 12;

/** Instagram's UI covers roughly the top 250px and bottom 250px of a story. */
const SAFE_INSET_Y = 250;

interface Guide { axis: "x" | "y"; pos: number; }

// ─── Image node ──────────────────────────────────────────────────────────────

const ASPECT_RATIO: Record<string, number | null> = {
  original: null, "1:1": 1, "4:5": 4 / 5, "9:16": 9 / 16, "16:9": 16 / 9,
};

/**
 * Converts crop intent (ratio + zoom + pan) into the source-pixel rect Konva
 * wants. Kept here rather than in the store because it depends on the loaded
 * image's natural size, which only exists at render time.
 */
function cropRect(img: HTMLImageElement, crop?: ImageCrop) {
  if (!crop || (crop.aspect === "original" && crop.zoom === 1)) return undefined;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const target = ASPECT_RATIO[crop.aspect];

  // Largest rect of the requested ratio that fits inside the source.
  let w = nw;
  let h = nh;
  if (target) {
    if (nw / nh > target) w = nh * target;
    else h = nw / target;
  }
  const zoom = Math.max(1, crop.zoom);
  w /= zoom;
  h /= zoom;

  // Pan is expressed as -1..1 of the leftover space, so it can never escape
  // the source bounds no matter how the sliders are dragged.
  const maxX = nw - w;
  const maxY = nh - h;
  const x = maxX / 2 + (crop.offsetX * maxX) / 2;
  const y = maxY / 2 + (crop.offsetY * maxY) / 2;
  return { x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)), width: w, height: h };
}

// Konva needs a real HTMLImageElement, so each image object loads its own and
// re-renders once ready. crossOrigin is required or exporting the stage taints
// the canvas and toDataURL throws.
function ImageNode({ obj, ...rest }: { obj: ImageObject } & Record<string, any>) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const nodeRef = useRef<Konva.Image | null>(null);

  useEffect(() => {
    if (!obj.src) return;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = obj.src;
    const onLoad = () => setImg(image);
    image.addEventListener("load", onLoad);
    return () => image.removeEventListener("load", onLoad);
  }, [obj.src]);

  const f = obj.filters;
  const activeFilters = useMemo(() => {
    if (!f) return [];
    const list: any[] = [];
    if (f.brightness) list.push(Konva.Filters.Brighten);
    if (f.contrast) list.push(Konva.Filters.Contrast);
    if (f.saturation) list.push(Konva.Filters.HSL);
    if (f.blur) list.push(Konva.Filters.Blur);
    if (f.grayscale) list.push(Konva.Filters.Grayscale);
    if (f.sepia) list.push(Konva.Filters.Sepia);
    return list;
  }, [f]);

  // Konva filters only run against a cached bitmap, and the cache must be
  // rebuilt whenever the node's size, crop or filter set changes — otherwise
  // the filter silently applies to a stale raster.
  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !img) return;
    if (activeFilters.length) node.cache();
    else node.clearCache();
    node.getLayer()?.batchDraw();
  }, [img, activeFilters, obj.width, obj.height, obj.crop, obj.cornerRadius, f?.blur, f?.brightness, f?.contrast, f?.saturation]);

  if (!img) {
    return <Rect {...rest} width={obj.width} height={obj.height} fill="rgba(255,255,255,0.08)" cornerRadius={obj.cornerRadius} />;
  }

  // Flipping is a negative scale about the origin, so the position has to be
  // shifted by the full width/height to keep the visual box where it was.
  const flipX = !!obj.flipX;
  const flipY = !!obj.flipY;

  return (
    <KImage
      {...rest}
      ref={nodeRef}
      image={img}
      width={obj.width}
      height={obj.height}
      cornerRadius={obj.cornerRadius}
      crop={cropRect(img, obj.crop)}
      stroke={obj.stroke}
      strokeWidth={obj.strokeWidth ?? 0}
      x={rest.x + (flipX ? obj.width : 0)}
      y={rest.y + (flipY ? obj.height : 0)}
      scaleX={flipX ? -1 : 1}
      scaleY={flipY ? -1 : 1}
      filters={activeFilters}
      brightness={f?.brightness ?? 0}
      contrast={f?.contrast ?? 0}
      saturation={f?.saturation ?? 0}
      blurRadius={f?.blur ?? 0}
      shadowColor={obj.shadow?.color}
      shadowBlur={obj.shadow?.blur}
      shadowOffsetX={obj.shadow?.offsetX}
      shadowOffsetY={obj.shadow?.offsetY}
      shadowOpacity={obj.shadow?.opacity}
    />
  );
}

// ─── Shape node ──────────────────────────────────────────────────────────────
function ShapeNode({ obj, ...rest }: { obj: ShapeObject } & Record<string, any>) {
  const common = {
    ...rest,
    fill: obj.fill,
    stroke: obj.stroke,
    strokeWidth: obj.strokeWidth ?? 0,
  };
  switch (obj.shape) {
    case "ellipse":
      // Konva ellipses are centre-origin; offset keeps our top-left model intact.
      return <Ellipse {...common} radiusX={obj.width / 2} radiusY={obj.height / 2} offsetX={-obj.width / 2} offsetY={-obj.height / 2} />;
    case "triangle":
      return <RegularPolygon {...common} sides={3} radius={obj.width / 2} offsetX={-obj.width / 2} offsetY={-obj.height / 2} />;
    case "star":
      return <Star {...common} numPoints={5} innerRadius={obj.width / 4} outerRadius={obj.width / 2} offsetX={-obj.width / 2} offsetY={-obj.height / 2} />;
    case "line":
      return <Line {...common} points={[0, obj.height / 2, obj.width, obj.height / 2]} stroke={obj.fill} strokeWidth={obj.strokeWidth || 8} lineCap="round" />;
    default:
      return <Rect {...common} width={obj.width} height={obj.height} cornerRadius={obj.cornerRadius ?? 0} />;
  }
}

// ─── Text node ───────────────────────────────────────────────────────────────
function TextNode({ obj, ...rest }: { obj: TextObject } & Record<string, any>) {
  const [, force] = useState(0);

  // Repaint once the face is actually available, otherwise the first paint
  // silently uses a fallback face and the layout is wrong.
  useEffect(() => {
    let alive = true;
    ensureFont(obj.fontFamily, obj.fontWeight).then(() => { if (alive) force((n) => n + 1); });
    return () => { alive = false; };
  }, [obj.fontFamily, obj.fontWeight]);

  const g = obj.fillGradient;
  const gradientProps = g
    ? (() => {
        const rad = ((g.angle - 90) * Math.PI) / 180;
        const w = obj.width;
        const h = obj.height;
        return {
          fillPriority: "linear-gradient",
          fillLinearGradientStartPoint: { x: w / 2 - (Math.cos(rad) * w) / 2, y: h / 2 - (Math.sin(rad) * h) / 2 },
          fillLinearGradientEndPoint: { x: w / 2 + (Math.cos(rad) * w) / 2, y: h / 2 + (Math.sin(rad) * h) / 2 },
          fillLinearGradientColorStops: [0, g.from, 1, g.to],
        };
      })()
    : {};

  // Highlight sits behind the glyphs, so it must be its own node painted
  // first — Konva.Text has no background fill of its own.
  const highlight = obj.backgroundFill ? (
    <Rect
      x={rest.x - (obj.backgroundPadding ?? 16)}
      y={rest.y - (obj.backgroundPadding ?? 16) / 2}
      width={obj.width + (obj.backgroundPadding ?? 16) * 2}
      height={obj.height + (obj.backgroundPadding ?? 16)}
      rotation={rest.rotation}
      opacity={rest.opacity}
      fill={obj.backgroundFill}
      cornerRadius={obj.backgroundRadius ?? 12}
      listening={false}
    />
  ) : null;

  return (
    <>
    {highlight}
    <KText
      {...rest}
      text={obj.text}
      width={obj.width}
      fontSize={obj.fontSize}
      fontFamily={obj.fontFamily}
      fontStyle={String(obj.fontWeight)}
      fill={obj.fill}
      align={obj.align}
      lineHeight={obj.lineHeight}
      letterSpacing={obj.letterSpacing}
      textDecoration={obj.textDecoration ?? ""}
      stroke={obj.stroke}
      strokeWidth={obj.strokeWidth ?? 0}
      // Canvas 2D runs the real Unicode bidi algorithm, so Persian shapes and
      // orders correctly from plain logical text — no word reversal needed.
      direction={obj.direction}
      shadowColor={obj.shadow?.color}
      shadowBlur={obj.shadow?.blur}
      shadowOffsetX={obj.shadow?.offsetX}
      shadowOffsetY={obj.shadow?.offsetY}
      shadowOpacity={obj.shadow?.opacity}
      {...gradientProps}
    />
    </>
  );
}

function backgroundProps(bg: Background, w: number, h: number) {
  if (bg.type === "solid") return { fill: bg.color };
  if (bg.type === "gradient") {
    const rad = ((bg.angle - 90) * Math.PI) / 180;
    return {
      fillLinearGradientStartPoint: { x: w / 2 - (Math.cos(rad) * w) / 2, y: h / 2 - (Math.sin(rad) * h) / 2 },
      fillLinearGradientEndPoint: { x: w / 2 + (Math.cos(rad) * w) / 2, y: h / 2 + (Math.sin(rad) * h) / 2 },
      fillLinearGradientColorStops: [0, bg.from, 1, bg.to],
    };
  }
  return { fill: "#111" };
}

export interface EditorCanvasHandle { stage: Konva.Stage | null; }

export function EditorCanvas({
  stageRef,
  showSafeZone = true,
  exporting = false,
  transparentBg = false,
}: {
  stageRef?: React.MutableRefObject<Konva.Stage | null>;
  showSafeZone?: boolean;
  /**
   * Editing chrome (safe-zone bands, selection transformer) lives in the same
   * Konva layer as the artwork, so stage.toDataURL() bakes it into the file.
   * The export flow flips this on for the duration of the capture.
   */
  exporting?: boolean;
  transparentBg?: boolean;
}) {
  const doc = useEditor((s) => s.doc);
  const activePageId = useEditor((s) => s.activePageId);
  const selectedIds = useEditor((s) => s.selectedIds);
  const zoom = useEditor((s) => s.zoom);
  const select = useEditor((s) => s.select);
  const clearSelection = useEditor((s) => s.clearSelection);
  const patchObject = useEditor((s) => s.patchObject);
  const beginTransaction = useEditor((s) => s.beginTransaction);

  const page = doc.pages.find((p) => p.id === activePageId) ?? doc.pages[0];
  const { width: CW, height: CH } = doc.canvas;

  const localStageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);

  // Keep the transformer attached to whatever is selected.
  useEffect(() => {
    const tr = trRef.current;
    const layer = layerRef.current;
    if (!tr || !layer) return;
    const nodes = selectedIds
      .map((id) => layer.findOne(`#${id}`))
      .filter((n): n is Konva.Node => Boolean(n));
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, page.objects]);

  const objects = page.objects;

  /** Candidate snap lines: canvas centre, edges, and every other object's edges. */
  const snapTargets = useMemo(() => {
    const xs = [0, CW / 2, CW];
    const ys = [0, CH / 2, CH, SAFE_INSET_Y, CH - SAFE_INSET_Y];
    return { xs, ys };
  }, [CW, CH]);

  const applySnap = (obj: EditorObject, x: number, y: number) => {
    const found: Guide[] = [];
    let nx = x;
    let ny = y;
    const edgesX = [x, x + obj.width / 2, x + obj.width];
    const edgesY = [y, y + obj.height / 2, y + obj.height];

    for (const target of snapTargets.xs) {
      for (let i = 0; i < edgesX.length; i++) {
        if (Math.abs(edgesX[i] - target) < SNAP_TOLERANCE) {
          nx = target - (i === 0 ? 0 : i === 1 ? obj.width / 2 : obj.width);
          found.push({ axis: "x", pos: target });
        }
      }
    }
    for (const target of snapTargets.ys) {
      for (let i = 0; i < edgesY.length; i++) {
        if (Math.abs(edgesY[i] - target) < SNAP_TOLERANCE) {
          ny = target - (i === 0 ? 0 : i === 1 ? obj.height / 2 : obj.height);
          found.push({ axis: "y", pos: target });
        }
      }
    }
    setGuides(found);
    return { x: nx, y: ny };
  };

  const stageW = CW * zoom;
  const stageH = CH * zoom;

  return (
    <Stage
      ref={(node) => {
        localStageRef.current = node;
        if (stageRef) stageRef.current = node;
      }}
      width={stageW}
      height={stageH}
      scaleX={zoom}
      scaleY={zoom}
      onMouseDown={(e) => { if (e.target === e.target.getStage()) clearSelection(); }}
      onTouchStart={(e) => { if (e.target === e.target.getStage()) clearSelection(); }}
      style={{ touchAction: "none" }}
    >
      <Layer ref={layerRef}>
        {/* Background — omitted entirely for a transparent PNG export */}
        {!(exporting && transparentBg) && (
          <Rect x={0} y={0} width={CW} height={CH} {...backgroundProps(page.background, CW, CH)} listening={false} />
        )}

        {/* Objects, painted in array order = layer order (last on top) */}
        {objects.map((obj) => {
          if (!obj.visible) return null;
          const shared = {
            id: obj.id,
            x: obj.x,
            y: obj.y,
            rotation: obj.rotation,
            opacity: obj.opacity,
            draggable: !obj.locked,
            onMouseDown: (e: any) => { e.cancelBubble = true; select([obj.id]); },
            onTouchStart: (e: any) => { e.cancelBubble = true; select([obj.id]); },
            onDragStart: () => beginTransaction(),
            onDragMove: (e: any) => {
              const snapped = applySnap(obj, e.target.x(), e.target.y());
              e.target.x(snapped.x);
              e.target.y(snapped.y);
            },
            onDragEnd: (e: any) => {
              setGuides([]);
              patchObject(obj.id, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) });
            },
            onTransformStart: () => beginTransaction(),
            onTransformEnd: (e: any) => {
              const node = e.target as Konva.Node;
              // Konva reports resize as a scale; fold it back into width/height
              // so the model never carries a scale factor. abs() because a
              // flipped image legitimately renders at scale -1 and must not
              // produce a negative width.
              const flippedX = !!(obj as ImageObject).flipX;
              const flippedY = !!(obj as ImageObject).flipY;
              const sx = Math.abs(node.scaleX());
              const sy = Math.abs(node.scaleY());
              node.scaleX(flippedX ? -1 : 1);
              node.scaleY(flippedY ? -1 : 1);
              const width = Math.max(20, Math.round(obj.width * sx));
              const height = Math.max(20, Math.round(obj.height * sy));
              patchObject(obj.id, {
                // Undo the flip offset applied at render time.
                x: Math.round(node.x() - (flippedX ? width : 0)),
                y: Math.round(node.y() - (flippedY ? height : 0)),
                width,
                height,
                rotation: Math.round(node.rotation()),
              } as Partial<EditorObject>);
            },
          };

          if (obj.type === "text") return <TextNode key={obj.id} obj={obj} {...shared} />;
          if (obj.type === "image") return <ImageNode key={obj.id} obj={obj} {...shared} />;
          return <ShapeNode key={obj.id} obj={obj} {...shared} />;
        })}

        {/* Safe zone — where Instagram's own UI will cover the design */}
        {showSafeZone && !exporting && (
          <Group listening={false}>
            <Rect x={0} y={0} width={CW} height={SAFE_INSET_Y} fill="rgba(255,0,80,0.06)" />
            <Rect x={0} y={CH - SAFE_INSET_Y} width={CW} height={SAFE_INSET_Y} fill="rgba(255,0,80,0.06)" />
            <Line points={[0, SAFE_INSET_Y, CW, SAFE_INSET_Y]} stroke="rgba(255,0,80,0.35)" strokeWidth={2} dash={[12, 12]} />
            <Line points={[0, CH - SAFE_INSET_Y, CW, CH - SAFE_INSET_Y]} stroke="rgba(255,0,80,0.35)" strokeWidth={2} dash={[12, 12]} />
          </Group>
        )}

        {/* Snap guides */}
        {!exporting && guides.map((g, i) =>
          g.axis === "x" ? (
            <Line key={`gx${i}`} points={[g.pos, 0, g.pos, CH]} stroke="#14C7A5" strokeWidth={2} listening={false} />
          ) : (
            <Line key={`gy${i}`} points={[0, g.pos, CW, g.pos]} stroke="#14C7A5" strokeWidth={2} listening={false} />
          ),
        )}

        <Transformer
          ref={trRef}
          visible={!exporting}
          rotateEnabled
          keepRatio={false}
          anchorSize={14}
          anchorCornerRadius={7}
          borderStroke="#14C7A5"
          anchorStroke="#14C7A5"
          anchorFill="#ffffff"
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
        />
      </Layer>
    </Stage>
  );
}
