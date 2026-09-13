import { Schema, model, Types, type Document } from "mongoose";

export type RunStatus = "queued" | "running" | "done" | "failed";

export interface RunStepSubdocument {
  name: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  note: string;
}

export interface RunDocument extends Document {
  userId: Types.ObjectId;
  kitId: Types.ObjectId | null;
  status: RunStatus;
  steps: RunStepSubdocument[];
  idempotencyKey: string;
  error: string | null;
}

const RunStepSchema = new Schema<RunStepSubdocument>(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "running", "done", "failed"],
      required: true,
    },
    startedAt: { type: String, required: true },
    finishedAt: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const RunSchema = new Schema<RunDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kitId: { type: Schema.Types.ObjectId, ref: "Kit", default: null },
    status: {
      type: String,
      enum: ["queued", "running", "done", "failed"],
      required: true,
      default: "queued",
    },
    steps: { type: [RunStepSchema], required: true, default: [] },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    error: { type: String, default: null },
  },
  { versionKey: false, timestamps: true }
);

export const RunModel = model<RunDocument>("Run", RunSchema);
