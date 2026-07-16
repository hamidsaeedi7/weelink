import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminEmail || !adminPassword || !adminPhone) {
    throw new Error(
      "ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_PHONE must all be set before running the seed script. " +
      "Refusing to fall back to a hardcoded default admin account.",
    );
  }
  if (adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      phone: adminPhone,
      passwordHash,
      role: "SUPER_ADMIN",
      isVerified: true,
      plan: "PRO",
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "ویلینک",
      siteDesc: "پلتفرم لینک بیو فارسی",
      primaryColor: "#111827",
      accentColor: "#F97316",
      adminUsername: "hamid",
      adminEmail,
      planPrices: { monthly: 99000, sixMonths: 540000, yearly: 990000 },
      seoTitle: "ویلینک — صفحه بیو فارسی",
      seoDesc: "با ویلینک یک صفحه بیو حرفه‌ای بسازید",
    },
  });

  // Seed default page contents
  const pages = [
    { id: "about",   title: "درباره ما",   content: { html: "<h2>درباره ویلینک</h2><p>ویلینک پلتفرم ایجاد صفحه بیو فارسی است.</p>" } },
    { id: "contact", title: "تماس با ما",  content: { html: "<h2>تماس با ما</h2><p>ایمیل: info@weeelink.com</p>" } },
    { id: "header",  title: "هدر سایت",    content: { logoText: "ویلینک", phone: "", address: "", navLinks: [] } },
    { id: "footer",  title: "فوتر سایت",   content: { description: "پلتفرم لینک بیو فارسی", copyright: "© ۱۴۰۳ ویلینک", showEnamad: true, socialLinks: { instagram: "", telegram: "", twitter: "" } } },
  ];

  for (const page of pages) {
    await prisma.pageContent.upsert({
      where: { id: page.id },
      update: {},
      create: page,
    });
  }

  console.log("✅ Site settings + page contents initialized");
  console.log("\n🎉 Seed complete!");
  console.log(`   Admin: ${adminEmail} (password not printed to logs)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
