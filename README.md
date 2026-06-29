# ویلینک — Weeelink

پلتفرم لینک بیو فارسی | SaaS

## راه‌اندازی سریع

```bash
# 1. نیازمندی‌ها: Node 20+, pnpm, Docker Desktop

# 2. نصب dependencies
pnpm install

# 3. راه‌اندازی سرویس‌های Docker (PostgreSQL + Redis)
docker-compose up -d

# 4. کپی env
cp .env.example .env

# 5. ایجاد جداول دیتابیس
pnpm db:push

# 6. Seed (ایجاد ادمین اولیه)
pnpm db:seed

# 7. اجرای همه سرویس‌ها
pnpm dev
```

## آدرس‌ها

| سرویس | آدرس |
|-------|------|
| وب (کاربر) | http://localhost:3000 |
| ادمین | http://localhost:3001/modir |
| API | http://localhost:4000/api/v1 |
| DB Studio | `pnpm db:studio` |

## ورود ادمین

- **ایمیل:** `hamid@weelink.com`
- **رمز:** `H@mid1375`

## بکاپ دیتابیس

```bash
bash scripts/backup.sh
```

## ساختار پروژه

```
weelink/
├── apps/
│   ├── api/      # NestJS API - port 4000
│   ├── web/      # Next.js کاربر - port 3000
│   └── admin/    # Next.js ادمین - port 3001
└── packages/
    ├── db/       # Prisma schema
    └── config/   # تنظیمات مشترک
```

---
ساخته شده توسط [HamiD Saeedi](https://saeedii.com)
