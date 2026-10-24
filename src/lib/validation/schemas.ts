import { z } from "zod";

export const statusChangeSchema = z.object({
  status: z.enum(["Approved", "Rejected", "Under Review"]),
  reason: z.string().optional(),
});

export const programmeSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(5),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string(),
  endDate: z.string().optional().or(z.literal("")),
  location: z.string().optional(),
  format: z.enum(["In-person", "Online", "Hybrid"]).optional(),
  registrationDeadline: z.string().optional().or(z.literal("")),
  registrationOpen: z.boolean().optional(),
  registrationUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).optional(),
});

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
  password: z.string().min(8).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  password: z.string().min(8).optional(),
  mustChangePassword: z.boolean().optional(),
});

export const messageSchema = z.object({
  userId: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  bookingId: z.string().optional(),
});

export const enquiryUpdateSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]).optional(),
  adminReply: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
});

export const contentUpdateSchema = z.object({
  items: z.array(z.object({ key: z.string(), value: z.string() })).min(1),
});
