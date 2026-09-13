import { Schema, model, Types, type Document } from "mongoose";

export type PracticeConfidence = 1 | 2 | 3;

export interface PracticeDocument extends Document {
  kitId: Types.ObjectId;
  userId: Types.ObjectId;
  cardId: string;
  confidence: PracticeConfidence;
  lastSeenAt: Date;
  timesSeen: number;
}

const PracticeSchema = new Schema<PracticeDocument>(
  {
    kitId: { type: Schema.Types.ObjectId, ref: "Kit", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cardId: { type: String, required: true },
    confidence: { type: Number, enum: [1, 2, 3], required: true },
    lastSeenAt: { type: Date, required: true, default: () => new Date() },
    timesSeen: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

PracticeSchema.index({ kitId: 1, userId: 1, cardId: 1 }, { unique: true });

export const PracticeModel = model<PracticeDocument>("Practice", PracticeSchema);
