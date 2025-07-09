// This is the entry point for the Supabase Function Tester extension.
// It registers a command that opens a webview panel for testing Supabase functions.
// The panel is created using the SupabaseTesterPanel class, which handles the webview logic.
// The extension is activated when the command is executed, and it can be deactivated when no longer needed.
// The extension uses the vscode API to create and manage the webview panel, allowing users to interact with Supabase functions directly from VS Code.
// The webview panel can be opened using the command palette or a keybinding, providing a convenient way to test and debug Supabase functions within the editor.

import * as vscode from "vscode";
import { SupabaseTesterPanel } from "./webview/SupabaseTesterPanel";
import { StorageManager } from "./utils/storage";

export function activate(context: vscode.ExtensionContext) {
  console.log("Supabase Function Tester extension is now active!");

  StorageManager.initialize(context);

  const disposable = vscode.commands.registerCommand(
    "supabase-tester.openPanel",
    () => {
      SupabaseTesterPanel.createOrShow(context.extensionUri, context);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
