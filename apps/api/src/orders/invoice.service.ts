import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async generateInvoiceHtml(orderId: string, userId: string): Promise<string> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: {
          select: { name: true, slug: true, userId: true },
        },
      },
    });

    if (!order) throw new NotFoundException("سفارش یافت نشد");
    if (order.shop.userId !== userId) throw new ForbiddenException("دسترسی غیرمجاز");

    const shop = order.shop;
    const items: any[] = Array.isArray(order.items) ? order.items : [];
    const totalPrice = Number(order.totalPrice);
    const discount = Number(order.discount);
    const finalPrice = totalPrice - discount;

    const persianDate = new Date(order.createdAt).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const payStatusLabel =
      order.paymentStatus === "PAID"
        ? '<span style="background:#16a34a22;color:#16a34a;padding:2px 10px;border-radius:20px;font-size:12px;">پرداخت شده</span>'
        : '<span style="background:#f9731622;color:#ea580c;padding:2px 10px;border-radius:20px;font-size:12px;">در انتظار پرداخت</span>';

    const itemRows = items
      .map(
        (item, i) => `
      <tr style="border-bottom:1px solid #f1f5f9;${i % 2 === 0 ? "background:#fafafa;" : ""}">
        <td style="padding:10px 14px;">${item.name || "-"}</td>
        <td style="padding:10px 14px;text-align:center;">${toFa(item.qty)}</td>
        <td style="padding:10px 14px;text-align:left;">${formatPrice(item.price)} تومان</td>
        <td style="padding:10px 14px;text-align:left;font-weight:bold;">${formatPrice(item.price * item.qty)} تومان</td>
      </tr>`,
      )
      .join("");

    const discountRow =
      discount > 0
        ? `<tr>
        <td colspan="3" style="padding:8px 14px;text-align:right;color:#16a34a;">تخفیف ${order.couponCode ? `(${order.couponCode})` : ""}</td>
        <td style="padding:8px 14px;text-align:left;color:#16a34a;">- ${formatPrice(discount)} تومان</td>
      </tr>`
        : "";

    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>فاکتور سفارش ${order.orderNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
      direction: rtl;
      background: #f8fafc;
      color: #1e293b;
      font-size: 14px;
      line-height: 1.7;
    }
    .page { max-width: 800px; margin: 30px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px #0001; overflow: hidden; }
    .header { background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; padding: 32px 36px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .brand-sub { font-size: 13px; opacity: 0.85; margin-top: 4px; }
    .invoice-title { text-align: left; }
    .invoice-title h2 { font-size: 22px; font-weight: 700; }
    .invoice-title .inv-num { font-size: 13px; opacity: 0.85; margin-top: 4px; font-family: monospace; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 28px 36px; border-bottom: 1px solid #f1f5f9; }
    .meta-block h4 { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .meta-block p { font-size: 14px; color: #334155; }
    .meta-block .strong { font-weight: 700; font-size: 15px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    .table-wrap { padding: 0 36px; }
    .table-head { background: #f97316; color: #fff; }
    .table-head th { padding: 12px 14px; font-weight: 700; font-size: 13px; }
    .table-head th:not(:first-child) { text-align: center; }
    .table-head th:last-child { text-align: left; }
    .totals { padding: 16px 36px 8px; }
    .totals table { border-top: 2px solid #f97316; }
    .totals td { padding: 6px 14px; }
    .total-final td { font-size: 16px; font-weight: 900; color: #f97316; border-top: 1px solid #fed7aa; padding-top: 10px; }
    .status-row { padding: 20px 36px; display: flex; align-items: center; gap: 12px; }
    .footer { background: #f8fafc; padding: 20px 36px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-size: 13px; color: #94a3b8; }
    .footer-brand strong { color: #f97316; }
    .print-btn {
      display: inline-flex; align-items: center; gap: 8px;
      background: #f97316; color: #fff; border: none; cursor: pointer;
      padding: 10px 24px; border-radius: 10px; font-family: inherit;
      font-size: 14px; font-weight: 700; margin: 20px auto; display: block;
      transition: background 0.2s;
    }
    .print-btn:hover { background: #ea580c; }
    @media print {
      body { background: #fff; }
      .page { box-shadow: none; margin: 0; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;padding:16px 0;">
    <button class="print-btn" onclick="window.print()">🖨️ پرینت فاکتور</button>
  </div>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand">ویلینک</div>
        <div class="brand-sub">weeelink.com</div>
      </div>
      <div class="invoice-title">
        <h2>فاکتور فروش</h2>
        <div class="inv-num">${order.orderNumber}</div>
        <div style="margin-top:6px;font-size:12px;opacity:0.8;">${persianDate}</div>
      </div>
    </div>

    <!-- Meta info -->
    <div class="meta">
      <div class="meta-block">
        <h4>اطلاعات فروشگاه</h4>
        <p class="strong">${shop.name}</p>
        <p style="color:#64748b;font-size:13px;">weeelink.com/${shop.slug}</p>
      </div>
      <div class="meta-block">
        <h4>اطلاعات خریدار</h4>
        <p class="strong">${order.customerName}</p>
        <p>${order.customerPhone}</p>
        ${order.customerAddress ? `<p style="font-size:13px;color:#64748b;margin-top:4px;">${order.customerAddress}</p>` : ""}
      </div>
    </div>

    <!-- Items table -->
    <div class="table-wrap" style="margin-top:24px;">
      <table>
        <thead class="table-head">
          <tr>
            <th>نام محصول</th>
            <th style="text-align:center;">تعداد</th>
            <th style="text-align:left;">قیمت واحد</th>
            <th style="text-align:left;">جمع</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals">
      <table>
        <tbody>
          <tr>
            <td colspan="3" style="color:#64748b;">جمع کل</td>
            <td style="text-align:left;">${formatPrice(totalPrice)} تومان</td>
          </tr>
          ${discountRow}
          <tr class="total-final">
            <td colspan="3">مبلغ قابل پرداخت</td>
            <td style="text-align:left;">${formatPrice(finalPrice)} تومان</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payment status -->
    <div class="status-row">
      <span style="font-size:13px;color:#64748b;">وضعیت پرداخت:</span>
      ${payStatusLabel}
      ${order.paymentRef ? `<span style="font-size:12px;color:#94a3b8;font-family:monospace;">Ref: ${order.paymentRef}</span>` : ""}
    </div>

    ${order.note ? `<div style="padding:0 36px 20px;"><p style="background:#fef9c3;border-right:3px solid #fbbf24;padding:10px 14px;border-radius:8px;font-size:13px;color:#78350f;">یادداشت: ${order.note}</p></div>` : ""}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">صادر شده توسط <strong>weeelink.com</strong></div>
      <div style="font-size:12px;color:#cbd5e1;">${persianDate}</div>
    </div>
  </div>
</body>
</html>`;
  }
}

function formatPrice(n: number): string {
  return Number(n).toLocaleString("fa-IR");
}

function toFa(n: number): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}
