"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

// -------------------------------------------------------------
// ADMIN CHARTS
// -------------------------------------------------------------

interface AdminGenderProps {
  maleCount?: number;
  femaleCount?: number;
}

export function AdminGenderDistributionChart({ maleCount = 0, femaleCount = 0 }: AdminGenderProps) {
  const total = (maleCount + femaleCount) || 1;
  const malePercent = Math.round((maleCount / total) * 100);
  const femalePercent = 100 - malePercent;

  const data = [
    { name: `Юноши (${malePercent}%)`, value: maleCount || 1, color: "var(--chart-1)" },
    { name: `Девушки (${femalePercent}%)`, value: femaleCount || 1, color: "var(--chart-4)" },
  ];

  return (
    <div className="h-[250px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value?: any) => [`${value ?? 0} учащихся`, "Количество"]}
            contentStyle={{ backgroundColor: "var(--popover)", borderRadius: "6px", border: "1px solid var(--border)" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs font-medium text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface GroupPerfProps {
  data?: Array<{ group: string; submitted: number }>;
}

const defaultAdminGroupData = [
  { group: "ИС-1-25", submitted: 94 },
  { group: "ИС-2-24", submitted: 88 },
  { group: "ПО-1-25", submitted: 96 },
];

const adminGroupConfig: ChartConfig = {
  submitted: {
    label: "% Сдачи ДЗ",
    color: "var(--chart-1)",
  },
};

export function AdminGroupPerformanceChart({ data = defaultAdminGroupData }: GroupPerfProps) {
  const chartData = data.length > 0 ? data : defaultAdminGroupData;

  return (
    <ChartContainer config={adminGroupConfig} className="h-[250px] w-full">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="group" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} domain={[0, 100]} />
        <Tooltip content={<ChartTooltipContent />} />
        <Bar dataKey="submitted" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="% Сдачи ДЗ" />
      </BarChart>
    </ChartContainer>
  );
}

// -------------------------------------------------------------
// TEACHER CHARTS
// -------------------------------------------------------------

interface TeacherOverviewProps {
  data?: Array<{ week: string; homeworks: number; checked: number }>;
}

const defaultTeacherWeeklyData = [
  { week: "Нед 1", homeworks: 32, checked: 30 },
  { week: "Нед 2", homeworks: 45, checked: 42 },
  { week: "Нед 3", homeworks: 28, checked: 28 },
  { week: "Нед 4", homeworks: 50, checked: 48 },
  { week: "Нед 5", homeworks: 38, checked: 30 },
];

const teacherWeeklyConfig: ChartConfig = {
  homeworks: {
    label: "Сдано ДЗ",
    color: "var(--chart-1)",
  },
  checked: {
    label: "Проверено",
    color: "var(--chart-2)",
  },
};

export function TeacherOverviewChart({ data = defaultTeacherWeeklyData }: TeacherOverviewProps) {
  const chartData = data.length > 0 ? data : defaultTeacherWeeklyData;

  return (
    <ChartContainer config={teacherWeeklyConfig} className="h-[240px] w-full">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <Tooltip content={<ChartTooltipContent />} />
        <Bar dataKey="homeworks" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Сдано работ" />
        <Bar dataKey="checked" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Проверено" />
      </BarChart>
    </ChartContainer>
  );
}

interface TeacherGradeProps {
  accepted?: number;
  revision?: number;
  pending?: number;
}

export function TeacherGradeDistributionChart({ accepted = 0, revision = 0, pending = 0 }: TeacherGradeProps) {
  const total = (accepted + revision + pending) || 1;
  const data = [
    { name: `Принято (${Math.round((accepted / total) * 100)}%)`, value: accepted || 1, color: "var(--chart-2)" },
    { name: `На доработке (${Math.round((revision / total) * 100)}%)`, value: revision || 0, color: "var(--chart-5)" },
    { name: `На проверке (${Math.round((pending / total) * 100)}%)`, value: pending || 0, color: "var(--chart-1)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-[240px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value?: any) => [`${value ?? 0} работ`, "Количество"]}
            contentStyle={{ backgroundColor: "var(--popover)", borderRadius: "6px", border: "1px solid var(--border)" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// -------------------------------------------------------------
// STUDENT CHARTS
// -------------------------------------------------------------

interface StudentProgressProps {
  data?: Array<{ subject: string; grade: number }>;
}

const defaultStudentProgressData = [
  { subject: "Модуль 1", grade: 4.2 },
  { subject: "Модуль 2", grade: 4.5 },
  { subject: "Модуль 3", grade: 4.6 },
  { subject: "Модуль 4", grade: 4.9 },
  { subject: "Модуль 5", grade: 4.8 },
];

const studentProgressConfig: ChartConfig = {
  grade: {
    label: "Средний балл",
    color: "var(--chart-1)",
  },
};

export function StudentProgressChart({ data = defaultStudentProgressData }: StudentProgressProps) {
  const chartData = data.length > 0 ? data : defaultStudentProgressData;

  return (
    <ChartContainer config={studentProgressConfig} className="h-[240px] w-full">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="studentProgressGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} domain={[3, 5]} />
        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
        <Area
          type="monotone"
          dataKey="grade"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#studentProgressGrad)"
          name="Оценка"
        />
      </AreaChart>
    </ChartContainer>
  );
}

interface StudentAttendanceProps {
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
}

export function StudentAttendancePieChart({ presentCount = 92, absentCount = 5, lateCount = 3 }: StudentAttendanceProps) {
  const data = [
    { name: "Присутствовал", value: presentCount, color: "var(--chart-2)" },
    { name: "Опоздание", value: lateCount, color: "var(--chart-1)" },
    { name: "Пропуск", value: absentCount, color: "var(--chart-5)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-[240px] w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value?: any) => [`${value ?? 0}`, "Записей"]}
            contentStyle={{ backgroundColor: "var(--popover)", borderRadius: "6px", border: "1px solid var(--border)" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
