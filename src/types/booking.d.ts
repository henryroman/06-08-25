// src/types/booking.d.ts
export interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  appointmentType: string;
  date: string; // expected format: YYYY-MM-DD
  time: string; // expected format: HH:MM or HH:MM:SS (local time)
  duration?: number; // minutes
  price?: string;
  notes?: string;
}

export interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  customerId?: string;
  message: string;
  error?: string;
  simulated?: boolean;
}
