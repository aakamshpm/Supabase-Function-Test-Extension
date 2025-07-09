import { SupabaseConfig, UserAuth, TestResult } from "../types";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class SupabaseManager {
  private client: SupabaseClient | null = null;

  initialize(config: SupabaseConfig): void {
    this.client = createClient(config.url, config.anonKey);
  }

  async signIn(auth: UserAuth): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: "Supabase client is not initialized." };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: auth.email,
        password: auth.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async signOut(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
  }

  async executeFunction(
    code: string,
    variables: Record<string, string>
  ): Promise<TestResult> {
    if (!this.client) {
      return { success: false, error: "Supabase client is not initialized." };
    }

    try {
      const startTime = Date.now();

      // Create a new async function from the provided code
      const AsyncFuncion = Object.getPrototypeOf(
        async function () {}
      ).constructor;
      const func = new AsyncFuncion("supabase", "variables", code);

      // Exectue the function with the Supabase client and variables
      const result = await func(this.client, variables);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        executionTime: executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }
}

// The SupabaseManager class manages the connection to the Supabase service.
// It initializes the client with the provided configuration, handles user authentication, and allows execution of functions with the given code and variables.
// The initialize method sets up the Supabase client using the provided URL and anonymous key.
// The signIn method authenticates a user with their email and password, returning a success status and any error messages.
// The signOut method logs out the current user from the Supabase service.
// The executeFunction method dynamically creates and executes an async function using the provided code, passing the Supabase client and variables as parameters.
// It returns a TestResult object containing the success status, any error messages, the data returned from the function, and the execution time.
// The class also provides methods for signing in and signing out users, ensuring that the client is properly initialized before performing any operations.
// The getClient method returns the current Supabase client instance, allowing access to its methods if needed.
