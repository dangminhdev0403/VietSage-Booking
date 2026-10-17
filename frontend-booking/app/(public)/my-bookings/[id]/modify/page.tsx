import { redirect } from 'next/navigation';

/**
 * Guest self-service uses booking lookup tokens.
 * Redirect legacy /my-bookings/[id]/modify directly to /booking/lookup.
 */
export default function ModifyBookingRedirectPage() {
  redirect('/booking/lookup');
}
