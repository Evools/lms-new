"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Award,
  Crown,
  Gift,
  Medal,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { LEVEL_THRESHOLDS, getLevelInfo } from "@/lib/gamification";
import type { RatingPageDataDTO, RatingQuestDTO } from "../actions";
import {
  claimQuestRewardAction,
  getRatingPageDataAction,
  resetRatingProgressAction,
} from "../actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name[0] || "С").toUpperCase();
}

interface RatingDemoViewProps {
  initialData: RatingPageDataDTO;
  userName: string;
  userRole: string;
}

export function RatingDemoView({ initialData, userName, userRole }: RatingDemoViewProps) {
  const isStudent = userRole === "STUDENT";
  const isAdmin = userRole === "ADMIN";
  const [students, setStudents] = useState(initialData.students);
  const [quests, setQuests] = useState<RatingQuestDTO[]>(initialData.quests);
  const [myXp, setMyXp] = useState(initialData.myXp);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialData.selectedGroupId);
  const [search, setSearch] = useState("");
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sortedStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, search]);

  const myRank = useMemo(() => {
    if (!isStudent) return 0;
    return sortedStudents.findIndex((s) => s.isMe) + 1;
  }, [isStudent, sortedStudents]);

  const myLevel = getLevelInfo(myXp);
  const selectedGroupLabel = selectedGroupId
    ? `Группа ${initialData.groups.find((g) => g.id === selectedGroupId)?.name ?? ""}`
    : "Нет групп";

  const handleGroupChange = (newGroupId: string) => {
    setSelectedGroupId(newGroupId);
    startTransition(async () => {
      const next = await getRatingPageDataAction(newGroupId);
      setStudents(next.students);
    });
  };

  const handleResetProgress = (scope: "group" | "all") => {
    startTransition(async () => {
      const res = await resetRatingProgressAction(
        scope === "group" && selectedGroupId ? selectedGroupId : undefined,
      );
      if (!res.success) {
        toast.add({ title: res.error || "Ошибка при сбросе", type: "error" });
        return;
      }
      setStudents((prev) => prev.map((s) => ({ ...s, xp: 0 })));
      setResetOpen(false);
      toast.add({
        title:
          scope === "group"
            ? `Прогресс группы ${initialData.groups.find((g) => g.id === selectedGroupId)?.name ?? ""} сброшен`
            : "Прогресс рейтинга сброшен у всех студентов",
        type: "success",
      });
    });
  };

  const staffStats = useMemo(() => {
    const total = sortedStudents.length;
    const totalXp = sortedStudents.reduce((acc, s) => acc + s.xp, 0);
    const avgXp = total > 0 ? Math.round(totalXp / total) : 0;
    const avgLvl = getLevelInfo(avgXp);
    const leader = sortedStudents[0] ?? null;

    return {
      total,
      totalXp,
      avgXp,
      avgLvl,
      leader,
      topThree: sortedStudents.slice(0, 3),
    };
  }, [sortedStudents]);

  const handleClaimQuest = (quest: RatingQuestDTO) => {
    if (quest.claimed || quest.progress < quest.target || isPending) return;

    startTransition(async () => {
      const res = await claimQuestRewardAction(quest.id);
      if (!res.success) {
        toast.add({ title: res.error || "Не удалось получить награду", type: "error" });
        return;
      }

      const gained = res.rewardXp ?? quest.rewardXp;
      setQuests((prev) =>
        prev.map((q) => (q.id === quest.id ? { ...q, claimed: true } : q)),
      );
      setMyXp((prev) => prev + gained);
      setStudents((prev) =>
        prev
          .map((s) => (s.isMe ? { ...s, xp: s.xp + gained } : s))
          .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, "ru")),
      );
      toast.add({ title: `+${gained} XP: ${quest.title}`, type: "success" });
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Рейтинг и XP
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isStudent
              ? `Ваш уровень, квесты и рейтинг в группе ${initialData.myGroupName}.`
              : "Успеваемость и активность студентов по очкам XP."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isStudent ? (
            <Select
              value={selectedGroupId}
              onValueChange={handleGroupChange}
              disabled={initialData.groups.length === 0 || isPending}
            >
              <SelectTrigger className="h-8 w-[165px] text-xs font-medium bg-background">
                <div className="flex items-center gap-1.5 truncate">
                  <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                  <SelectValue>{selectedGroupLabel}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {initialData.groups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs">
                    Группа {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge
              variant="outline"
              className="h-8 px-2.5 text-xs font-medium border-border bg-card gap-1.5"
            >
              <Users className="h-3.5 w-3.5 text-primary" />
              Группа {initialData.myGroupName}
            </Badge>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-medium cursor-pointer"
            onClick={() => setLevelsOpen(true)}
          >
            Шкала уровней
          </Button>

          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Сбросить XP
            </Button>
          )}
        </div>
      </div>

      {/* Staff (Admin / Teacher) Overview: KPI + Top-3 Podium + Group Comparison */}
      {!isStudent && (
        <div className="space-y-3">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card size="sm" className="py-3">
              <CardContent className="px-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Студентов в рейтинге
                  </div>
                  <div className="text-base font-bold font-mono mt-0.5">{staffStats.total}</div>
                </div>
                <div className="h-8 w-8 rounded-lg border border-border bg-muted/40 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="py-3">
              <CardContent className="px-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Лидер рейтинга
                  </div>
                  <div className="text-xs font-bold truncate mt-0.5">
                    {staffStats.leader ? staffStats.leader.name : "—"}
                  </div>
                  <div className="text-[11px] font-mono text-primary">
                    {staffStats.leader
                      ? `${staffStats.leader.xp.toLocaleString("ru-RU")} XP`
                      : "0 XP"}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                  <Crown className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="py-3">
              <CardContent className="px-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-medium">Средний XP</div>
                  <div className="text-base font-bold font-mono mt-0.5">
                    {staffStats.avgXp.toLocaleString("ru-RU")}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    Ур. {staffStats.avgLvl.level} · {staffStats.avgLvl.title}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg border border-border bg-muted/40 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="py-3">
              <CardContent className="px-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Суммарный XP
                  </div>
                  <div className="text-base font-bold font-mono text-primary mt-0.5">
                    {staffStats.totalXp.toLocaleString("ru-RU")}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg border border-border bg-muted/40 flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top-3 Leaders: Champion Spotlight + Runners-up */}
          {staffStats.topThree.length > 0 && (() => {
            const first = staffStats.topThree[0];
            const firstLvl = getLevelInfo(first.xp);
            const runners = staffStats.topThree.slice(1, 3);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* #1 Champion Spotlight */}
                <Card
                  size="sm"
                  className={`${
                    runners.length > 0 ? "lg:col-span-6" : "lg:col-span-12"
                  } py-3.5 border-primary bg-gradient-to-br from-primary/15 via-primary/5 to-card flex flex-col justify-between`}
                >
                  <CardContent className="px-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="text-[11px] font-medium bg-primary text-primary-foreground gap-1">
                        <Crown className="h-3 w-3" />
                        1 место · Лидер группы
                      </Badge>
                      <span className="text-sm font-mono font-bold text-primary">
                        {first.xp.toLocaleString("ru-RU")} XP
                      </span>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground border border-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(first.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate" title={first.name}>
                          {first.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Ур. {firstLvl.level} · {firstLvl.title}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-background/80 overflow-hidden border border-primary/20">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${firstLvl.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{firstLvl.progress}% уровня</span>
                        <span>до {firstLvl.level + 1} ур.: {firstLvl.nextXp - first.xp} XP</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* #2 & #3 Runners-up */}
                {runners.length > 0 && (
                  <div className="lg:col-span-6 flex flex-col justify-between gap-2.5">
                    {runners.map((st, idx) => {
                      const place = idx + 2;
                      const lvl = getLevelInfo(st.xp);
                      return (
                        <Card key={st.id} size="sm" className="flex-1 py-2.5 flex items-center">
                          <CardContent className="px-4 w-full flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex flex-col items-center justify-center w-8 shrink-0">
                                <Medal className="h-4 w-4 text-primary/70" />
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  #{place}
                                </span>
                              </div>
                              <div className="h-9 w-9 rounded-full bg-muted/60 border border-border flex items-center justify-center font-bold text-xs shrink-0">
                                {getInitials(st.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate" title={st.name}>
                                  {st.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  Ур. {lvl.level} · {lvl.title}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 space-y-1">
                              <div className="text-xs font-mono font-bold text-primary">
                                {st.xp.toLocaleString("ru-RU")} XP
                              </div>
                              <div className="w-20 h-1 rounded-full bg-muted overflow-hidden border border-border ml-auto">
                                <div
                                  className="h-full bg-primary/70"
                                  style={{ width: `${lvl.progress}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Student-only Top Row: Profile + Quests */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <Card size="sm" className="lg:col-span-7 py-3 flex flex-col justify-between">
            <CardContent className="px-4 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(userName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold truncate">{userName}</span>
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium border-primary/30 bg-primary/10 text-primary"
                      >
                        Ур. {myLevel.level} · {myLevel.title}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>Группа {initialData.myGroupName}</span>
                      <span>•</span>
                      <span>
                        Место:{" "}
                        <strong className="font-medium text-primary">
                          {myRank > 0 ? `#${myRank}` : "—"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold font-mono text-primary">
                    {myXp.toLocaleString("ru-RU")} XP
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    +{myLevel.nextXp - myXp} до {myLevel.level + 1} ур.
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${myLevel.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>
                    Ур. {myLevel.level} ({myLevel.floorXp})
                  </span>
                  <span>{myLevel.progress}%</span>
                  <span>
                    Ур. {myLevel.level + 1} ({myLevel.nextXp})
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>+100 XP за принятое ДЗ (+30 XP в срок)</span>
                <span>•</span>
                <span>+40…100 XP за пройденный тест</span>
              </div>
            </CardContent>
          </Card>

          <Card size="sm" className="lg:col-span-5 py-3">
            <Tabs defaultValue="weekly" className="h-full flex flex-col">
              <CardHeader className="px-4 pb-2 border-b border-border space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Gift className="h-4 w-4 text-primary" />
                    Квесты
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-medium border-border">
                    Выполнено: {quests.filter((q) => q.claimed).length} / {quests.length}
                  </Badge>
                </div>
                <TabsList className="w-full grid grid-cols-2 h-8 p-0.5">
                  <TabsTrigger
                    value="weekly"
                    className="h-full py-0 text-[11px] data-[active]:shadow-none aria-selected:shadow-none"
                  >
                    Недельные
                  </TabsTrigger>
                  <TabsTrigger
                    value="monthly"
                    className="h-full py-0 text-[11px] data-[active]:shadow-none aria-selected:shadow-none"
                  >
                    Месячные
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              {(["weekly", "monthly"] as const).map((questTab) => (
                <TabsContent
                  key={questTab}
                  value={questTab}
                  className="px-4 pt-2.5 space-y-2 text-xs mt-0"
                >
                  {quests
                    .filter((q) => q.period === questTab)
                    .map((q) => {
                      const ready = q.progress >= q.target && !q.claimed;
                      const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
                      return (
                        <div
                          key={q.id}
                          className={`p-2 rounded-lg border space-y-1.5 ${
                            ready
                              ? "border-primary/40 bg-primary/5"
                              : q.claimed
                                ? "border-border bg-muted/20 opacity-60"
                                : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{q.title}</div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {q.desc}
                              </div>
                            </div>
                            {q.claimed ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-border shrink-0"
                              >
                                Получено
                              </Badge>
                            ) : ready ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPending}
                                className="h-6 px-2 text-[11px] font-medium shrink-0 cursor-pointer"
                                onClick={() => handleClaimQuest(q)}
                              >
                                +{q.rewardXp} XP
                              </Button>
                            ) : (
                              <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                                {q.progress}/{q.target}
                              </span>
                            )}
                          </div>
                          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </div>
      )}

      {/* Leaderboard Table */}
      <Card size="sm" className="py-0">
        <CardHeader className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Таблица лидеров ({sortedStudents.length})
          </CardTitle>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск студента..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-2.5 px-4 font-medium w-20">Место</th>
                <th className="py-2.5 px-4 font-medium">Студент</th>
                <th className="py-2.5 px-4 font-medium">Группа</th>
                <th className="py-2.5 px-4 font-medium">Уровень</th>
                <th className="py-2.5 px-4 font-medium text-right">Очки (XP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStudents.map((s, idx) => {
                const lvl = getLevelInfo(s.xp);
                return (
                  <tr
                    key={s.id}
                    className={s.isMe ? "bg-primary/10" : "hover:bg-muted/30 transition-colors"}
                  >
                    <td className="py-2.5 px-4">
                      {idx === 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-primary">
                          <Crown className="h-3.5 w-3.5" />
                          #1
                        </span>
                      ) : idx === 1 || idx === 2 ? (
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <Medal className="h-3.5 w-3.5 text-primary/70" />#{idx + 1}
                        </span>
                      ) : (
                        <span className="font-mono text-muted-foreground">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                        {s.isMe && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium border-primary/40 text-primary"
                          >
                            Вы
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">{s.groupName}</td>
                    <td className="py-2.5 px-4">
                      Ур. {lvl.level} · {lvl.title}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-primary">
                      {s.xp.toLocaleString("ru-RU")} XP
                    </td>
                  </tr>
                );
              })}
              {sortedStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Студенты не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* All 20+ Levels Modal */}
      <Dialog open={levelsOpen} onOpenChange={setLevelsOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[520px]">
          <DialogHeader className="pb-2 border-b border-border gap-1 text-left">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Шкала уровней (1–20+)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Прогрессивная шкала XP. После 20 уровня новый ранг открывается каждые +1 200 XP.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
            {LEVEL_THRESHOLDS.map((item) => {
              const isCurrent = isStudent && item.level === myLevel.level;
              const unlocked = isStudent && myXp >= item.minXp;
              return (
                <div
                  key={item.level}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs ${
                    isCurrent
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : unlocked
                        ? "border-border bg-card"
                        : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <span className="truncate">
                    Ур. {item.level} · {item.title}
                  </span>
                  <span className="font-mono text-[11px] shrink-0 ml-2">
                    {item.minXp.toLocaleString("ru-RU")} XP
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Reset Rating Confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={(open) => !isPending && setResetOpen(open)}>
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold">
              Сбросить прогресс XP?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Обнулит очки XP, уровни и историю начислений (у выбранной группы или у всех студентов
              лицея). Отменить это действие нельзя.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row flex-wrap justify-end gap-2 pt-2 border-t mt-2">
            <AlertDialogCancel
              disabled={isPending}
              className="h-6 px-2.5 text-xs font-medium mt-0"
            >
              Отмена
            </AlertDialogCancel>
            {selectedGroupId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleResetProgress("group")}
                className="h-6 px-2.5 text-xs font-medium text-destructive border-destructive/40 hover:bg-destructive/10 cursor-pointer"
              >
                Только {selectedGroupLabel}
              </Button>
            )}
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                handleResetProgress("all");
              }}
              className="h-6 px-2.5 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Сброс..." : "У всех студентов"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
