"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Edit2,
  Trash2,
  UserCheck,
  Phone,
  MapPin,
  FileText,
  ChevronRight,
} from "lucide-react";
import { CompanyPartner, StudentPracticeRecord } from "../types";
import { AnimatedCounter } from "../animated-counter";

interface CompaniesTabProps {
  filteredCompanies: CompanyPartner[];
  students: StudentPracticeRecord[];
  onOpenEditCompany: (company: CompanyPartner) => void;
  onDeleteCompany: (companyId: string) => void;
  onShowStudentsForCompany: (companyId: string) => void;
}

export function CompaniesTab({
  filteredCompanies,
  students,
  onOpenEditCompany,
  onDeleteCompany,
  onShowStudentsForCompany,
}: CompaniesTabProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCompanies.map((comp) => {
          const freeQuotas = comp.quotaTotal - comp.quotaUsed;
          const assignedStudents = students.filter((s) => s.companyId === comp.id);

          return (
            <div
              key={comp.id}
              className="bg-card border rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{comp.name}</span>
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium bg-primary/10 text-primary border-primary/30 mt-1"
                    >
                      {comp.industry}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEditCompany(comp)}
                      className="p-1 hover:text-primary text-muted-foreground rounded hover:bg-muted"
                      title="Редактировать компанию"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCompany(comp.id)}
                      className="p-1 hover:text-destructive text-muted-foreground rounded hover:bg-muted"
                      title="Удалить компанию"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  Специальности: <span className="font-medium text-foreground">{comp.specialtyFocus}</span>
                </div>

                {/* Quota Progress */}
                <div className="p-2 rounded-lg bg-muted/40 border space-y-1 text-[11px]">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-muted-foreground">Квота практикантов:</span>
                    <span className="text-foreground">
                      <AnimatedCounter value={comp.quotaUsed} /> из{" "}
                      <AnimatedCounter value={comp.quotaTotal} /> мест (
                      {freeQuotas > 0 ? `${freeQuotas} свободно` : "заполнено"})
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, (comp.quotaUsed / comp.quotaTotal) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Contacts & Contract */}
                <div className="space-y-1 text-[11px] text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{comp.contactPerson}</span> ({comp.position})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{comp.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{comp.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-mono mt-1">
                    <FileText className="h-3 w-3 text-primary shrink-0" />
                    <span>Договор {comp.contractNumber} (до {comp.contractValidUntil})</span>
                  </div>
                </div>

                {comp.notes && (
                  <div className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded border border-primary/20">
                    {comp.notes}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-mono">
                  Студентов: {assignedStudents.length}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onShowStudentsForCompany(comp.id)}
                  className="h-6 px-2 text-[10px] font-medium"
                >
                  <span>Показать список ({assignedStudents.length})</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {filteredCompanies.length === 0 && (
          <div className="bg-card border rounded-xl p-8 text-center space-y-2 col-span-full">
            <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
            <h4 className="font-semibold text-sm text-foreground">Базы практик не найдены</h4>
            <p className="text-xs text-muted-foreground">
              Добавьте новую организацию-партнёра кнопкой «Добавить базу практики»
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
