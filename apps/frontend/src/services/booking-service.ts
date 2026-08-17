import { request } from './api-client';

export interface BookingTracking {
  id: string;
  status: string;
  customerId: string;
  technicianId?: string;
  serviceAddress: string;
  addressLine2?: string;
  landmark?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  requiresInspection: boolean;
  scheduledAt?: string;
  assignedAt?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
}

export async function getBookingTracking(
  bookingId: string,
): Promise<BookingTracking> {
  return request<BookingTracking>(
    `/api/v1/bookings/${encodeURIComponent(bookingId)}/tracking`,
  );
}
