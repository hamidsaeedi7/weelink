"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Ellipse, RegularPolygon, Star, Line, Text as KText, Image as KImage, Transformer, Group } from "react-konva";
import type Konva from "konva";
import { useEditor } from "@/lib/editor/store";
import { ensureFont } from "@/lib/editor/presets";
import type { Background, EditorObject, ImageObject, ShapeObject, TextObject } from "@/lib/editor/types";

/** Distance (canvas px) within which an edge snaps to a guide. */
const SNAP_TOLERANCE = 12;

/** Instagram's UI covers roughly the top 250px and bottom 250px of a story. */
const SAFE_INSET_Y = 250;

interface Guide { axis: "x" | "y"; pos: number; }

// ─── Image node ──────────────────────────────────────────────────────────────
// Konva needs a real HTMLImageElement, so each image object loads its own and
// re-renders once ready. crossOrigin is required or exporting the stage taints
// the canvas and toDataURL throws.
function ImageNode({ obj, ...rest }: { obj: ImageObject } & Record<string, any>) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!obj.src) return;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = obj.src;
    const onLoad = () => setImg(image);
    image.addEventListener("load", onLoad);
    return () => image.removeEventListener("load", onLoad);
  }, [obj.src]);

  if (!img) {
    return <Rect {...rest} width={obj.width} height={obj.height} fill="rgba(255,255,255,0.08)" cornerRadius={obj.cornerRadius} />;
  }
  return (
    <KImage
      {...rest}
      image={img}
      width={obj.width}
      height={obj.height}
      cornerRadius={obj.cornerRadius}
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

  return (
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
    />
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
              // so the model never carries a scale factor.
              const sx = node.scaleX();
              const sy = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);
              patchObject(obj.id, {
                x: Math.round(node.x()),
                y: Math.round(node.y()),
                width: Math.max(20, Math.round(obj.width * sx)),
                height: Math.max(20, Math.round(obj.height * sy)),
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
