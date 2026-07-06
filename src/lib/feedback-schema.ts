import { z } from "zod";
import type {
  FeedbackCategory,
  FeedbackStatus,
  UserFeedbackSubmission,
} from "./types";

export const ALL_FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  "bug",
  "idea",
  "other",
];

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug",
  idea: "Idea",
  other: "Other",
};

export const ALL_FEEDBACK_STATUSES: FeedbackStatus[] = [
  "new",
  "read",
  "archived",
];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "New",
  read: "Read",
  archived: "Archived",
};

const feedbackCategorySchema = z.enum(["bug", "idea", "other"]);
const feedbackStatusSchema = z.enum(["new", "read", "archived"]);

export const feedbackSubmissionSchema = z.object({
  category: feedbackCategorySchema,
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(2000, "Message must be 2000 characters or fewer."),
  contactNote: z
    .string()
    .trim()
    .max(300, "Contact note must be 300 characters or fewer.")
    .optional()
    .transform((value) => value || undefined),
});

export const adminFeedbackUpdateSchema = z
  .object({
    status: feedbackStatusSchema.optional(),
    internalNotes: z
      .string()
      .trim()
      .max(2000, "Internal notes must be 2000 characters or fewer.")
      .optional()
      .transform((value) => (value === "" ? null : value)),
  })
  .refine(
    (value) => value.status !== undefined || value.internalNotes !== undefined,
    { message: "Provide status and/or internal notes to update." }
  );

export function parseFeedbackSubmission(body: unknown): UserFeedbackSubmission {
  return feedbackSubmissionSchema.parse(body);
}

export function parseAdminFeedbackUpdate(body: unknown): {
  status?: FeedbackStatus;
  internalNotes?: string | null;
} {
  return adminFeedbackUpdateSchema.parse(body);
}
