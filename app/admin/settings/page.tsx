import { isAdmin } from '@/lib/auth';
import { Dashboard } from '@/components/dashboard';
export const dynamic='force-dynamic';
export default async function SettingsPage() {return <Dashboard admin={await isAdmin()} view="settings"/>;}
