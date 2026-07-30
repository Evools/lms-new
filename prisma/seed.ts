import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2025-2026" },
    update: {},
    create: {
      name: "2025-2026",
      isCurrent: true,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-05-31"),
    },
  });

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@lyceum.edu" },
    update: {},
    create: {
      email: "admin@lyceum.edu",
      password: "password123", // In production, password will be hashed
      name: "Администратор Лицея",
      role: Role.ADMIN,
    },
  });

  // Teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@lyceum.edu" },
    update: {},
    create: {
      email: "teacher@lyceum.edu",
      password: "password123",
      name: "Иванов Иван Иванович",
      role: Role.TEACHER,
    },
  });

  // Student (Monitor)
  const monitor = await prisma.user.upsert({
    where: { email: "starosta@lyceum.edu" },
    update: {},
    create: {
      email: "starosta@lyceum.edu",
      password: "password123",
      name: "Петров Алексей",
      role: Role.STUDENT,
    },
  });

  // Student 2
  const student2 = await prisma.user.upsert({
    where: { email: "student2@lyceum.edu" },
    update: {},
    create: {
      email: "student2@lyceum.edu",
      password: "password123",
      name: "Сидорова Анна",
      role: Role.STUDENT,
    },
  });

  // Group
  const group = await prisma.group.upsert({
    where: { name: "ИС-1-25" },
    update: {},
    create: {
      name: "ИС-1-25",
      academicYearId: academicYear.id,
      curatorId: teacher.id,
      monitorId: monitor.id,
    },
  });

  // Group Students
  await prisma.groupStudent.upsert({
    where: {
      groupId_studentId: {
        groupId: group.id,
        studentId: monitor.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      studentId: monitor.id,
    },
  });

  await prisma.groupStudent.upsert({
    where: {
      groupId_studentId: {
        groupId: group.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      studentId: student2.id,
    },
  });

  // Subject
  const subject = await prisma.subject.upsert({
    where: { name: "Веб-программирование" },
    update: {},
    create: {
      name: "Веб-программирование",
      code: "WEB-01",
      description: "Разработка современных веб-приложений",
    },
  });

  // Group Subject
  const groupSubject = await prisma.groupSubject.upsert({
    where: {
      groupId_subjectId_teacherId: {
        groupId: group.id,
        subjectId: subject.id,
        teacherId: teacher.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      subjectId: subject.id,
      teacherId: teacher.id,
    },
  });

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
