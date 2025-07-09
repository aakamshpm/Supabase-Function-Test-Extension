// This interface defines the structure of the configuration for the Supabase Function Tester extension.
// It includes the Supabase URL and the anonymous key required for authentication.
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// This interface defines the structure of a user authentication object,
// which includes the user's email and password for logging into the Supabase service.
export interface UserAuth {
  email: string;
  password: string;
}

// This interface defines the structure of a function test, which includes the code to be executed
// and any variables that should be passed to the function during testing.
export interface FunctionTest {
  code: string;
  variables: Record<string, string>;
}

// This interface defines the structure of a test result, which includes whether the test was successful,
// any error message if the test failed, the data returned from the function, and the execution
export interface TestResult {
  success: boolean;
  error?: string;
  data?: any;
  executionTime?: number;
}
