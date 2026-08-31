import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@lyceum.edu").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "password123";
  const adminName = process.env.ADMIN_NAME || "Администратор Лицея";
  const adminPhone = process.env.ADMIN_PHONE || null;

  console.log("\n🌱 Инициализация аккаунта администратора для продакшена / Neon...");
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`👤 Имя: ${adminName}`);

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 1. Создаем или проверяем базовый учебный год
  const currentYear = new Date().getFullYear();
  const academicYearName = `${currentYear}-${currentYear + 1}`;

  const academicYear = await prisma.academicYear.upsert({
    where: { name: academicYearName },
    update: {},
    create: {
      name: academicYearName,
      isCurrent: true,
      startDate: new Date(`${currentYear}-09-01`),
      endDate: new Date(`${currentYear + 1}-05-31`),
    },
  });

  console.log(`📅 Актуальный учебный год: ${academicYear.name}`);

  // 2. Создаем или обновляем аккаунт администратора
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      name: adminName,
      role: Role.ADMIN,
      isActive: true,
      ...(adminPhone ? { phone: adminPhone } : {}),
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: Role.ADMIN,
      isActive: true,
      phone: adminPhone,
    },
  });

  console.log("✅ Аккаунт администратора успешно подготовлен!");
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Роль: ${admin.role}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Ошибка при создании администратора:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
