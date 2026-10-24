import type { BookingStatus } from "@prisma/client";

/** Serialisable service shape passed from server components to the booking form. */
export interface ServiceOption {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDesc: string;
  requiresApproval: boolean;
  isVirtual: boolean;
  minDuration: number;
  slotMinutes: number;
  operatingStart: number;
  operatingEnd: number;
  basePrice: number | null;
  currency: string;
  priceUnit: string | null;
  facilities: { id: string; name: string; capacity: number | null }[];
}

export interface BookedSlot {
  startMinute: number;
  endMinute: number;
}

export interface AvailabilityResponse {
  window: { openMinute: number; closeMinute: number; isClosed: boolean } | null;
  booked: BookedSlot[];
  minDuration: number;
  slotMinutes: number;
  capacity: number | null;
  requiresApproval: boolean;
}

export interface BookingActionState {
  ok: boolean;
  message?: string;
  reference?: string;
  errors?: Record<string, string>;
}

export type StatusFilter = BookingStatus | "ALL";
