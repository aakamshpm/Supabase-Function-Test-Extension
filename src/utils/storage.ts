import * as vscode from "vscode";
import { SupabaseConfig } from "../types";

export class StorageManager {
  private static context: vscode.ExtensionContext;

  static initialize(context: vscode.ExtensionContext) {
    this.context = context;
    console.log("StorageManager initialized with context");
  }

  static async saveSupabaseConfig(config: SupabaseConfig): Promise<void> {
    if (!this.context) {
      throw new Error(
        "StorageManager not initialized. Call initialize() first."
      );
    }
    await this.context.globalState.update("supabase-config", config);
    console.log("Supabase config saved");
  }

  static getSupabaseConfig(): SupabaseConfig | undefined {
    if (!this.context) {
      throw new Error(
        "StorageManager not initialized. Call initialize() first."
      );
    }
    return this.context.globalState.get<SupabaseConfig>("supabase-config");
  }

  static async saveUserSession(session: any): Promise<void> {
    if (!this.context) {
      throw new Error(
        "StorageManager not initialized. Call initialize() first."
      );
    }
    await this.context.globalState.update("user-session", session);
    console.log("User session saved");
  }

  static getUserSession(): any {
    if (!this.context) {
      throw new Error(
        "StorageManager not initialized. Call initialize() first."
      );
    }
    return this.context.globalState.get("user-session");
  }

  static async clearUserSession(): Promise<void> {
    if (!this.context) {
      throw new Error(
        "StorageManager not initialized. Call initialize() first."
      );
    }
    await this.context.globalState.update("user-session", undefined);
    console.log("User session cleared");
  }
}
