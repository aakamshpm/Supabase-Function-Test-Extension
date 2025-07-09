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

  static getSupabaseonfig(): SupabaseConfig | undefined {
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
