"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";
import { CompanyPartner } from "../types";

export interface CompanyFormData {
  name: string;
  industry: string;
  specialtyFocus: string;
  contactPerson: string;
  position: string;
  phone: string;
  email: string;
  address: string;
  contractNumber: string;
  contractValidUntil: string;
  quotaTotal: number;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCompany: CompanyPartner | null;
  companyForm: CompanyFormData;
  setCompanyForm: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  onSaveCompany: () => void;
}

export function CompanyDialog({
  open,
  onOpenChange,
  editingCompany,
  companyForm,
  setCompanyForm,
  onSaveCompany,
}: CompanyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-primary" />
            {editingCompany ? "Редактировать базу практики" : "Добавить базу практики"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Заполните реквизиты предприятия для распределения студентов и учета квот.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Название предприятия / Организации</label>
            <Input
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              placeholder="например, ОсОО «MadDevs», ОАО «Кыргызтелеком»"
              className="h-8 text-xs bg-background"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Отрасль</label>
              <Input
                value={companyForm.industry}
                onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                placeholder="IT, Дизайн, Телеком..."
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Профиль / Специальности</label>
              <Input
                value={companyForm.specialtyFocus}
                onChange={(e) => setCompanyForm({ ...companyForm, specialtyFocus: e.target.value })}
                placeholder="Веб-разработка, Сети..."
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Контактное лицо (Наставник)</label>
              <Input
                value={companyForm.contactPerson}
                onChange={(e) => setCompanyForm({ ...companyForm, contactPerson: e.target.value })}
                placeholder="ФИО наставника"
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Должность</label>
              <Input
                value={companyForm.position}
                onChange={(e) => setCompanyForm({ ...companyForm, position: e.target.value })}
                placeholder="Руководитель отдела"
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Телефон</label>
              <Input
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                placeholder="+996 (555) 00-00-00"
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Email</label>
              <Input
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                placeholder="hr@company.kg"
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground">Юридический адрес</label>
            <Input
              value={companyForm.address}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              placeholder="г. Бишкек, ул. ..."
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Номер договора</label>
              <Input
                value={companyForm.contractNumber}
                onChange={(e) => setCompanyForm({ ...companyForm, contractNumber: e.target.value })}
                placeholder="№ 15/ПР-2026"
                className="h-8 text-xs font-mono bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Действует до</label>
              <Input
                value={companyForm.contractValidUntil}
                onChange={(e) => setCompanyForm({ ...companyForm, contractValidUntil: e.target.value })}
                placeholder="31.12.2027"
                className="h-8 text-xs font-mono bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Квота мест</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={companyForm.quotaTotal}
                onChange={(e) => setCompanyForm({ ...companyForm, quotaTotal: parseInt(e.target.value, 10) || 1 })}
                className="h-8 text-xs bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button size="xs" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="xs" onClick={onSaveCompany} disabled={!companyForm.name.trim()} className="font-medium">
            Сохранить базу
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
