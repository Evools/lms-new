import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with full student roster...");

  const hashedPassword = await bcrypt.hash("password123", 10);

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
    update: { password: hashedPassword },
    create: {
      email: "admin@lyceum.edu",
      password: hashedPassword,
      name: "Администратор Лицея",
      role: Role.ADMIN,
    },
  });

  // Teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@lyceum.edu" },
    update: { password: hashedPassword },
    create: {
      email: "teacher@lyceum.edu",
      password: hashedPassword,
      name: "Иванов Иван Иванович",
      role: Role.TEACHER,
    },
  });

  // Roster of 12 Students
  const studentRoster = [
    { email: "starosta@lyceum.edu", name: "Петров Алексей (Староста)", role: Role.STUDENT },
    { email: "student2@lyceum.edu", name: "Сидорова Анна", role: Role.STUDENT },
    { email: "student3@lyceum.edu", name: "Абдрахманов Эльдар", role: Role.STUDENT },
    { email: "student4@lyceum.edu", name: "Жаныбекова Асель", role: Role.STUDENT },
    { email: "student5@lyceum.edu", name: "Токтосунов Адилет", role: Role.STUDENT },
    { email: "student6@lyceum.edu", name: "Нурланова Динара", role: Role.STUDENT },
    { email: "student7@lyceum.edu", name: "Эркинбеков Бекназар", role: Role.STUDENT },
    { email: "student8@lyceum.edu", name: "Касымов Бактыбек", role: Role.STUDENT },
    { email: "student9@lyceum.edu", name: "Саматова Алина", role: Role.STUDENT },
    { email: "student10@lyceum.edu", name: "Асанов Марат", role: Role.STUDENT },
    { email: "student11@lyceum.edu", name: "Бакиров Данияр", role: Role.STUDENT },
    { email: "student12@lyceum.edu", name: "Сулайманова Айгерим", role: Role.STUDENT },
  ];

  const createdStudents = [];
  for (const st of studentRoster) {
    const u = await prisma.user.upsert({
      where: { email: st.email },
      update: { password: hashedPassword, name: st.name },
      create: {
        email: st.email,
        password: hashedPassword,
        name: st.name,
        role: st.role,
      },
    });
    createdStudents.push(u);
  }

  const monitor = createdStudents[0];

  // Group
  const group = await prisma.group.upsert({
    where: { name: "ИС-1-25" },
    update: { curatorId: teacher.id, monitorId: monitor.id },
    create: {
      name: "ИС-1-25",
      academicYearId: academicYear.id,
      curatorId: teacher.id,
      monitorId: monitor.id,
    },
  });

  // Link all 12 students to group
  for (const st of createdStudents) {
    await prisma.groupStudent.upsert({
      where: {
        groupId_studentId: {
          groupId: group.id,
          studentId: st.id,
        },
      },
      update: {},
      create: {
        groupId: group.id,
        studentId: st.id,
      },
    });
  }

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
  await prisma.groupSubject.upsert({
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

  // Clean old duty schedule to force fresh auto-generation with all 12 students
  await prisma.dutySchedule.deleteMany({
    where: { groupId: group.id },
  });

  console.log("Seeding finished successfully with 12 group students.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
