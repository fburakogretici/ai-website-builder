import { redirect } from 'next/navigation';

const DEFAULT_LOCALE = 'tr';

export default function DashboardRedirect() {
  redirect(`/${DEFAULT_LOCALE}/dashboard`);
}
