import { Metadata } from "next";
import { getSchedulePageDataAction } from "./actions";
import { ScheduleView } from "./_components/schedule-view";

export const metadata: Metadata = {
  title: "Расписание занятий | Лицей LMS",
  description: "Сетка расписания пар и занятий учебных групп лицея",
};

export default async function SchedulePage() {
  const data = await getSchedulePageDataAction();

  return (
    <ScheduleView
      canEdit={data.canEdit}
      initialSchedules={data.schedules}
      initialGroupId={data.defaultGroupId}
      dbSubjectNames={data.dbSubjectNames}
      dbTeacherNames={data.dbTeacherNames}
    />
  );
}
