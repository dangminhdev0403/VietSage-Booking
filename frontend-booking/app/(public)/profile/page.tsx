import { redirect } from 'next/navigation';

/**
 * Travelers do not maintain public accounts.
 * Redirect legacy /profile directly to /booking/lookup.
 */
export default function ProfileRedirectPage() {
  redirect('/booking/lookup');
}
