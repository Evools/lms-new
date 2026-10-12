"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, Building2 } from "lucide-react";
import { AnimatedCounter } from "../animated-counter";

export interface MovementLogItem {
  movementId: string;
  studentId: string;
  studentName: string;
  groupName: string;
  specialty: string;
  date: string;
  type: string;
  fromCompany?: string;
  toCompany: string;
  reason: string;
  mentor?: string;
}

interface MovementsTabProps {
  allMovementsLog: MovementLogItem[];
}

export function MovementsTab({ allMovementsLog }: MovementsTabProps) {
  return (
    <div className="space-y-3">
      <div className="bg-card border rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <History className="h-4 w-4 text-primary" />
              Журнал перемещений и переводов студентов
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Хронологический учёт всех направлений, переводов между организациями и смен видов практики.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Всего записей: <AnimatedCounter value={allMovementsLog.length} />
          </Badge>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground text-[11px]">
                <th className="py-2 px-3 text-left font-semibold">Дата</th>
                <th className="py-2 px-3 text-left font-semibold">Студент / Группа</th>
                <th className="py-2 px-3 text-left font-semibold">Тип перемещения</th>
                <th className="py-2 px-3 text-left font-semibold">Откуда → Куда (База практики)</th>
                <th className="py-2 px-3 text-left font-semibold">Причина / Основание</th>
                <th className="py-2 px-3 text-left font-semibold">Наставник</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allMovementsLog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Записей о перемещениях пока нет.
                  </td>
                </tr>
              ) : (
                allMovementsLog.map((log) => (
                  <tr key={log.movementId} className="hover:bg-muted/10 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {log.date}
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-bold text-foreground">{log.studentName}</div>
                      <div className="text-[10px] text-muted-foreground">{log.groupName} • {log.specialty}</div>
                    </td>

                    <td className="py-2 px-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${log.type === "Перевод на другую базу"
                            ? "bg-muted/80 text-foreground border-border"
                            : "bg-primary/10 text-primary border-primary/30"
                          }`}
                      >
                        {log.type}
                      </Badge>
                    </td>

                    <td className="py-2 px-3">
                      {log.fromCompany ? (
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-muted-foreground line-through flex items-center gap-1">
                            <span>{log.fromCompany}</span>
                          </div>
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                            <span>{log.toCompany}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-primary shrink-0" />
                          <span>{log.toCompany}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3 text-muted-foreground text-[11px] max-w-[260px]">
                      {log.reason}
                    </td>

                    <td className="py-2 px-3 text-foreground font-medium">
                      {log.mentor || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
