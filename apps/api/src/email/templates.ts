/* ---------------------------------------------------------------
 * Weelink Email Templates — Persian / RTL
 * --------------------------------------------------------------- */

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="UTF-8"><style>
body { font-family: Tahoma, Arial, sans-serif; direction: rtl; background: #f5f5f5; margin: 0; }
.container { max-width: 580px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.header { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 32px; text-align: center; }
.logo { color: white; font-size: 24px; font-weight: bold; }
.logo span { color: #F97316; }
.content { padding: 32px; }
.btn { display: inline-block; background: #F97316; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 20px 0; }
.footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
h2 { color: #111827; margin-top: 0; }
p { color: #374151; line-height: 1.7; }
.otp-box { background: #f3f4f6; border: 2px dashed #F97316; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
.otp-code { font-size: 42px; font-weight: bold; color: #F97316; letter-spacing: 10px; font-family: monospace; }
.otp-note { color: #6b7280; font-size: 13px; margin-top: 8px; }
table.order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
table.order-table th { background: #f3f4f6; color: #374151; padding: 10px 14px; text-align: right; font-size: 13px; }
table.order-table td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; }
.total-row td { font-weight: bold; color: #111827; border-top: 2px solid #e5e7eb; border-bottom: none; }
.badge { display: inline-block; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 8px; padding: 6px 16px; font-size: 13px; font-weight: bold; margin: 8px 0; }
.info-box { background: #eff6ff; border-right: 4px solid #3b82f6; border-radius: 8px; padding: 16px 20px; margin: 16px 0; color: #1e40af; font-size: 14px; }
</style></head>
<body><div class="container">
  <div class="header"><div class="logo">وی<span>لینک</span></div></div>
  <div class="content">${content}</div>
  <div class="footer">ویلینک | weeelink.com<br><small>این ایمیل به صورت خودکار ارسال شده است.</small></div>
</div></body></html>`;
}

export const emailTemplates = {
  /** ── Welcome ─────────────────────────────────────────────── */
  welcome: (name: string): string =>
    wrap(`
      <h2>به ویلینک خوش آمدید! 🎉</h2>
      <p>سلام <strong>${name}</strong> عزیز،</p>
      <p>
        ثبت‌نام شما در <strong>ویلینک</strong> با موفقیت انجام شد.
        خوشحالیم که به جمع فروشندگان هوشمند ما پیوستید.
      </p>
      <p>
        با ویلینک می‌توانید فروشگاه آنلاین خود را در چند دقیقه راه‌اندازی کنید،
        محصولات خود را مدیریت کنید و فروش خود را افزایش دهید.
      </p>
      <center>
        <a class="btn" href="https://weeelink.com/dashboard">شروع کنید</a>
      </center>
      <p style="color:#6b7280;font-size:13px;">
        اگر این حساب را شما ایجاد نکرده‌اید، این ایمیل را نادیده بگیرید.
      </p>
    `),

  /** ── OTP ─────────────────────────────────────────────────── */
  otp: (code: string): string =>
    wrap(`
      <h2>کد تأیید شما</h2>
      <p>کد تأیید یک‌بار مصرف شما برای ورود به ویلینک:</p>
      <div class="otp-box">
        <div class="otp-code">${code}</div>
        <div class="otp-note">این کد تا ۵ دقیقه دیگر معتبر است.</div>
      </div>
      <div class="info-box">
        🔒 هرگز این کد را با دیگران به اشتراک نگذارید.
        تیم ویلینک هیچ‌گاه این کد را از شما نخواهد خواست.
      </div>
      <p style="color:#6b7280;font-size:13px;">
        اگر این درخواست از شما نبوده، نگران نباشید — کد منقضی می‌شود.
      </p>
    `),

  /** ── Password Reset ──────────────────────────────────────── */
  passwordReset: (token: string, code: string): string =>
    wrap(`
      <h2>بازیابی رمز عبور</h2>
      <p>درخواست بازیابی رمز عبور برای حساب کاربری شما در ویلینک دریافت شد.</p>
      <p>کد تأیید بازیابی رمز عبور شما:</p>
      <div class="otp-box">
        <div class="otp-code">${code}</div>
        <div class="otp-note">این کد تا ۱۵ دقیقه دیگر معتبر است.</div>
      </div>
      <p>یا برای تغییر رمز عبور روی دکمه زیر کلیک کنید:</p>
      <center>
        <a class="btn" href="https://weeelink.com/reset-password?token=${token}">تغییر رمز عبور</a>
      </center>
      <div class="info-box">
        ⚠️ اگر این درخواست از شما نیست، رمز عبور خود را فوراً تغییر دهید
        و با پشتیبانی تماس بگیرید.
      </div>
    `),

  /** ── Order Confirmation ──────────────────────────────────── */
  orderConfirmation: (order: {
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shopName: string;
  }): string => {
    const rows = order.items
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:center">${item.price.toLocaleString('fa-IR')} تومان</td>
          <td style="text-align:center">${(item.quantity * item.price).toLocaleString('fa-IR')} تومان</td>
        </tr>`,
      )
      .join('');

    return wrap(`
      <h2>سفارش شما ثبت شد ✅</h2>
      <p>سفارش شما از فروشگاه <strong>${order.shopName}</strong> با موفقیت ثبت گردید.</p>
      <div class="badge">شماره سفارش: #${order.orderNumber}</div>

      <table class="order-table">
        <thead>
          <tr>
            <th>محصول</th>
            <th style="text-align:center">تعداد</th>
            <th style="text-align:center">قیمت واحد</th>
            <th style="text-align:center">جمع</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="3">مبلغ کل</td>
            <td style="text-align:center;color:#F97316">${order.total.toLocaleString('fa-IR')} تومان</td>
          </tr>
        </tbody>
      </table>

      <p>برای پیگیری سفارش خود وارد پنل کاربری شوید:</p>
      <center>
        <a class="btn" href="https://weeelink.com/dashboard/orders">پیگیری سفارش</a>
      </center>
    `);
  },

  /** ── Order Status Update ─────────────────────────────────── */
  orderStatusUpdate: (
    orderNumber: string,
    status: string,
    shopName: string,
  ): string => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending:    { label: 'در انتظار بررسی', color: '#d97706' },
      confirmed:  { label: 'تأیید شده',        color: '#059669' },
      processing: { label: 'در حال پردازش',    color: '#2563eb' },
      shipped:    { label: 'ارسال شده',         color: '#7c3aed' },
      delivered:  { label: 'تحویل داده شده',   color: '#059669' },
      cancelled:  { label: 'لغو شده',           color: '#dc2626' },
    };
    const s = statusMap[status] ?? { label: status, color: '#374151' };

    return wrap(`
      <h2>بروزرسانی وضعیت سفارش</h2>
      <p>وضعیت سفارش <strong>#${orderNumber}</strong> از فروشگاه <strong>${shopName}</strong> تغییر کرد:</p>
      <div style="text-align:center;margin:24px 0">
        <span style="background:${s.color}1a;color:${s.color};border:1px solid ${s.color}4d;
          border-radius:10px;padding:10px 28px;font-size:18px;font-weight:bold;">
          ${s.label}
        </span>
      </div>
      <p>برای مشاهده جزئیات سفارش خود وارد پنل کاربری شوید:</p>
      <center>
        <a class="btn" href="https://weeelink.com/dashboard/orders/${orderNumber}">مشاهده سفارش</a>
      </center>
    `);
  },

  /** ── Subscription Renewal Reminder ──────────────────────── */
  subscriptionRenewal: (expiresAt: Date, plan: string): string => {
    const dateStr = expiresAt.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return wrap(`
      <h2>یادآوری تمدید اشتراک ⏰</h2>
      <p>اشتراک <strong>${plan}</strong> شما در ویلینک به زودی منقضی می‌شود.</p>
      <div class="info-box">
        📅 تاریخ انقضا: <strong>${dateStr}</strong>
      </div>
      <p>
        برای اطمینان از عدم وقفه در خدمات فروشگاه خود، قبل از این تاریخ
        اشتراک خود را تمدید کنید.
      </p>
      <p>با تمدید اشتراک از تمام امکانات ویلینک بدون محدودیت بهره‌مند شوید:</p>
      <ul style="color:#374151;line-height:2">
        <li>فروشگاه آنلاین بی‌محدودیت</li>
        <li>پشتیبانی اختصاصی</li>
        <li>گزارش‌های پیشرفته فروش</li>
        <li>درگاه پرداخت مستقیم</li>
      </ul>
      <center>
        <a class="btn" href="https://weeelink.com/dashboard/subscription">تمدید اشتراک</a>
      </center>
    `);
  },

  /** ── Subscription Confirmation ──────────────────────────── */
  subscriptionConfirmation: (
    plan: string,
    months: number,
    price: number,
  ): string =>
    wrap(`
      <h2>اشتراک شما فعال شد 🎊</h2>
      <p>خرید اشتراک شما در ویلینک با موفقیت انجام شد.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">✅</div>
        <div style="font-size:20px;font-weight:bold;color:#166534">${plan}</div>
        <div style="color:#15803d;margin-top:8px">
          مدت: <strong>${months} ماه</strong> &nbsp;|&nbsp;
          مبلغ: <strong>${price.toLocaleString('fa-IR')} تومان</strong>
        </div>
      </div>
      <p>از این پس می‌توانید از تمام امکانات پلن <strong>${plan}</strong> استفاده کنید.</p>
      <center>
        <a class="btn" href="https://weeelink.com/dashboard">رفتن به پنل</a>
      </center>
      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        برای مشاهده جزئیات اشتراک و فاکتور خود به بخش اشتراک در پنل مراجعه کنید.
      </p>
    `),
};
