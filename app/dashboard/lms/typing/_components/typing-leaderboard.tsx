"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCpmVerdict, TypingLanguage } from "../_lib/text-generator";
import { StudentTypingProfile, TypingAttemptItem } from "../actions";
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Clock,
  Gauge,
  Percent,
  History,
  Calendar,
  Sparkles,
} from "lucide-react";

interface TypingLeaderboardProps {
  leaderboard: {
    topRU: StudentTypingProfile[];
    topEN: StudentTypingProfile[];
    topCODE: StudentTypingProfile[];
  };
  myProfile: StudentTypingProfile | null;
  myRecentAttempts: TypingAttemptItem[];
}

export function TypingLeaderboard({
  leaderboard,
  myProfile,
  myRecentAttempts,
}: TypingLeaderboardProps) {
  const [activeLang, setActiveLang] = useState<TypingLanguage>("RU");

  const currentList =
    activeLang === "RU"
      ? leaderboard.topRU
      : activeLang === "EN"
      ? leaderboard.topEN
      : leaderboard.topCODE;

  return (
    <div className="space-y-4 text-xs">
      {/* Top Language Switcher */}
      <div className="bg-card border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Таблица лидеров лицея</h3>
            <p className="text-[11px] text-muted-foreground">
              Топ самых быстрых студентов по скорости и точности слепой печати
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs">
          <button
            type="button"
            onClick={() => setActiveLang("RU")}
            className={`h-6 px-3 rounded-md font-medium transition-colors ${
              activeLang === "RU"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Русский (RU)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang("EN")}
            className={`h-6 px-3 rounded-md font-medium transition-colors ${
              activeLang === "EN"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            English (EN)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang("CODE")}
            className={`h-6 px-3 rounded-md font-medium transition-colors ${
              activeLang === "CODE"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Web-Code
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left (2 spans): Leaderboard Table */}
        <div className="lg:col-span-2 border rounded-xl bg-card overflow-hidden shadow-2xs">
          <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Medal className="h-3.5 w-3.5 text-primary" />
              Топ-20 результатов ({activeLang})
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Всего участников: {currentList.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-2.5 w-12 text-center">Ранг</th>
                  <th className="p-2.5 min-w-[180px]">Учащийся</th>
                  <th className="p-2.5 text-center min-w-[100px]">Группа</th>
                  <th className="p-2.5 text-center w-24">Скорость (CPM)</th>
                  <th className="p-2.5 text-center w-20">Точность</th>
                  <th className="p-2.5 text-right min-w-[120px]">Уровень</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      В этой категории пока нет завершенных заездов. Будьте первыми!
                    </td>
                  </tr>
                ) : (
                  currentList.map((st, idx) => {
                    const record =
                      activeLang === "RU"
                        ? st.bestRU
                        : activeLang === "EN"
                        ? st.bestEN
                        : st.bestCODE;

                    if (!record) return null;
                    const verdict = getCpmVerdict(record.cpm);

                    return (
                      <tr key={st.studentId} className="hover:bg-muted/15 transition-colors">
                        {/* Rank Badge */}
                        <td className="p-2.5 text-center font-bold font-mono">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-xs">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-400/20 text-slate-700 dark:text-slate-300 border border-slate-400/40 text-xs">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 border border-amber-700/40 text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{idx + 1}</span>
                          )}
                        </td>

                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            {st.studentAvatar ? (
                              <img
                                src={st.studentAvatar}
                                alt=""
                                className="h-5 w-5 rounded-full object-cover shrink-0 border border-border"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
                                {st.studentName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <Link
                              href={`/dashboard/students/${st.studentId}`}
                              className="font-medium text-foreground hover:text-primary hover:underline transition-colors truncate max-w-[200px]"
                            >
                              {st.studentName}
                            </Link>
                          </div>
                        </td>

                        <td className="p-2.5 text-center text-muted-foreground font-medium">
                          {st.groupName}
                        </td>

                        <td className="p-2.5 text-center font-mono font-bold text-foreground">
                          {record.cpm}{" "}
                          <span className="text-[10px] font-normal text-muted-foreground">зн/м</span>
                        </td>

                        <td className="p-2.5 text-center font-mono">
                          {record.accuracy.toFixed(1)}%
                        </td>

                        <td className="p-2.5 text-right">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${verdict.badgeClass}`}>
                            {verdict.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 span): My Stats & History */}
        <div className="space-y-3">
          {/* My Personal Bests Card */}
          <div className="border rounded-xl bg-card p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Мои личные рекорды
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {myProfile?.totalAttempts || 0} заездов
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-lg border bg-muted/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground">Русский язык (RU)</div>
                  <div className="font-mono font-bold text-foreground">
                    {myProfile?.bestRU?.cpm ? `${myProfile.bestRU.cpm} зн/мин` : "—"}
                  </div>
                </div>
                {myProfile?.bestRU?.accuracy && (
                  <Badge variant="outline" className="text-[10px]">
                    {myProfile.bestRU.accuracy}% точн.
                  </Badge>
                )}
              </div>

              <div className="p-2 rounded-lg border bg-muted/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground">English (EN)</div>
                  <div className="font-mono font-bold text-foreground">
                    {myProfile?.bestEN?.cpm ? `${myProfile.bestEN.cpm} зн/мин` : "—"}
                  </div>
                </div>
                {myProfile?.bestEN?.accuracy && (
                  <Badge variant="outline" className="text-[10px]">
                    {myProfile.bestEN.accuracy}% точн.
                  </Badge>
                )}
              </div>

              <div className="p-2 rounded-lg border bg-muted/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground">Web-Code (HTML/JS)</div>
                  <div className="font-mono font-bold text-foreground">
                    {myProfile?.bestCODE?.cpm ? `${myProfile.bestCODE.cpm} зн/мин` : "—"}
                  </div>
                </div>
                {myProfile?.bestCODE?.accuracy && (
                  <Badge variant="outline" className="text-[10px]">
                    {myProfile.bestCODE.accuracy}% точн.
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Recent Attempts Log */}
          <div className="border rounded-xl bg-card p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-primary" />
                История последних попыток
              </span>
            </div>

            {myRecentAttempts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-[11px]">
                Пока нет завершенных попыток
              </div>
            ) : (
              <div className="space-y-1 max-h-[260px] overflow-y-auto no-scrollbar">
                {myRecentAttempts.map((att) => (
                  <div
                    key={att.id}
                    className="p-1.5 rounded-lg border text-[11px] flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1 font-mono">
                        <span>{att.language}</span>
                        <span className="text-[9px] text-muted-foreground">
                          (
                          {att.mode === "FREE"
                            ? "свободный"
                            : att.mode.startsWith("TIME_")
                            ? `${att.mode.replace("TIME_", "")}с`
                            : `${att.mode.replace("WORDS_", "")} сл.`}
                          )
                        </span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {new Date(att.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-bold text-foreground">{att.cpm} зн/м</span>
                      <span className="text-[10px] text-muted-foreground block">{att.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

