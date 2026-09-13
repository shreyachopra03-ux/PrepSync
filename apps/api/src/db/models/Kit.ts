import { Schema, model, Types, type Document } from "mongoose";
import type { Kit } from "@prepsync/core";

export interface KitDocument extends Document, Kit {
  userId: Types.ObjectId;
}

const RequirementSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    kind: { type: String, enum: ["technical", "behavioural"], required: true },
    priority: { type: String, enum: ["must", "nice"], required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    requirement_ids: { type: [String], required: true },
    category: { type: String, required: true },
    prompt: { type: String, required: true },
    answer_outline: { type: String, required: true },
    difficulty: { type: Number, enum: [1, 2, 3], required: true },
    origin: { type: String, enum: ["generated", "edited", "manual"], required: true },
    pinned: { type: Boolean, required: true },
    order: { type: Number, required: true },
    rev: { type: Number, required: true },
  },
  { _id: false }
);

const FlashcardSchema = new Schema(
  {
    id: { type: String, required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    requirement_ids: { type: [String], required: true },
    origin: { type: String, enum: ["generated", "edited", "manual"], required: true },
    pinned: { type: Boolean, required: true },
  },
  { _id: false }
);

const ScheduleDaySchema = new Schema(
  {
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    question_ids: { type: [String], required: true },
    minutes: { type: Number, required: true },
  },
  { _id: false }
);

const KitSchema = new Schema<KitDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    version: { type: Number, required: true, default: 1 },
    source: {
      company: { type: String, default: "" },
      company_url: { type: String, required: true },
      role: { type: String, default: "" },
      location: { type: String, default: "" },
      jd_chars: { type: Number, required: true },
      researched_at: { type: String, required: true },
      pages_used: { type: [String], required: true },
    },
    company_brief: {
      summary: { type: String, default: "" },
      what_they_do: { type: String, default: "" },
      sources: { type: [String], required: true },
    },
    role: {
      title: { type: String, default: "" },
      seniority: { type: String, default: "" },
      responsibilities: { type: [String], required: true },
      requirements: { type: [RequirementSchema], required: true },
    },
    questions: { type: [QuestionSchema], required: true },
    flashcards: { type: [FlashcardSchema], required: true },
    schedule: {
      days_available: { type: Number, required: true },
      days: { type: [ScheduleDaySchema], required: true },
    },
    coverage: {
      uncovered_requirement_ids: { type: [String], required: true },
      passes: { type: Number, required: true },
    },
  },
  { versionKey: false, timestamps: true }
);

export const KitModel = model<KitDocument>("Kit", KitSchema);
