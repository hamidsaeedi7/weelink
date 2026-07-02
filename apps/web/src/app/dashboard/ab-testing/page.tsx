"use client";

import { useEffect, useState } from "react";
import { abTestingApi } from "@/lib/api";

type TestStatus = "RUNNING" | "PAUSED" | "COMPLETED";

interface ABTest {
  id: string;
  name: string;
  status: TestStatus;
  winner: "A" | "B" | null;
  impressionA: number;
  impressionB: number;
  conversionA: number;
  conversionB: number;
  trafficSplit: number;
  createdAt: string;
}

const statusLabel: Record<TestStatus, { label: string; cls: string }> = {
  RUNNING: { label: "در حال اجرا", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  PAUSED: { label: "متوقف", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  COMPLETED: { label: "تمام‌شده", cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
};

function convRate(conversions: number, impressions: number) {
  if (!impressions) return 0;
  return Math.round((conversions / impressions) * 1000) / 10;
}

function ProgressBar({ a, b, label }: { a: number; b: number; label: string }) {
  const total = a + b || 1;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
      </div>
      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
        <div
          className="bg-orange-500 transition-all duration-500 flex items-center justify-center"
          style={{ width: `${(a / total) * 100}%` }}
          title={`A: ${a}`}
        />
        <div
          className="bg-blue-500 transition-all duration-500 flex items-center justify-center"
          style={{ width: `${(b / total) * 100}%` }}
          title={`B: ${b}`}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-orange-500 font-medium">A: {a}</span>
        <span className="text-blue-500 font-medium">B: {b}</span>
      </div>
    </div>
  );
}

export default function ABTestingPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // End modal
  const [endTestId, setEndTestId] = useState<string | null>(null);
  const [endWinner, setEndWinner] = useState<"A" | "B">("A");
  const [ending, setEnding] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await abTestingApi.getTests();
      setTests(data as unknown as ABTest[]);
    } catch {
      setError("خطا در بارگذاری تست‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await abTestingApi.createTest({ name: newName, variantBDescription: newDesc });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      load();
    } catch {
      alert("خطا در ایجاد تست");
    } finally {
      setCreating(false);
    }
  };

  const handlePause = async (id: string) => {
    await abTestingApi.pauseTest(id);
    load();
  };

  const handleEnd = async () => {
    if (!endTestId) return;
    setEnding(true);
    try {
      await abTestingApi.endTest(endTestId, endWinner);
      setEndTestId(null);
      load();
    } catch {
      alert("خطا در پایان دادن به تست");
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">تست A/B</h1>
          <p className="text-gray-500 text-sm mt-1">
            آزمایش نسخه‌های مختلف بیو لینک برای بهبود نرخ تبدیل
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow"
        >
          <span className="text-lg leading-none">+</span>
          تست جدید
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && tests.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🧪</div>
          <p className="font-medium text-lg">هنوز تستی ندارید</p>
          <p className="text-sm mt-1">اولین تست A/B خود را بسازید</p>
        </div>
      )}

      <div className="space-y-4">
        {tests.map((test) => {
          const crA = convRate(test.conversionA, test.impressionA);
          const crB = convRate(test.conversionB, test.impressionB);
          const isActive = test.status === "RUNNING" || test.status === "PAUSED";
          return (
            <div
              key={test.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <h3 className="font-bold text-base truncate">{test.name}</h3>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusLabel[test.status].cls}`}
                  >
                    {statusLabel[test.status].label}
                  </span>
                  {test.winner && (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      برنده: {test.winner}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {isActive && (
                    <>
                      <button
                        onClick={() => handlePause(test.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {test.status === "PAUSED" ? "ادامه" : "توقف"}
                      </button>
                      <button
                        onClick={() => { setEndTestId(test.id); setEndWinner("A"); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        پایان دادن
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <ProgressBar
                  a={test.impressionA}
                  b={test.impressionB}
                  label="بازدید (Impressions)"
                />
                <ProgressBar
                  a={test.conversionA}
                  b={test.conversionB}
                  label="تبدیل (Conversions)"
                />
              </div>

              {/* Conversion rates */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 text-center border border-orange-100 dark:border-orange-900/20">
                  <div className="text-2xl font-bold text-orange-500">{crA}%</div>
                  <div className="text-xs text-gray-500 mt-0.5">نرخ تبدیل — نسخه A</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-900/20">
                  <div className="text-2xl font-bold text-blue-500">{crB}%</div>
                  <div className="text-xs text-gray-500 mt-0.5">نرخ تبدیل — نسخه B</div>
                </div>
              </div>

              <div className="text-xs text-gray-400 mt-3">
                ایجاد: {new Date(test.createdAt).toLocaleDateString("fa-IR")} — تقسیم ترافیک: {Math.round(test.trafficSplit * 100)}٪ / {Math.round((1 - test.trafficSplit) * 100)}٪
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" dir="rtl">
            <h2 className="text-lg font-bold mb-5">تست A/B جدید</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">نام تست *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: تست دکمه خرید"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">توضیح نسخه B (اختیاری)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="مثال: تغییر رنگ دکمه به آبی"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                نسخه A = بلاک‌های فعلی فروشگاه شما. نسخه B را پس از ایجاد تست می‌توانید ویرایش کنید.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {creating ? "در حال ایجاد..." : "ایجاد تست"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── End Test Modal ── */}
      {endTestId && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setEndTestId(null)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" dir="rtl">
            <h2 className="text-lg font-bold mb-2">پایان دادن به تست</h2>
            <p className="text-gray-500 text-sm mb-5">
              نسخه برنده را انتخاب کنید. بلاک‌های برنده جایگزین بلاک‌های فعلی فروشگاه شما می‌شوند.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(["A", "B"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setEndWinner(v)}
                  className={`py-4 rounded-xl text-lg font-bold border-2 transition-colors ${
                    endWinner === v
                      ? v === "A"
                        ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-900/20"
                        : "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  نسخه {v}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEnd}
                disabled={ending}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {ending ? "در حال اعمال..." : "تأیید و پایان"}
              </button>
              <button
                onClick={() => setEndTestId(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
