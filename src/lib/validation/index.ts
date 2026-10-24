import { z } from "zod";

export const timeString = z
  .string()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM format");

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

export const phoneString = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(40)
  .regex(/^[+()\-\s\d]+$/, "Enter a valid phone number");

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    phone: phoneString.optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(/[A-Za-z]/, "Password must contain a letter")
      .regex(/\d/, "Password must contain a number"),
    confirmPassword: z.string(),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and privacy notice" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain a letter")
      .regex(/\d/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneString.optional().or(z.literal("")),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain a letter")
      .regex(/\d/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export const bookingCreateSchema = z
  .object({
    serviceId: z.string().min(1, "Select a service"),
    facilityId: z.string().optional().nullable(),
    date: dateString,
    startTime: timeString,
    endTime: timeString,
    attendees: z.coerce.number().int().min(1).max(10000),
    organization: z.string().trim().max(200).optional().or(z.literal("")),
    purpose: z.string().trim().max(2000).optional().or(z.literal("")),
    requirements: z.string().trim().max(2000).optional().or(z.literal("")),
    eventType: z.string().trim().max(120).optional().or(z.literal("")),
    preferredContact: z.enum(["email", "phone", "whatsapp"]).default("email"),
    guestName: z.string().trim().max(200).optional().or(z.literal("")),
    guestEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
    guestPhone: phoneString.optional().or(z.literal("")),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: "Please accept the booking terms" }),
    }),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const bookingStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED", "COMPLETED", "PENDING"]),
  reason: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const bookingCancelSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const adminBookingNoteSchema = z.object({
  adminNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: phoneString.optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  serviceId: z.string().optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please describe your enquiry").max(4000),
  honeypot: z.string().max(0).optional().or(z.literal("")),
});

export const enquiryUpdateSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]).optional(),
  assignedToId: z.string().optional().nullable(),
  adminReply: z.string().trim().max(4000).optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Programme registration
// ---------------------------------------------------------------------------

export const programmeRegistrationSchema = z.object({
  programmeId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: phoneString.optional().or(z.literal("")),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Content: services, facilities, team, programmes, projects
// ---------------------------------------------------------------------------

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().min(2).max(80),
  shortDesc: z.string().trim().min(2).max(300),
  description: z.string().trim().min(2).max(8000),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(60).optional().or(z.literal("")),
  basePrice: z.coerce.number().min(0).optional().nullable(),
  priceUnit: z.string().trim().max(60).optional().or(z.literal("")),
  currency: z.string().trim().max(8).default("NGN"),
  requiresApproval: z.coerce.boolean().default(true),
  isVirtual: z.coerce.boolean().default(false),
  operatingStart: z.coerce.number().int().min(0).max(1439),
  operatingEnd: z.coerce.number().int().min(1).max(1440),
  minDuration: z.coerce.number().int().min(15).max(1440),
  slotMinutes: z.coerce.number().int().min(5).max(240),
  cancellationPolicy: z.string().trim().max(2000).optional().or(z.literal("")),
  terms: z.string().trim().max(4000).optional().or(z.literal("")),
  published: z.coerce.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const facilitySchema = z.object({
  serviceId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1).max(100000).optional().nullable(),
  capacityUnit: z.string().trim().max(40).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  hourlyPrice: z.coerce.number().min(0).optional().nullable(),
  published: z.coerce.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const teamMemberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  linkedinUrl: z.string().trim().max(300).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
  published: z.coerce.boolean().default(true),
});

export const programmeSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().min(2).max(8000),
  coverImageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  startDate: z.string().min(1),
  endDate: z.string().optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  format: z.enum(["In-person", "Online", "Hybrid"]).default("In-person"),
  registrationDeadline: z.string().optional().or(z.literal("")),
  registrationOpen: z.coerce.boolean().default(false),
  registrationUrl: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).default("DRAFT"),
});

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().optional().or(z.literal("")),
  summary: z.string().trim().min(2).max(1000),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  focusAreas: z.array(z.string().trim().max(120)).default([]),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(80).default("Impact"),
  status: z.enum(["ONGOING", "COMPLETED"]).default("ONGOING"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
  published: z.coerce.boolean().default(true),
});

export const socialLinkSchema = z.object({
  platform: z.enum(["linkedin", "x", "facebook", "tiktok", "whatsapp"]),
  label: z.string().trim().min(1).max(80),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  published: z.coerce.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const messageSchema = z.object({
  userId: z.string().min(1),
  bookingId: z.string().optional().nullable(),
  subject: z.string().trim().min(2).max(200),
  body: z.string().trim().min(2).max(8000),
});

export const userAdminUpdateSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export const settingsUpdateSchema = z
  .record(z.string(), z.string().max(20000));

export const coreValueSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  displayOrder: z.coerce.number().int().default(0),
});

export const objectiveSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  displayOrder: z.coerce.number().int().default(0),
});

export const keyActivitySchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2000),
  icon: z.string().trim().max(60).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
});
