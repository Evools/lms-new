import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Очистка таблицы дежурств (duty_schedules)...");
  const result = await prisma.dutySchedule.deleteMany({});
  console.log(`Успешно удалено записей: ${result.count}`);
}

main()
  .catch((e) => {
    console.error("Ошибка при очистке:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
