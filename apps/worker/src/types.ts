export interface Env {
  DB: D1Database;
  RUN_WORKFLOW: Workflow;
  BETTER_AUTH_SECRET: string;
  NVIDIA_API_KEY?: string;
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  TAVILY_API_KEY?: string;
  NVIDIA_BASE_URL?: string;
  GROQ_BASE_URL?: string;
  GEMINI_BASE_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  FRONTEND_URL?: string;
  NODE_ENV?: string;
  ALLOW_PRIVATE_HOSTS?: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: { userId: string };
};

export interface RunParams {
  runId: string;
  userId: string;
  jd: string;
  companyUrl: string;
  companyName: string;
  days: number;
}
