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
import { CalendarCheck, TrendingUp, ClipboardCheck, BarChart3 } from "lucide-react";

const emptySubscribe = () => () => {};

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// -------------------------------------------------------------
// ADMIN CHARTS
// -------------------------------------------------------------

interface AdminGenderProps {
  maleCount?: number;
  femaleCount?: number;
}

export function AdminGenderDistributionChart({ maleCount = 0, femaleCount = 0 }: AdminGenderProps) {
  const isMounted = useMounted();
  const total = (maleCount + femaleCount) || 1;
  const malePercent = Math.round((maleCount / total) * 100);
  const femalePercent = 100 - malePercent;

  const data = [
    { name: `Юноши (${malePercent}%)`, value: maleCount || 1, color: "var(--chart-1)" },
    { name: `Девушки (${femalePercent}%)`, value: femaleCount || 1, color: "var(--chart-4)" },
  ];

  return (
    <div className="h-[250px] w-full min-w-0 min-h-0 flex items-center justify-center">
      {isMounted ? (
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
      ) : null}
    </div>
  );
}

interface GroupPerfProps {
  data?: Array<{ group: string; submitted: number }>;
}

const adminGroupConfig: ChartConfig = {
  submitted: {
    label: "% Сдачи ДЗ",
    color: "var(--primary)",
  },
};

export function AdminGroupPerformanceChart({ data = [] }: GroupPerfProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[210px] w-full flex flex-col items-center justify-center text-center p-4 gap-2">
        <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">Нет данных по группам</div>
          <div className="text-[11px] text-muted-foreground">
            Статистика активности появится после создания заданий
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={adminGroupConfig} className="h-[210px] w-full">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="group" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} domain={[0, 100]} />
        <Tooltip content={<ChartTooltipContent />} />
        <Bar dataKey="submitted" fill="var(--primary)" radius={[4, 4, 0, 0]} name="% Сдачи ДЗ" />
      </BarChart>
    </ChartContainer>
  );
}

// -------------------------------------------------------------
// TEACHER CHARTS
// -------------------------------------------------------------

interface TeacherOverviewProps {
  data?: Array<{ name: string; total: number; checked: number }>;
}

const teacherWeeklyConfig: ChartConfig = {
  total: {
    label: "Сдано работ",
    color: "var(--primary)",
  },
  checked: {
    label: "Проверено",
    color: "#0ea5e9",
  },
};

export function TeacherOverviewChart({ data = [] }: TeacherOverviewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[210px] w-full flex flex-col items-center justify-center text-center p-4 gap-2">
        <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">Нет активных домашних заданий</div>
          <div className="text-[11px] text-muted-foreground">
            Создайте задание в разделе «Задания», чтобы отслеживать динамику сдачи
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={teacherWeeklyConfig} className="h-[210px] w-full">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} />
        <Tooltip content={<ChartTooltipContent />} />
        <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Сдано работ" />
        <Bar dataKey="checked" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Проверено" />
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
  const isMounted = useMounted();
  const total = accepted + revision + pending;
  if (total === 0) {
    return (
      <div className="h-[210px] w-full flex flex-col items-center justify-center text-center p-4 gap-2">
        <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">Нет сданных работ</div>
          <div className="text-[11px] text-muted-foreground">
            Статистика появится после проверки домашних заданий
          </div>
        </div>
      </div>
    );
  }

  const data = [
    { name: `Принято (${accepted})`, value: accepted, color: "hsl(var(--primary))" },
    { name: `На доработке (${revision})`, value: revision, color: "#f59e0b" },
    { name: `На проверке (${pending})`, value: pending, color: "#0ea5e9" },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-[210px] w-full min-w-0 min-h-0 flex items-center justify-center">
      {isMounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value?: any) => [`${value ?? 0} работ`, "Количество"]}
              contentStyle={{ backgroundColor: "var(--popover)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "11px" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------
// STUDENT CHARTS
// -------------------------------------------------------------

interface StudentProgressProps {
  data?: Array<{ subject: string; grade: number }>;
}

const studentProgressConfig: ChartConfig = {
  grade: {
    label: "Оценка",
    color: "var(--primary)",
  },
};

export function StudentProgressChart({ data = [] }: StudentProgressProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[210px] w-full flex flex-col items-center justify-center text-center p-4 gap-2">
        <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">Нет данных об успеваемости</div>
          <div className="text-[11px] text-muted-foreground">
            Результаты тестов и проверенных заданий появятся здесь
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={studentProgressConfig} className="h-[210px] w-full">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="studentProgressGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} domain={[0, 5]} />
        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
        <Area
          type="monotone"
          dataKey="grade"
          stroke="var(--primary)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#studentProgressGrad)"
          name="Балл"
        />
      </AreaChart>
    </ChartContainer>
  );
}

interface StudentAttendanceProps {
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  excusedCount?: number;
}

export function StudentAttendancePieChart({
  presentCount = 0,
  absentCount = 0,
  lateCount = 0,
  excusedCount = 0,
}: StudentAttendanceProps) {
  const isMounted = useMounted();
  const total = presentCount + absentCount + lateCount + excusedCount;

  if (total === 0) {
    return (
      <div className="h-[210px] w-full flex flex-col items-center justify-center text-center p-4 gap-2">
        <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
          <CalendarCheck className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">Нет отметок посещаемости</div>
          <div className="text-[11px] text-muted-foreground">
            Преподаватели пока не выставляли посещаемость
          </div>
        </div>
      </div>
    );
  }

  const attendancePercent = Math.round(((presentCount + lateCount) / total) * 100);

  const data = [
    { name: `Был (${presentCount})`, value: presentCount, color: "var(--primary)" },
    { name: `Опоздал (${lateCount})`, value: lateCount, color: "#f59e0b" },
    { name: `НБ (${absentCount})`, value: absentCount, color: "var(--destructive)" },
    { name: `Справка (${excusedCount})`, value: excusedCount, color: "#0ea5e9" },
  ].filter((d) => d.value > 0);

  return (
    <div className="w-full min-w-0 min-h-0 space-y-3">
      <div className="h-[160px] w-full min-w-0 min-h-0 relative flex items-center justify-center">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value?: any) => [`${value ?? 0} занятий`, "Количество"]}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-bold text-foreground leading-none">{attendancePercent}%</span>
          <span className="text-[9px] text-muted-foreground font-medium mt-0.5">посещаемость</span>
        </div>
      </div>

      {/* Legend summary pills matching project theme */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px]">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          <span className="text-muted-foreground">Был:</span>
          <span className="font-bold text-primary ml-auto">{presentCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px]">
          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-muted-foreground">Опоздал:</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 ml-auto">{lateCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-[10px]">
          <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
          <span className="text-muted-foreground">НБ:</span>
          <span className="font-bold text-destructive ml-auto">{absentCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-[10px]">
          <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
          <span className="text-muted-foreground">Справка:</span>
          <span className="font-bold text-sky-600 dark:text-sky-400 ml-auto">{excusedCount}</span>
        </div>
      </div>
    </div>
  );
}
