import { Injectable, Logger } from "@nestjs/common";

const ARVAN_BASE = "https://napi.arvancloud.ir/cdn/4.0";

interface ArvanDomainResult {
  ok: boolean;
  cdnDomainId?: string;
  cname?: string;
  status?: string;
  error?: string;
}

/**
 * کلاینت API آروان‌کلاود برای افزودن/حذف/بررسی وضعیت دامنه در CDN.
 * ماشین‌یوزر مربوط به ARVAN_API_KEY باید قانون دسترسی CDN داشته باشد
 * وگرنه همه‌ی درخواست‌ها با خطای دسترسی (403) برمی‌گردند — این حالت
 * silent-fail است تا فرآیند تأیید DNS دامنه‌ی کاربر را نشکند؛ وضعیت
 * در ستون cdnError روی Shop ذخیره می‌شود تا بعداً قابل retry باشد.
 */
@Injectable()
export class ArvanCdnService {
  private readonly logger = new Logger(ArvanCdnService.name);
  private readonly apiKey = process.env.ARVAN_API_KEY;

  private headers() {
    return {
      Authorization: `Apikey ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async addDomain(domain: string): Promise<ArvanDomainResult> {
    if (!this.apiKey) return { ok: false, error: "ARVAN_API_KEY تنظیم نشده است" };
    try {
      // دامنه‌های اختصاصی کاربران زیردامنه‌ی یک دامنه‌ی خارجی (غیر آروان) هستند
      // و فقط با CNAME متصل می‌شوند، پس همیشه partial با پلن رایگان (سطح ۱) هستند
      const res = await fetch(`${ARVAN_BASE}/domains/dns-service`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          domain,
          domain_type: "partial",
          plan_level: 1,
        }),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body?.message || `خطای آروان‌کلاود (HTTP ${res.status})`;
        this.logger.warn(`addDomain(${domain}) failed: ${msg}`);
        return { ok: false, error: msg };
      }
      const data = body?.data ?? body;
      return {
        ok: true,
        cdnDomainId: String(data?.id ?? data?.uuid ?? ""),
        cname: data?.cname ?? data?.instance_provider?.[0]?.cname,
        status: data?.status?.cdn ?? data?.status ?? "PENDING",
      };
    } catch (e: any) {
      this.logger.error(`addDomain(${domain}) exception: ${e?.message}`);
      return { ok: false, error: e?.message || "خطای شبکه در اتصال به آروان‌کلاود" };
    }
  }

  async getStatus(domain: string): Promise<ArvanDomainResult> {
    if (!this.apiKey) return { ok: false, error: "ARVAN_API_KEY تنظیم نشده است" };
    try {
      const res = await fetch(`${ARVAN_BASE}/domains/${encodeURIComponent(domain)}`, {
        headers: this.headers(),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: body?.message || `HTTP ${res.status}` };
      }
      const data = body?.data ?? body;
      return {
        ok: true,
        cdnDomainId: String(data?.id ?? ""),
        cname: data?.cname,
        status: data?.status?.cdn ?? data?.status ?? "PENDING",
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || "خطای شبکه" };
    }
  }

  async removeDomain(domain: string): Promise<void> {
    if (!this.apiKey) return;
    try {
      await fetch(`${ARVAN_BASE}/domains/${encodeURIComponent(domain)}`, {
        method: "DELETE",
        headers: this.headers(),
      });
    } catch (e: any) {
      this.logger.warn(`removeDomain(${domain}) failed: ${e?.message}`);
    }
  }
}
