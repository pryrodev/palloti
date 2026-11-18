import { z } from "zod";

export const contactFieldsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().min(2).max(160).transform((value) => value.replace(/[\r\n]+/g, " ")),
  message: z.string().trim().min(10).max(3000),
});

export const contactMessageSchema = contactFieldsSchema.extend({
  website: z.string().max(500).optional(),
});

export type ContactField = keyof typeof contactFieldsSchema.shape;
