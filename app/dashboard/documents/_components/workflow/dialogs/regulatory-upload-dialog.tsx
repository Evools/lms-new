"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ALLOWED_CATEGORIES } from "../../../constants";

interface RegulatoryUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newRegTitle: string;
  setNewRegTitle: (val: string) => void;
  newRegCategory: string;
  setNewRegCategory: (val: string) => void;
  newRegUrl: string;
  setNewRegUrl: (val: string) => void;
  newRegDescription: string;
  setNewRegDescription: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegulatoryUploadDialog({
  isOpen,
  onClose,
  newRegTitle,
  setNewRegTitle,
  newRegCategory,
  setNewRegCategory,
  newRegUrl,
  setNewRegUrl,
  newRegDescription,
  setNewRegDescription,
  isSubmitting,
  onSubmit,
}: RegulatoryUploadDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
        <DialogHeader className="place-items-start text-left gap-1">
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-primary" />
            Загрузить документ в репозиторий
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Добавление официального акта, положения или формы в архив лицея
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-foreground text-xs">
              Название документа *
            </label>
            <Input
              required
              placeholder="Например: Положение о стипендиальном обеспечении"
              value={newRegTitle}
              onChange={(e) => setNewRegTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-foreground text-xs">
              Категория документа *
            </label>
            <Select value={newRegCategory} onValueChange={setNewRegCategory}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-foreground text-xs">
              Ссылка на файл (PDF / DOCX) *
            </label>
            <Input
              required
              placeholder="https://... или /docs/polozhenie.pdf"
              value={newRegUrl}
              onChange={(e) => setNewRegUrl(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-foreground text-xs">
              Краткое описание (необязательно)
            </label>
            <Textarea
              placeholder="Кем утверждено, дата принятия и назначение документа..."
              value={newRegDescription}
              onChange={(e) => setNewRegDescription(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs gap-1.5"
            >
              {isSubmitting ? "Сохранение..." : "Добавить документ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
