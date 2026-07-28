"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { storyProjectsApi } from "@/lib/api";
import { useEditor } from "./store";
import type { Project } from "./types";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 2000;
const LOCAL_KEY = "weelink-story-studio-draft";

interface LocalDraft {
  projectId: string | null;
  doc: Project;
  at: number;
}

function readLocalDraft(): LocalDraft | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as LocalDraft) : null;
  } catch {
    return null;
  }
}

/**
 * Autosave for the story editor.
 *
 * Two independent layers, on purpose:
 *  - localStorage, written synchronously on every change. This is the crash
 *    net; it survives a tab kill or a lost connection and costs nothing.
 *  - the API, debounced. This is the real store of record.
 *
 * The first render must NOT trigger a save — otherwise merely opening the
 * editor creates a junk project. `dirtyRef` only flips once a change arrives
 * after the initial document is in place.
 */
export function useAutosave({ getThumbnail }: { getThumbnail?: () => string | undefined } = {}) {
  const doc = useEditor((s) => s.doc);
  const loadProject = useEditor((s) => s.loadProject);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [recovered, setRecovered] = useState(false);

  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  // Read inside the debounced callback so a save always sends the LATEST doc,
  // not whatever it was when the timer was scheduled.
  const docRef = useRef(doc);
  docRef.current = doc;
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  // ── Crash recovery ───────────────────────────────────────────────────
  useEffect(() => {
    const draft = readLocalDraft();
    if (!draft?.doc) return;
    // Only offer recovery for a genuinely recent draft; an ancient one is
    // more likely to confuse than help.
    const ageHours = (Date.now() - draft.at) / 36e5;
    if (ageHours > 72) {
      try { localStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ }
      return;
    }
    loadProject(draft.doc);
    setProjectId(draft.projectId);
    setRecovered(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistLocal = useCallback(() => {
    try {
      const draft: LocalDraft = { projectId: projectIdRef.current, doc: docRef.current, at: Date.now() };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(draft));
    } catch { /* quota or blocked storage must not break editing */ }
  }, []);

  const save = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus("saving");
    try {
      const payload = {
        name: docRef.current.name,
        doc: docRef.current as unknown as Record<string, any>,
        thumbnail: getThumbnail?.(),
      };
      if (projectIdRef.current) {
        await storyProjectsApi.update(projectIdRef.current, payload);
      } else {
        const created: any = await storyProjectsApi.create(payload);
        if (created?.id) setProjectId(created.id);
      }
      dirtyRef.current = false;
      setStatus("saved");
    } catch {
      // Deliberately keep the local draft and stay "error" — the user's work
      // is still safe locally and the next change retries.
      setStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [getThumbnail]);

  // ── Change detection → local write + debounced remote save ───────────
  const firstDocRef = useRef(true);
  useEffect(() => {
    if (firstDocRef.current) {
      firstDocRef.current = false;
      return;
    }
    dirtyRef.current = true;
    setStatus("dirty");
    persistLocal();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void save(); }, DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [doc, persistLocal, save]);

  // Last-chance flush. `sendBeacon`/async fetch is unreliable here, so this
  // only guarantees the LOCAL copy — which is what recovery reads anyway.
  useEffect(() => {
    const onHide = () => { if (dirtyRef.current) persistLocal(); };
    window.addEventListener("beforeunload", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [persistLocal]);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return save();
  }, [save]);

  const openProject = useCallback((p: Project, id: string) => {
    loadProject(p);
    setProjectId(id);
    firstDocRef.current = true; // opening is not a user edit
    dirtyRef.current = false;
    setStatus("idle");
  }, [loadProject]);

  const startNew = useCallback((p: Project) => {
    loadProject(p);
    setProjectId(null);
    firstDocRef.current = true;
    dirtyRef.current = false;
    setStatus("idle");
    try { localStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ }
  }, [loadProject]);

  return { projectId, status, saveNow, openProject, startNew, recovered };
}
