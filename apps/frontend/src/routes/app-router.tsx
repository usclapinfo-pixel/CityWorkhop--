import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from '../components/protected-route';
import { AdminLayout } from '../layouts/admin-layout';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { ComingSoonPage } from '../pages/coming-soon-page';
import { PendingUsersPage } from '../pages/pending-users-page';
import { UserDetailsPage } from '../pages/user-details-page';
import { KycReviewPage } from '../pages/kyc-review-page';
import { AuditLogsPage } from '../pages/audit-logs-page';
import { CitiesPage } from '../pages/cities-page';
import { StorefrontPage } from '../pages/storefront-page';
import { BookingContinuePage } from '../pages/booking-continue-page';
import { BookingTrackingPage } from '../pages/booking-tracking-page';

export function AppRouter() {
  return <Routes><Route path="/" element={<StorefrontPage />} /><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route path="/booking/continue" element={<BookingContinuePage />} /><Route path="/booking/track/:bookingId" element={<BookingTrackingPage />} /><Route element={<AdminRoute />}><Route path="/admin" element={<AdminLayout />}><Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<DashboardPage />} /><Route path="users" element={<PendingUsersPage />} /><Route path="users/pending" element={<PendingUsersPage />} /><Route path="users/:id/kyc" element={<KycReviewPage />} /><Route path="users/:id" element={<UserDetailsPage />} /><Route path="cities" element={<CitiesPage />} /><Route path="providers" element={<ComingSoonPage title="Providers" />} /><Route path="audit-logs" element={<AuditLogsPage />} /><Route path="settings" element={<ComingSoonPage title="Settings" />} /></Route></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}

