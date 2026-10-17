import { redirect } from 'next/navigation';

/**
 * Guest self-service uses booking lookup tokens.
 * Redirect legacy /my-bookings directly to /booking/lookup.
 */
export default function MyBookingsRedirectPage() {
  redirect('/booking/lookup');
}
