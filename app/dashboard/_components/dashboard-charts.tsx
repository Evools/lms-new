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

interface PieTooltipPayloadItem {
  name?: string;
  value?: number;
  payload?: { color?: string; name?: string; value?: number; label?: string };
}

function PieTooltipContent({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: PieTooltipPayloadItem[];
  total?: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const label = item.name || item.payload?.name || "";
  const value = item.value ?? item.payload?.value ?? 0;
  const color = item.payload?.color || "var(--primary)";
  const percent = total && total > 0 ? Math.round((value / total) * 100) : null;

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground px-3 py-1.5 text-xs shadow-xl ring-1 ring-foreground/5 z-50 pointer-events-none select-none min-w-32 animate-in fade-in-0 zoom-in-95 duration-200 ease-out">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-muted-foreground font-medium truncate">{label}</span>
        </div>
        <div className="flex items-baseline gap-1 shrink-0 font-mono">
          <span className="font-bold text-foreground">{value}</span>
          {percent !== null && (
            <span className="text-[10px] text-muted-foreground">({percent}%)</span>
          )}
        </div>
      </div>
    </div>
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
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const total = (maleCount + femaleCount) || 1;
  const malePercent = Math.round((maleCount / total) * 100);
  const femalePercent = 100 - malePercent;

  const data = [
    { name: "Юноши", label: `Юноши (${malePercent}%)`, value: maleCount || 1, color: "var(--chart-1)" },
    { name: "Девушки", label: `Девушки (${femalePercent}%)`, value: femaleCount || 1, color: "var(--chart-4)" },
  ];

  const activeItem = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  return (
    <div className="h-[250px] w-full min-w-0 min-h-0 flex items-center justify-center relative">
      {/* Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 select-none pb-9">
        {activeItem ? (
          <>
            <span className="text-base font-bold text-foreground leading-none">
              {activeItem.value}
            </span>
            <span className="text-[9px] text-muted-foreground font-medium mt-0.5">
              {activeItem.name} ({Math.round((activeItem.value / total) * 100)}%)
            </span>
          </>
        ) : (
          <>
            <span className="text-base font-bold text-foreground leading-none">{total}</span>
            <span className="text-[9px] text-muted-foreground font-medium mt-0.5">учащихся</span>
          </>
        )}
      </div>

      {isMounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} className="relative z-10">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="none"
                  className="transition-opacity duration-150 cursor-pointer"
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6}
                />
              ))}
            </Pie>
            <Tooltip
              content={<PieTooltipContent total={total} />}
              offset={15}
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
              allowEscapeViewBox={{ x: true, y: true }}
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
    <ChartContainer config={adminGroupConfig} className="aspect-auto h-[210px] w-full">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="group" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} domain={[0, 100]} />
        <Tooltip
          content={<ChartTooltipContent />}
          cursor={{ fill: "hsl(var(--muted)/0.3)" }}
          wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
          allowEscapeViewBox={{ x: true, y: true }}
        />
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
    <ChartContainer config={teacherWeeklyConfig} className="aspect-auto h-[210px] w-full">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} />
        <Tooltip
          content={<ChartTooltipContent />}
          cursor={{ fill: "hsl(var(--muted)/0.3)" }}
          wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
          allowEscapeViewBox={{ x: true, y: true }}
        />
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
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
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
    { name: "Принято", label: `Принято (${accepted})`, value: accepted, color: "hsl(var(--primary))" },
    { name: "На доработке", label: `На доработке (${revision})`, value: revision, color: "#f59e0b" },
    { name: "На проверке", label: `На проверке (${pending})`, value: pending, color: "#0ea5e9" },
  ].filter((d) => d.value > 0);

  const activeItem = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  return (
    <div className="h-[210px] w-full min-w-0 min-h-0 flex items-center justify-center relative">
      {/* Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 select-none pb-9">
        {activeItem ? (
          <>
            <span className="text-base font-bold text-foreground leading-none">
              {activeItem.value}
            </span>
            <span className="text-[9px] text-muted-foreground font-medium mt-0.5">
              {activeItem.name} ({Math.round((activeItem.value / total) * 100)}%)
            </span>
          </>
        ) : (
          <>
            <span className="text-base font-bold text-foreground leading-none">{total}</span>
            <span className="text-[9px] text-muted-foreground font-medium mt-0.5">всего работ</span>
          </>
        )}
      </div>

      {isMounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} className="relative z-10">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="none"
                  className="transition-opacity duration-150 cursor-pointer"
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6}
                />
              ))}
            </Pie>
            <Tooltip
              content={<PieTooltipContent total={total} />}
              offset={15}
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
              allowEscapeViewBox={{ x: true, y: true }}
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
    <ChartContainer config={studentProgressConfig} className="aspect-auto h-[210px] w-full">
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
        <Tooltip
          content={<ChartTooltipContent indicator="dot" />}
          cursor={{ stroke: "hsl(var(--muted-foreground)/0.3)", strokeWidth: 1 }}
          wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
          allowEscapeViewBox={{ x: true, y: true }}
        />
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

  const presentPercent = Math.round((presentCount / total) * 100);
  const latePercent = Math.round((lateCount / total) * 100);
  const absentPercent = Math.round((absentCount / total) * 100);
  const excusedPercent = 100 - (presentPercent + latePercent + absentPercent);

  const statusConfig =
    attendancePercent >= 85
      ? { label: "Высокая", color: "text-primary bg-primary/10 border-primary/20" }
      : attendancePercent >= 70
      ? { label: "Хорошая", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" }
      : { label: "Низкая", color: "text-destructive bg-destructive/10 border-destructive/20" };

  return (
    <div className="w-full min-w-0 min-h-0 flex flex-col justify-between h-[210px] py-1">
      {/* Top Header Rate & Status */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground tracking-tight font-mono">
              {attendancePercent}%
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Общая посещаемость за семестр
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-foreground font-mono">{total}</span>
          <span className="text-[10px] text-muted-foreground block">всего пар</span>
        </div>
      </div>

      {/* Multi-Segment Stacked Progress Bar */}
      <div className="space-y-1.5 my-auto">
        <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden flex gap-0.5 p-0.5 border">
          {presentCount > 0 && (
            <div
              style={{ width: `${(presentCount / total) * 100}%` }}
              className="h-full bg-primary rounded-full transition-all duration-300"
              title={`Был: ${presentCount} (${presentPercent}%)`}
            />
          )}
          {lateCount > 0 && (
            <div
              style={{ width: `${(lateCount / total) * 100}%` }}
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              title={`Опоздал: ${lateCount} (${latePercent}%)`}
            />
          )}
          {absentCount > 0 && (
            <div
              style={{ width: `${(absentCount / total) * 100}%` }}
              className="h-full bg-destructive rounded-full transition-all duration-300"
              title={`НБ: ${absentCount} (${absentPercent}%)`}
            />
          )}
          {excusedCount > 0 && (
            <div
              style={{ width: `${(excusedCount / total) * 100}%` }}
              className="h-full bg-sky-500 rounded-full transition-all duration-300"
              title={`Справка: ${excusedCount} (${excusedPercent}%)`}
            />
          )}
        </div>
      </div>

      {/* 2x2 Metric Tiles */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t">
        <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/15">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <span className="text-[11px] font-medium text-foreground">Был</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xs font-bold text-primary">{presentCount}</span>
            <span className="text-[9px] text-muted-foreground">({presentPercent}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[11px] font-medium text-foreground">Опоздал</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{lateCount}</span>
            <span className="text-[9px] text-muted-foreground">({latePercent}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/15">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
            <span className="text-[11px] font-medium text-foreground">НБ</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xs font-bold text-destructive">{absentCount}</span>
            <span className="text-[9px] text-muted-foreground">({absentPercent}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-sky-500/5 border border-sky-500/15">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
            <span className="text-[11px] font-medium text-foreground">Справка</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{excusedCount}</span>
            <span className="text-[9px] text-muted-foreground">({Math.max(0, excusedPercent)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
