import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to Turkish as default
  redirect('/tr');
}
