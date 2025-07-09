import * as vscode from "vscode";
import { SupabaseManager } from "../utils/supabase";
import { StorageManager } from "../utils/storage";
import { SupabaseConfig, UserAuth, TestResult } from "../types";

export class SupabaseTesterPanel {
  public static currentPanel: SupabaseTesterPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private supabaseManager: SupabaseManager;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (SupabaseTesterPanel.currentPanel) {
      SupabaseTesterPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "supabaseTester",
      "Supabase Function Tester",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    );

    SupabaseTesterPanel.currentPanel = new SupabaseTesterPanel(
      panel,
      extensionUri
    );
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.supabaseManager = new SupabaseManager();

    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        await this._handleMessage(message);
      },
      null,
      this._disposables
    );
  }

  private async _handleMessage(message: any) {
    switch (message.command) {
      case "saveConfig":
        await this._saveConfig(message.config);
        break;
      case "signIn":
        await this._signIn(message.auth);
        break;
      case "signOut":
        await this._signOut();
        break;
      case "executeFunction":
        await this._executeFunction(message.code, message.variables);
        break;
      case "loadConfig":
        await this._loadConfig();
        break;
    }
  }

  private async _saveConfig(config: SupabaseConfig) {
    await StorageManager.saveSupabaseConfig(config);
    this.supabaseManager.initialize(config);
    this._panel.webview.postMessage({
      command: "configSaved",
      success: true,
    });
  }

  private async _signIn(auth: UserAuth) {
    const result = await this.supabaseManager.signIn(auth);
    this._panel.webview.postMessage({
      command: "signInResult",
      result,
    });
  }

  private async _signOut() {
    await this.supabaseManager.signOut();
    await StorageManager.clearUserSession();
    this._panel.webview.postMessage({
      command: "signOutResult",
      success: true,
    });
  }

  private async _executeFunction(code: string, variables: Record<string, any>) {
    const result = await this.supabaseManager.executeFunction(code, variables);
    this._panel.webview.postMessage({
      command: "functionResult",
      result,
    });
  }

  private async _loadConfig() {
    const config = StorageManager.getSupabaseConfig();
    if (config) {
      this.supabaseManager.initialize(config);
    }
    this._panel.webview.postMessage({
      command: "configLoaded",
      config,
    });
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supabase Function Tester</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
        }
        .section h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
        }
        .input-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"], input[type="password"], input[type="email"], textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
        }
        textarea {
            min-height: 100px;
            font-family: var(--vscode-editor-font-family);
            resize: vertical;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 10px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 3px;
        }
        .success {
            background-color: var(--vscode-testing-iconPassed);
            color: white;
        }
        .error {
            background-color: var(--vscode-testing-iconFailed);
            color: white;
        }
        .result {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 15px;
            border-radius: 3px;
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <h1>Supabase Function Tester</h1>
    
    <div class="section">
        <h3>🔧 Configuration</h3>
        <div class="input-group">
            <label for="supabaseUrl">Supabase URL:</label>
            <input type="text" id="supabaseUrl" placeholder="https://your-project.supabase.co">
        </div>
        <div class="input-group">
            <label for="anonKey">Anon Key:</label>
            <input type="password" id="anonKey" placeholder="Your anon key">
        </div>
        <button onclick="saveConfig()">Save Configuration</button>
        <div id="configStatus"></div>
    </div>

    <div class="section">
        <h3>🔐 Authentication</h3>
        <div class="input-group">
            <label for="email">Email:</label>
            <input type="email" id="email" placeholder="test@example.com">
        </div>
        <div class="input-group">
            <label for="password">Password:</label>
            <input type="password" id="password" placeholder="Your password">
        </div>
        <button onclick="signIn()">Sign In</button>
        <button onclick="signOut()">Sign Out</button>
        <div id="authStatus"></div>
    </div>

    <div class="section">
        <h3>⚡ Function Testing</h3>
        <div class="input-group">
            <label for="functionCode">Function Code:</label>
            <textarea id="functionCode" placeholder="// Example:
// const { data, error } = await supabase
//   .from('users')
//   .select('*')
//   .eq('id', variables.userId);
// 
// if (error) throw error;
// return data;"></textarea>
        </div>
        <div class="input-group">
            <label for="variables">Variables (JSON):</label>
            <textarea id="variables" placeholder='{"userId": 1, "name": "John Doe"}'></textarea>
        </div>
        <button onclick="executeFunction()">Execute Function</button>
        <div id="executionStatus"></div>
        <div id="result" class="result hidden"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Load configuration on startup
        vscode.postMessage({ command: 'loadConfig' });

        function saveConfig() {
            const config = {
                url: document.getElementById('supabaseUrl').value,
                anonKey: document.getElementById('anonKey').value
            };
            
            if (!config.url || !config.anonKey) {
                showStatus('configStatus', 'Please fill in all fields', 'error');
                return;
            }
            
            vscode.postMessage({ command: 'saveConfig', config });
        }

        function signIn() {
            const auth = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            
            if (!auth.email || !auth.password) {
                showStatus('authStatus', 'Please fill in all fields', 'error');
                return;
            }
            
            vscode.postMessage({ command: 'signIn', auth });
        }

        function signOut() {
            vscode.postMessage({ command: 'signOut' });
        }

        function executeFunction() {
            const code = document.getElementById('functionCode').value;
            const variablesText = document.getElementById('variables').value;
            
            if (!code) {
                showStatus('executionStatus', 'Please enter function code', 'error');
                return;
            }
            
            let variables = {};
            if (variablesText) {
                try {
                    variables = JSON.parse(variablesText);
                } catch (e) {
                    showStatus('executionStatus', 'Invalid JSON in variables', 'error');
                    return;
                }
            }
            
            vscode.postMessage({ command: 'executeFunction', code, variables });
        }

        function showStatus(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = \`<div class="status \${type}">\${message}</div>\`;
        }

        function showResult(result) {
            const resultElement = document.getElementById('result');
            resultElement.classList.remove('hidden');
            resultElement.textContent = JSON.stringify(result, null, 2);
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'configSaved':
                    showStatus('configStatus', 'Configuration saved successfully!', 'success');
                    break;
                case 'configLoaded':
                    if (message.config) {
                        document.getElementById('supabaseUrl').value = message.config.url || '';
                        document.getElementById('anonKey').value = message.config.anonKey || '';
                    }
                    break;
                case 'signInResult':
                    if (message.result.success) {
                        showStatus('authStatus', 'Signed in successfully!', 'success');
                    } else {
                        showStatus('authStatus', \`Sign in failed: \${message.result.error}\`, 'error');
                    }
                    break;
                case 'signOutResult':
                    showStatus('authStatus', 'Signed out successfully!', 'success');
                    break;
                case 'functionResult':
                    if (message.result.success) {
                        showStatus('executionStatus', \`Function executed successfully in \${message.result.executionTime}ms\`, 'success');
                        showResult(message.result.data);
                    } else {
                        showStatus('executionStatus', \`Function failed: \${message.result.error}\`, 'error');
                    }
                    break;
            }
        });
    </script>
</body>
</html>`;
  }

  public dispose() {
    SupabaseTesterPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
