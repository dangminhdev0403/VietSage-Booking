import { redirect } from 'next/navigation';

export default function AdminAllotmentsPage() {
  // Lịch phòng & Giá bán belongs strictly to Hotel Partners (/partner/allotments).
  // Platform admins are redirected to the platform admin center.
  redirect('/admin');
}
