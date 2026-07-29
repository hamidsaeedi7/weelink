"use client";

import { create } from "zustand";
import type { Background, EditorObject, Page, Project } from "./types";
import { createEmptyPage, createStarterProject, uid } from "./presets";

const HISTORY_LIMIT = 50;

/**
 * History model — the part worth understanding before touching this file.
 *
 * A naive editor snapshots on every mutation, which means one drag produces
 * hundreds of undo steps and undo becomes useless. Instead, history is
 * explicitly transactional:
 *
 *   beginTransaction()  → snapshot the current doc (call ONCE, on drag start
 *                         or before a discrete change)
 *   patchObject(...)    → free-form live mutation, no snapshot
 *
 * So a whole drag/resize collapses into exactly one undo step, and a click on
 * a colour swatch is also exactly one. Discrete actions (add/delete/reorder)
 * call beginTransaction() for you.
 */
interface EditorState {
  doc: Project;
  past: Project[];
  future: Project[];
  activePageId: string;
  selectedIds: string[];
  /** Screen px per canvas px. Never persisted — it's a viewport concern. */
  zoom: number;

  // history
  beginTransaction: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // document
  loadProject: (p: Project) => void;
  renameProject: (name: string) => void;
  setBackground: (bg: Background) => void;

  // objects
  addObject: (o: EditorObject) => void;
  /** Adds several objects as ONE undo step — used by the elements picker. */
  addObjects: (list: EditorObject[]) => void;
  /** Applies a patch to every text object on the active page. */
  patchAllText: (patch: Partial<EditorObject>) => void;
  patchObject: (id: string, patch: Partial<EditorObject>) => void;
  removeObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;
  reorder: (id: string, direction: "front" | "back" | "forward" | "backward") => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;

  // pages
  addPage: () => void;
  duplicatePage: (id: string) => void;
  removePage: (id: string) => void;
  setActivePage: (id: string) => void;
  setPageDuration: (id: string, seconds: number) => void;

  // selection / viewport
  select: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setZoom: (z: number) => void;

  // derived
  activePage: () => Page;
  selectedObjects: () => EditorObject[];
}

const clone = <T,>(v: T): T =>
  typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));

const touch = (doc: Project): Project => ({ ...doc, updatedAt: new Date().toISOString() });

export const useEditor = create<EditorState>((set, get) => {
  const starter = createStarterProject();

  /** Applies a mutation to the active page's object list. */
  const mutatePage = (fn: (page: Page) => void) => {
    set((s) => {
      const doc = clone(s.doc);
      const page = doc.pages.find((p) => p.id === s.activePageId) ?? doc.pages[0];
      fn(page);
      return { doc: touch(doc) };
    });
  };

  return {
    doc: starter,
    past: [],
    future: [],
    activePageId: starter.pages[0].id,
    selectedIds: [],
    zoom: 1,

    beginTransaction: () =>
      set((s) => ({
        past: [...s.past, clone(s.doc)].slice(-HISTORY_LIMIT),
        future: [],
      })),

    undo: () =>
      set((s) => {
        if (!s.past.length) return s;
        const previous = s.past[s.past.length - 1];
        return {
          past: s.past.slice(0, -1),
          doc: previous,
          future: [clone(s.doc), ...s.future].slice(0, HISTORY_LIMIT),
          // A selection can reference objects that no longer exist after undo.
          selectedIds: s.selectedIds.filter((id) =>
            previous.pages.some((p) => p.objects.some((o) => o.id === id)),
          ),
        };
      }),

    redo: () =>
      set((s) => {
        if (!s.future.length) return s;
        const next = s.future[0];
        return {
          past: [...s.past, clone(s.doc)].slice(-HISTORY_LIMIT),
          doc: next,
          future: s.future.slice(1),
          selectedIds: s.selectedIds.filter((id) =>
            next.pages.some((p) => p.objects.some((o) => o.id === id)),
          ),
        };
      }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    loadProject: (p) =>
      set({ doc: p, activePageId: p.pages[0].id, selectedIds: [], past: [], future: [] }),

    renameProject: (name) => {
      get().beginTransaction();
      set((s) => ({ doc: touch({ ...s.doc, name }) }));
    },

    setBackground: (bg) => {
      get().beginTransaction();
      mutatePage((page) => { page.background = bg; });
    },

    addObject: (o) => {
      get().beginTransaction();
      mutatePage((page) => { page.objects.push(o); });
      set({ selectedIds: [o.id] });
    },

    addObjects: (list) => {
      if (!list.length) return;
      get().beginTransaction();
      mutatePage((page) => { page.objects.push(...list); });
      set({ selectedIds: list.map((o) => o.id) });
    },

    patchAllText: (patch) => {
      get().beginTransaction();
      mutatePage((page) => {
        page.objects = page.objects.map((o) =>
          o.type === "text" ? ({ ...o, ...patch } as EditorObject) : o,
        );
      });
    },

    patchObject: (id, patch) =>
      mutatePage((page) => {
        const i = page.objects.findIndex((o) => o.id === id);
        if (i === -1) return;
        page.objects[i] = { ...page.objects[i], ...patch } as EditorObject;
      }),

    removeObjects: (ids) => {
      if (!ids.length) return;
      get().beginTransaction();
      mutatePage((page) => {
        page.objects = page.objects.filter((o) => !ids.includes(o.id));
      });
      set((s) => ({ selectedIds: s.selectedIds.filter((id) => !ids.includes(id)) }));
    },

    duplicateObjects: (ids) => {
      if (!ids.length) return;
      get().beginTransaction();
      const newIds: string[] = [];
      mutatePage((page) => {
        for (const id of ids) {
          const src = page.objects.find((o) => o.id === id);
          if (!src) continue;
          const copy = { ...clone(src), id: uid(), x: src.x + 40, y: src.y + 40 };
          newIds.push(copy.id);
          page.objects.push(copy);
        }
      });
      set({ selectedIds: newIds });
    },

    reorder: (id, direction) => {
      get().beginTransaction();
      mutatePage((page) => {
        const i = page.objects.findIndex((o) => o.id === id);
        if (i === -1) return;
        const [obj] = page.objects.splice(i, 1);
        const target =
          direction === "front" ? page.objects.length
          : direction === "back" ? 0
          : direction === "forward" ? Math.min(page.objects.length, i + 1)
          : Math.max(0, i - 1);
        page.objects.splice(target, 0, obj);
      });
    },

    moveLayer: (fromIndex, toIndex) => {
      get().beginTransaction();
      mutatePage((page) => {
        if (fromIndex < 0 || fromIndex >= page.objects.length) return;
        const [obj] = page.objects.splice(fromIndex, 1);
        page.objects.splice(Math.max(0, Math.min(page.objects.length, toIndex)), 0, obj);
      });
    },

    addPage: () => {
      get().beginTransaction();
      const page = createEmptyPage();
      set((s) => ({
        doc: touch({ ...s.doc, pages: [...s.doc.pages, page] }),
        activePageId: page.id,
        selectedIds: [],
      }));
    },

    duplicatePage: (id) => {
      get().beginTransaction();
      set((s) => {
        const i = s.doc.pages.findIndex((p) => p.id === id);
        if (i === -1) return s;
        // New ids for the page AND every object on it, or selection and the
        // Konva node lookup would match two nodes at once.
        const copy = clone(s.doc.pages[i]);
        copy.id = uid();
        copy.objects = copy.objects.map((o) => ({ ...o, id: uid() }));
        const pages = [...s.doc.pages];
        pages.splice(i + 1, 0, copy);
        return { doc: touch({ ...s.doc, pages }), activePageId: copy.id, selectedIds: [] };
      });
    },

    removePage: (id) => {
      // A document with zero pages has no valid render target.
      if (get().doc.pages.length <= 1) return;
      get().beginTransaction();
      set((s) => {
        const pages = s.doc.pages.filter((p) => p.id !== id);
        const activePageId = s.activePageId === id ? pages[0].id : s.activePageId;
        return { doc: touch({ ...s.doc, pages }), activePageId, selectedIds: [] };
      });
    },

    setActivePage: (id) => set({ activePageId: id, selectedIds: [] }),

    setPageDuration: (id, seconds) =>
      set((s) => ({
        doc: touch({
          ...s.doc,
          pages: s.doc.pages.map((p) => (p.id === id ? { ...p, duration: seconds } : p)),
        }),
      })),

    select: (ids) => set({ selectedIds: ids }),
    toggleSelect: (id) =>
      set((s) => ({
        selectedIds: s.selectedIds.includes(id)
          ? s.selectedIds.filter((x) => x !== id)
          : [...s.selectedIds, id],
      })),
    clearSelection: () => set({ selectedIds: [] }),
    setZoom: (z) => set({ zoom: Math.min(3, Math.max(0.1, z)) }),

    activePage: () => {
      const s = get();
      return s.doc.pages.find((p) => p.id === s.activePageId) ?? s.doc.pages[0];
    },
    selectedObjects: () => {
      const s = get();
      const page = s.doc.pages.find((p) => p.id === s.activePageId) ?? s.doc.pages[0];
      return page.objects.filter((o) => s.selectedIds.includes(o.id));
    },
  };
});
