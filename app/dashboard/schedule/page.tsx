import { Metadata } from "next";
import { ScheduleView } from "./_components/schedule-view";

export const metadata: Metadata = {
  title: "Расписание занятий | Лицей LMS",
  description: "Сетка расписания пар и занятий учебных групп лицея",
};

export default function SchedulePage() {
  return <ScheduleView />;
}
