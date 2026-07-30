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

const adminGenderPieData = [
  { name: "Юноши (58%)", value: 198, color: "var(--chart-1)" },
  { name: "Девушки (42%)", value: 142, color: "var(--chart-4)" },
];

export function AdminGenderDistributionChart() {
  return (
    <div className="h-[250px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={adminGenderPieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {adminGenderPieData.map((entry, index) => (
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

const adminGroupData = [
  { group: "ИС-1-25", submitted: 94 },
  { group: "ИС-2-24", submitted: 88 },
  { group: "ПО-1-25", submitted: 96 },
  { group: "ВЕБ-1-23", submitted: 82 },
  { group: "ДИЗ-1-25", submitted: 90 },
];

const adminGroupConfig: ChartConfig = {
  submitted: {
    label: "% Сдачи ДЗ",
    color: "var(--chart-1)",
  },
};

export function AdminGroupPerformanceChart() {
  return (
    <ChartContainer config={adminGroupConfig} className="h-[250px] w-full">
      <BarChart data={adminGroupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

const teacherWeeklyData = [
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

export function TeacherOverviewChart() {
  return (
    <ChartContainer config={teacherWeeklyConfig} className="h-[240px] w-full">
      <BarChart data={teacherWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

const teacherGradePieData = [
  { name: "Отлично (5)", value: 48, color: "var(--chart-2)" },
  { name: "Хорошо (4)", value: 35, color: "var(--chart-1)" },
  { name: "Удовл. (3)", value: 12, color: "var(--chart-3)" },
  { name: "Доработка (2)", value: 5, color: "var(--chart-5)" },
];

export function TeacherGradeDistributionChart() {
  return (
    <div className="h-[240px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={teacherGradePieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {teacherGradePieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value?: any) => [`${value ?? 0}% студентов`, "Доля"]}
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

const studentProgressData = [
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

export function StudentProgressChart() {
  return (
    <ChartContainer config={studentProgressConfig} className="h-[240px] w-full">
      <AreaChart data={studentProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="studentProgressGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} domain={[3.5, 5]} />
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

const studentAttendancePieData = [
  { name: "Присутствовал", value: 92, color: "var(--chart-2)" },
  { name: "Уважительная", value: 5, color: "var(--chart-1)" },
  { name: "Пропуск", value: 3, color: "var(--chart-5)" },
];

export function StudentAttendancePieChart() {
  return (
    <div className="h-[240px] w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={studentAttendancePieData}
            cx="50%"
            cy="45%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={4}
            dataKey="value"
          >
            {studentAttendancePieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value?: any) => [`${value ?? 0}%`, "Процент"]}
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
