import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  TAVILY_API_KEY: z.string().optional(),
  ALLOW_PRIVATE_HOSTS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

function loadEnv() {
  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
  }

  return parsed.data;
}

export const env = loadEnv();
