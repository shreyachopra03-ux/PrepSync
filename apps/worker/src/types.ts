export interface Env {
  DB: D1Database;
  RUN_WORKFLOW: Workflow;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
  TAVILY_API_KEY?: string;
  GEMINI_BASE_URL?: string;
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
