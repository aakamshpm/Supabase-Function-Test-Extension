export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface UserAuth {
  email: string;
  password: string;
}

export interface FunctionTest {
  code: string;
  variables: Record<string, string>;
}

export interface TestResult {
  success: boolean;
  error?: string;
  data?: any;
  executionTime?: number;
}
