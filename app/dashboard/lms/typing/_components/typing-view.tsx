"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TypingGame } from "./typing-game";
import { TypingAnalytics } from "./typing-analytics";
import { TypingLeaderboard } from "./typing-leaderboard";
import {
  Keyboard,
  Trophy,
  Users,
  Gauge,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface TypingViewProps {
  initialData: {
    currentUserId: string;
    userRole: string;
    isTeacherOrAdmin: boolean;
    activeGroupId: string;
    groups: Array<{ id: string; name: string; studentsCount: number }>;
    leaderboard: {
      topRU: any[];
      topEN: any[];
      topCODE: any[];
    };
    myProfile: any;
    myRecentAttempts: any[];
    groupAnalytics: any;
  };
}

export function TypingView({ initialData }: TypingViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"game" | "leaderboard" | "analytics">(
    initialData.isTeacherOrAdmin ? "analytics" : "game"
  );
  const [activeGroupId, setActiveGroupId] = useState(initialData.activeGroupId);

  useEffect(() => {
    setActiveGroupId(initialData.activeGroupId);
  }, [initialData.activeGroupId]);

  const handleGroupChange = (newGroupId: string) => {
    setActiveGroupId(newGroupId);
    startTransition(() => {
      router.replace(`/dashboard/lms/typing?group=${newGroupId}`);
    });
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Top Header Card */}
      <div className="bg-card border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Keyboard className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              Клавиатурный тренажер и норматив скорости печати
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Интерактивный тренинг слепой печати на русском, английском и веб-коде с мониторингом результатов
            </p>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("game")}
            className={`flex items-center gap-1.5 h-6 px-3 rounded-md font-medium transition-colors ${
              activeTab === "game"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Тренажер</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-1.5 h-6 px-3 rounded-md font-medium transition-colors ${
              activeTab === "leaderboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Рейтинг лицея</span>
          </button>

          {initialData.isTeacherOrAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 h-6 px-3 rounded-md font-medium transition-colors ${
                activeTab === "analytics"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Результаты группы</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Interactive Game */}
      {activeTab === "game" && (
        <TypingGame
          onAttemptSaved={() => {
            router.refresh();
          }}
        />
      )}

      {/* Tab 2: Leaderboard */}
      {activeTab === "leaderboard" && (
        <TypingLeaderboard
          leaderboard={initialData.leaderboard}
          myProfile={initialData.myProfile}
          myRecentAttempts={initialData.myRecentAttempts}
        />
      )}

      {/* Tab 3: Teacher Group Analytics */}
      {activeTab === "analytics" && initialData.isTeacherOrAdmin && (
        <TypingAnalytics
          groups={initialData.groups}
          activeGroupId={activeGroupId}
          onGroupChange={handleGroupChange}
          analytics={initialData.groupAnalytics}
        />
      )}
    </div>
  );
}

