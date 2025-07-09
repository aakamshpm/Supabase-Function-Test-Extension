import * as vscode from "vscode";
import { SupabaseConfig } from "../types";

export class StorageManager {
  private static context: vscode.ExtensionContext;

  static initialize(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static async saveSupabaseConfig(config: SupabaseConfig): Promise<void> {
    await this.context.globalState.update("supabase-config", config);
  }

  static getSupabaseConfig(): SupabaseConfig | undefined {
    return this.context.globalState.get<SupabaseConfig>("supabase-config");
  }

  static async saveUserSession(session: any): Promise<void> {
    await this.context.globalState.update("user-session", session);
  }

  static getUserSession(): any {
    return this.context.globalState.get<any>("user-session");
  }

  static async clearUserSession(): Promise<void> {
    await this.context.globalState.update("user-session", undefined);
  }
}

// This class manages the storage of Supabase configuration and user session data.
// It uses the VS Code extension context to store and retrieve data.
// The configuration includes details like the Supabase URL, API key, and other settings.
// The user session data can include authentication tokens or other session-related information.
// The methods provided allow for saving, retrieving, and clearing this data.
// The `initialize` method must be called with the extension context before using other methods.
// This ensures that the storage manager is properly set up to interact with the VS Code global state.
// The `saveSupabaseConfig` method saves the Supabase configuration to the global state.
// The `getSupabaseConfig` method retrieves the saved configuration.
// The `saveUserSession` method saves the user session data to the global state.
// The `getUserSession` method retrieves the saved user session data.
// The `clearUserSession` method clears the user session data from the global state.
