"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Crown,
  Gift,
  Medal,
  Search,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { LEVEL_THRESHOLDS, getLevelInfo } from "@/lib/gamification";
import type { RatingPageDataDTO, RatingQuestDTO } from "../actions";
import { claimQuestRewardAction } from "../actions";
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
  const [students, setStudents] = useState(initialData.students);
  const [quests, setQuests] = useState<RatingQuestDTO[]>(initialData.quests);
  const [myXp, setMyXp] = useState(initialData.myXp);
  const [groupFilter, setGroupFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sortedStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...students]
      .filter((s) => (groupFilter === "ALL" ? true : s.groupId === groupFilter))
      .filter((s) => (!q ? true : s.name.toLowerCase().includes(q)));
  }, [students, groupFilter, search]);

  const myRank = useMemo(() => {
    if (!isStudent) return 0;
    return sortedStudents.findIndex((s) => s.isMe) + 1;
  }, [isStudent, sortedStudents]);

  const myLevel = getLevelInfo(myXp);
  const selectedGroupLabel =
    groupFilter === "ALL"
      ? "Все группы"
      : `Группа ${initialData.groups.find((g) => g.id === groupFilter)?.name ?? ""}`;

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
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="h-8 w-[165px] text-xs font-medium bg-background">
                <div className="flex items-center gap-1.5 truncate">
                  <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                  <SelectValue>{selectedGroupLabel}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  Все группы
                </SelectItem>
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
        </div>
      </div>

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
    </div>
  );
}
