/**
 * Project data model for the story editor.
 *
 * Design rules that matter later:
 * - Everything is serialisable JSON. A project is fully reconstructable from
 *   this alone, which is what makes autosave, version history and
 *   server-side re-render possible without extra state.
 * - `version` is stamped on every document so future shape changes can be
 *   migrated instead of breaking saved projects.
 * - `pages` is an array from day one even though phase 1 only ever creates
 *   one. Multi-page later needs no migration.
 * - Object geometry is stored in CANVAS coordinates (1080×1920 space), never
 *   in screen pixels — zoom and device size must not affect the saved design.
 */

export const EDITOR_VERSION = 1;

export type ObjectType = "text" | "image" | "shape";

export type ShapeKind = "rect" | "ellipse" | "triangle" | "star" | "line";

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

interface BaseObject {
  id: string;
  type: ObjectType;
  /** Shown in the layers panel; user-renameable. */
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  /** 0..1 */
  opacity: number;
  locked: boolean;
  visible: boolean;
}

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fill: string;
  align: "right" | "center" | "left";
  /**
   * Explicit per-object direction. Canvas 2D applies the real Unicode bidi
   * algorithm, so unlike the satori path we do NOT need to pre-reverse words
   * — we only need to tell it which base direction to use.
   */
  direction: "rtl" | "ltr";
  lineHeight: number;
  letterSpacing: number;
  /** Needed for "was 250,000" pricing, where the old price is struck through. */
  textDecoration?: "line-through" | "underline" | "none";
  stroke?: string;
  strokeWidth?: number;
  shadow?: Shadow;
  /** Highlight/label style behind the text. */
  backgroundFill?: string;
  backgroundPadding?: number;
  backgroundRadius?: number;
}

export interface ImageObject extends BaseObject {
  type: "image";
  src: string;
  cornerRadius: number;
  shadow?: Shadow;
}

export interface ShapeObject extends BaseObject {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  shadow?: Shadow;
}

export type EditorObject = TextObject | ImageObject | ShapeObject;

export type Background =
  | { type: "solid"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | { type: "image"; src: string; dim: number };

export interface Page {
  id: string;
  background: Background;
  objects: EditorObject[];
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface Project {
  version: number;
  id: string;
  name: string;
  canvas: CanvasSize;
  presetKey: string;
  pages: Page[];
  updatedAt: string;
}

/** Narrowing helpers — cheaper and safer than casting at every call site. */
export const isText = (o: EditorObject): o is TextObject => o.type === "text";
export const isImage = (o: EditorObject): o is ImageObject => o.type === "image";
export const isShape = (o: EditorObject): o is ShapeObject => o.type === "shape";
