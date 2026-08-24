import { getNotificationsAction } from "./actions";
import { NotificationsView } from "./_components/notifications-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Уведомления | LMS",
  description: "Журнал уведомлений и обновлений",
};

export default async function NotificationsPage() {
  const data = await getNotificationsAction();

  return (
    <NotificationsView
      initialNotifications={data.notifications}
      initialUnreadCount={data.unreadCount}
    />
  );
}
