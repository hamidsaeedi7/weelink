"use client";

import { useState, useEffect } from "react";
import { Globe, CheckCircle, Clock, AlertCircle, Trash2, Loader2, ExternalLink, Copy, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

type DomainStatus = "PENDING" | "VERIFIED" | "FAILED";
type CdnStatus = "PENDING" | "DNS_PENDING" | "SSL_ISSUING" | "ACTIVE" | "ERROR" | null;

interface DomainInfo {
  customDomain: string | null;
  verificationStatus: DomainStatus | null;
  verificationToken: string | null;
  verifiedAt: string | null;
  cdnCname?: string | null;
  cdnStatus?: CdnStatus;
  cdnError?: string | null;
}

const STATUS_CONFIG = {
  PENDING:  { icon: Clock,        color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20", label: "در انتظار تأیید DNS" },
  VERIFIED: { icon: CheckCircle,  color: "text-green-500",  bg: "bg-green-500/10 border-green-500/20",   label: "تأیید شده" },
  FAILED:   { icon: AlertCircle,  color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20",       label: "خطا در تأیید" },
};

const CDN_STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  PENDING:     { icon: Clock,       color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20", label: "در حال اتصال به CDN" },
  DNS_PENDING: { icon: Clock,       color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20", label: "در انتظار تنظیم CNAME" },
  SSL_ISSUING: { icon: ShieldCheck, color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",     label: "در حال صدور گواهی SSL" },
  ACTIVE:      { icon: ShieldCheck, color: "text-green-500",  bg: "bg-green-500/10 border-green-500/20",   label: "فعال — SSL معتبر" },
  ERROR:       { icon: AlertCircle, color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20",       label: "خطا در اتصال به CDN" },
};

export default function DomainsPage() {
  const [info, setInfo]         = useState<DomainInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [domain, setDomain]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [cdnLoading, setCdnLoading] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/domains`, { headers: auth() });
      if (r.ok) setInfo(await r.json());
    } catch { /* no domain set yet */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addDomain = async () => {
    if (!domain.trim()) { toast.error("دامنه را وارد کنید"); return; }
    const cleaned = domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/v1/domains`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleaned }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.message || "خطا");
      }
      toast.success("دامنه اضافه شد — حالا DNS را تنظیم کنید");
      setDomain("");
      load();
    } catch (e: any) {
      toast.error(e.message || "خطا در افزودن دامنه");
    } finally {
      setSaving(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const r = await fetch(`${API}/api/v1/domains/verify`, { method: "POST", headers: auth() });
      const d = await r.json();
      if (d.success) {
        toast.success(d.message || "دامنه با موفقیت تأیید شد!");
      } else {
        toast.error(d.message || "تأیید ناموفق — مطمئن شوید DNS درست تنظیم شده است");
      }
      load();
    } catch {
      toast.error("خطا در بررسی DNS");
    } finally {
      setVerifying(false);
    }
  };

  const retryCdn = async () => {
    setCdnLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/domains/retry-cdn`, { method: "POST", headers: auth() });
      const d = await r.json();
      if (d.success) toast.success(d.message || "درخواست ثبت در CDN ارسال شد");
      else toast.error(d.message || "خطا در اتصال به CDN");
      load();
    } catch {
      toast.error("خطا در اتصال به CDN");
    } finally {
      setCdnLoading(false);
    }
  };

  const refreshCdn = async () => {
    setCdnLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/domains/refresh-cdn`, { headers: auth() });
      if (r.ok) setInfo(await r.json());
    } catch { /* ignore */ }
    finally { setCdnLoading(false); }
  };

  const remove = async () => {
    if (!confirm("دامنه اختصاصی حذف شود؟")) return;
    setRemoving(true);
    try {
      await fetch(`${API}/api/v1/domains`, { method: "DELETE", headers: auth() });
      toast.success("دامنه حذف شد");
      setInfo(null);
    } catch {
      toast.error("خطا در حذف دامنه");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
      </div>
    );
  }

  const statusCfg = info?.verificationStatus ? STATUS_CONFIG[info.verificationStatus] : null;
  const StatusIcon = statusCfg?.icon;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent-500" />
          دامنه اختصاصی
          <span className="text-xs bg-accent-500/20 text-accent-400 px-2 py-0.5 rounded-md font-medium">Pro</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          صفحه بیوی خود را روی دامنه‌ی شخصی‌تان نمایش دهید
        </p>
      </div>

      {/* Current domain status */}
      {info?.customDomain ? (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">دامنه فعلی</p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900 dark:text-white text-lg truncate">
                  {info.customDomain}
                </span>
                <a href={`https://${info.customDomain}`} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-accent-500 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <button onClick={remove} disabled={removing}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>

          {statusCfg && StatusIcon && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${statusCfg.bg}`}>
              <StatusIcon className={`w-4 h-4 ${statusCfg.color} shrink-0`} />
              <span className={statusCfg.color}>{statusCfg.label}</span>
              {info.verificationStatus === "VERIFIED" && info.verifiedAt && (
                <span className="mr-auto text-xs text-gray-400">
                  {new Date(info.verifiedAt).toLocaleDateString("fa-IR")}
                </span>
              )}
            </div>
          )}

          {/* DNS instructions — گام ۱: تأیید مالکیت دامنه */}
          {info.verificationStatus !== "VERIFIED" && info.verificationToken && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                گام ۱ — تأیید مالکیت دامنه (رکورد TXT):
              </p>
              <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 space-y-3 text-xs font-mono">
                <DnsRecord
                  type="TXT"
                  name={`_weelink-verify.${info.customDomain}`}
                  value={info.verificationToken}
                />
              </div>
              <p className="text-xs text-gray-400">
                این رکورد را در پنل مدیریت دامنه‌ی خودتان (جایی که دامنه را خریده‌اید) اضافه کنید. تغییرات DNS معمولاً تا چند دقیقه تا ۴۸ ساعت اعمال می‌شوند. پس از تنظیم، دکمه بررسی را بزنید.
              </p>
              <button onClick={verify} disabled={verifying}
                className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm">
                {verifying
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال بررسی DNS...</>
                  : <><CheckCircle className="w-4 h-4" /> بررسی DNS</>}
              </button>
            </div>
          )}

          {/* CDN/SSL status — گام ۲: بعد از تأیید مالکیت */}
          {info.verificationStatus === "VERIFIED" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                گام ۲ — اتصال دامنه به سرور (CNAME) و صدور SSL:
              </p>
              <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 space-y-3 text-xs font-mono">
                <DnsRecord
                  type="CNAME"
                  name={info.customDomain}
                  value={info.cdnCname || "در حال دریافت آدرس..."}
                />
              </div>

              {info.cdnStatus && CDN_STATUS_CONFIG[info.cdnStatus] && (() => {
                const c = CDN_STATUS_CONFIG[info.cdnStatus as string];
                const CdnIcon = c.icon;
                return (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${c.bg}`}>
                    <CdnIcon className={`w-4 h-4 ${c.color} shrink-0`} />
                    <span className={c.color}>{c.label}</span>
                    <button onClick={refreshCdn} disabled={cdnLoading}
                      className="mr-auto text-gray-400 hover:text-accent-500">
                      <RefreshCw className={`w-3.5 h-3.5 ${cdnLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                );
              })()}

              {info.cdnStatus === "ERROR" && (
                <div className="space-y-2">
                  {info.cdnError && <p className="text-xs text-red-400">{info.cdnError}</p>}
                  <button onClick={retryCdn} disabled={cdnLoading}
                    className="btn-primary py-2 px-4 flex items-center gap-2 text-xs">
                    {cdnLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    تلاش مجدد اتصال به CDN
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-400">
                پس از تنظیم CNAME، گواهی SSL به‌صورت خودکار صادر می‌شود و معمولاً چند دقیقه طول می‌کشد.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Add domain form */
        <div className="glass-card p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            با اتصال دامنه اختصاصی، بازدیدکنندگان صفحه بیوی شما را روی آدرس دلخواهتان مشاهده می‌کنند.
          </p>
          <div className="flex gap-3">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              className="input-base flex-1"
              placeholder="example.com یا shop.example.com"
              dir="ltr"
            />
            <button onClick={addDomain} disabled={saving}
              className="btn-primary py-2.5 px-5 flex items-center gap-2 shrink-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              افزودن
            </button>
          </div>
          <p className="text-xs text-gray-400">
            مثال: <code className="text-accent-400">shop.mysite.com</code> یا <code className="text-accent-400">bio.mysite.com</code>
          </p>
        </div>
      )}

      {/* How it works */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">چطور کار می‌کند؟</h3>
        <ol className="space-y-2 text-sm text-gray-500">
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs font-bold shrink-0">۱</span>
            دامنه‌ی خودتان (مثل shop.example.com) را در بالا وارد و «افزودن» را بزنید
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs font-bold shrink-0">۲</span>
            یک رکورد TXT که سیستم نشان می‌دهد را در پنل ثبت‌کننده‌ی دامنه‌تان اضافه کنید (فقط برای اثبات مالکیت) و «بررسی DNS» را بزنید
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs font-bold shrink-0">۳</span>
            بعد از تأیید، یک رکورد CNAME که سیستم نشان می‌دهد را هم اضافه کنید — این رکورد ترافیک دامنه‌تان را به سرور ما وصل می‌کند
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs font-bold shrink-0">۴</span>
            گواهی SSL به‌صورت خودکار صادر می‌شود و صفحه بیوی شما روی دامنه اختصاصی با قفل امن فعال می‌شود — از این مرحله به بعد نیازی به کار دیگری نیست
          </li>
        </ol>
      </div>
    </div>
  );
}

function DnsRecord({ type, name, value }: { type: string; name: string; value: string }) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success("کپی شد");
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400 text-[10px] font-bold">{type}</span>
        <span className="text-gray-500">{name}</span>
      </div>
      <div className="flex items-center gap-2 pl-1">
        <span className="text-gray-700 dark:text-gray-300 break-all">{value}</span>
        <button onClick={copy} className="text-gray-400 hover:text-accent-500 shrink-0">
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
