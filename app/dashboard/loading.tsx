import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-[55vh] w-full flex flex-col items-center justify-center gap-2.5 animate-in fade-in-50 duration-150 select-none">
      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
      <p className="text-xs font-medium text-muted-foreground">Загрузка данных...</p>
    </div>
  );
}
