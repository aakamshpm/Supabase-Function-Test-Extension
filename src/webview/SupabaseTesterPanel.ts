import * as vscode from "vscode";
import { SupabaseManager } from "../utils/supabase";
import { StorageManager } from "../utils/storage";
import { SupabaseConfig, UserAuth, TestResult } from "../types";

export class SupabaseTesterPanel {
  public static currentPanel: SupabaseTesterPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _context: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];
  private supabaseManager: SupabaseManager;

  public static createOrShow(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
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
      extensionUri,
      context
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._context = context; // Now properly initialized
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

    // Load saved configuration on startup
    this._loadConfigOnStartup();
  }

  private async _loadConfigOnStartup() {
    try {
      const config = StorageManager.getSupabaseConfig();
      if (config) {
        this.supabaseManager.initialize(config);
        this._panel.webview.postMessage({
          command: "configLoaded",
          config,
        });
      }
    } catch (error) {
      console.error("Error loading config on startup:", error);
    }
  }

  private async _handleMessage(message: any) {
    try {
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
    } catch (error) {
      console.error("Error handling message:", error);
      this._panel.webview.postMessage({
        command: "error",
        error: String(error),
      });
    }
  }

  private async _saveConfig(config: SupabaseConfig) {
    try {
      await StorageManager.saveSupabaseConfig(config);
      this.supabaseManager.initialize(config);
      this._panel.webview.postMessage({
        command: "configSaved",
        success: true,
      });
    } catch (error) {
      console.error("Error saving config:", error);
      this._panel.webview.postMessage({
        command: "configSaved",
        success: false,
        error: String(error),
      });
    }
  }

  private async _signIn(auth: UserAuth) {
    try {
      const result = await this.supabaseManager.signIn(auth);
      if (result.success) {
        // Save session info
        const client = this.supabaseManager.getClient();
        if (client) {
          const {
            data: { session },
          } = await client.auth.getSession();
          if (session) {
            await StorageManager.saveUserSession(session);
          }
        }
      }
      this._panel.webview.postMessage({
        command: "signInResult",
        result,
      });
    } catch (error) {
      console.error("Error signing in:", error);
      this._panel.webview.postMessage({
        command: "signInResult",
        result: { success: false, error: String(error) },
      });
    }
  }

  private async _signOut() {
    try {
      await this.supabaseManager.signOut();
      await StorageManager.clearUserSession();
      this._panel.webview.postMessage({
        command: "signOutResult",
        success: true,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      this._panel.webview.postMessage({
        command: "signOutResult",
        success: false,
        error: String(error),
      });
    }
  }

  private async _executeFunction(code: string, variables: Record<string, any>) {
    try {
      const result = await this.supabaseManager.executeFunction(
        code,
        variables
      );
      this._panel.webview.postMessage({
        command: "functionResult",
        result,
      });
    } catch (error) {
      console.error("Error executing function:", error);
      this._panel.webview.postMessage({
        command: "functionResult",
        result: { success: false, error: String(error) },
      });
    }
  }

  private async _loadConfig() {
    try {
      const config = StorageManager.getSupabaseConfig();
      if (config) {
        this.supabaseManager.initialize(config);
      }
      this._panel.webview.postMessage({
        command: "configLoaded",
        config,
      });
    } catch (error) {
      console.error("Error loading config:", error);
      this._panel.webview.postMessage({
        command: "configLoaded",
        config: null,
        error: String(error),
      });
    }
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
            box-sizing: border-box;
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
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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
            max-height: 400px;
            overflow-y: auto;
        }
        .hidden {
            display: none;
        }
        .loading {
            opacity: 0.7;
            pointer-events: none;
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
        <button onclick="saveConfig()" id="saveConfigBtn">Save Configuration</button>
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
        <button onclick="signIn()" id="signInBtn">Sign In</button>
        <button onclick="signOut()" id="signOutBtn">Sign Out</button>
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
        <button onclick="executeFunction()" id="executeBtn">Execute Function</button>
        <div id="executionStatus"></div>
        <div id="result" class="result hidden"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let isAuthenticated = false;
        let isConfigured = false;

        // Load configuration on startup
        window.addEventListener('load', () => {
            vscode.postMessage({ command: 'loadConfig' });
        });

        function saveConfig() {
            const saveBtn = document.getElementById('saveConfigBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            const config = {
                url: document.getElementById('supabaseUrl').value.trim(),
                anonKey: document.getElementById('anonKey').value.trim()
            };
            
            if (!config.url || !config.anonKey) {
                showStatus('configStatus', 'Please fill in all fields', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Configuration';
                return;
            }
            
            vscode.postMessage({ command: 'saveConfig', config });
        }

        function signIn() {
            const signInBtn = document.getElementById('signInBtn');
            signInBtn.disabled = true;
            signInBtn.textContent = 'Signing in...';
            
            const auth = {
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value
            };
            
            if (!auth.email || !auth.password) {
                showStatus('authStatus', 'Please fill in all fields', 'error');
                signInBtn.disabled = false;
                signInBtn.textContent = 'Sign In';
                return;
            }
            
            if (!isConfigured) {
                showStatus('authStatus', 'Please configure Supabase connection first', 'error');
                signInBtn.disabled = false;
                signInBtn.textContent = 'Sign In';
                return;
            }
            
            vscode.postMessage({ command: 'signIn', auth });
        }

        function signOut() {
            const signOutBtn = document.getElementById('signOutBtn');
            signOutBtn.disabled = true;
            signOutBtn.textContent = 'Signing out...';
            
            vscode.postMessage({ command: 'signOut' });
        }

        function executeFunction() {
            const executeBtn = document.getElementById('executeBtn');
            executeBtn.disabled = true;
            executeBtn.textContent = 'Executing...';
            
            const code = document.getElementById('functionCode').value.trim();
            const variablesText = document.getElementById('variables').value.trim();
            
            if (!code) {
                showStatus('executionStatus', 'Please enter function code', 'error');
                executeBtn.disabled = false;
                executeBtn.textContent = 'Execute Function';
                return;
            }
            
            if (!isConfigured) {
                showStatus('executionStatus', 'Please configure Supabase connection first', 'error');
                executeBtn.disabled = false;
                executeBtn.textContent = 'Execute Function';
                return;
            }
            
            let variables = {};
            if (variablesText) {
                try {
                    variables = JSON.parse(variablesText);
                } catch (e) {
                    showStatus('executionStatus', 'Invalid JSON in variables', 'error');
                    executeBtn.disabled = false;
                    executeBtn.textContent = 'Execute Function';
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

        function resetButtons() {
            document.getElementById('saveConfigBtn').disabled = false;
            document.getElementById('saveConfigBtn').textContent = 'Save Configuration';
            document.getElementById('signInBtn').disabled = false;
            document.getElementById('signInBtn').textContent = 'Sign In';
            document.getElementById('signOutBtn').disabled = false;
            document.getElementById('signOutBtn').textContent = 'Sign Out';
            document.getElementById('executeBtn').disabled = false;
            document.getElementById('executeBtn').textContent = 'Execute Function';
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            resetButtons();
            
            switch (message.command) {
                case 'configSaved':
                    if (message.success) {
                        showStatus('configStatus', 'Configuration saved successfully!', 'success');
                        isConfigured = true;
                    } else {
                        showStatus('configStatus', \`Configuration failed: \${message.error}\`, 'error');
                        isConfigured = false;
                    }
                    break;
                case 'configLoaded':
                    if (message.config) {
                        document.getElementById('supabaseUrl').value = message.config.url || '';
                        document.getElementById('anonKey').value = message.config.anonKey || '';
                        isConfigured = true;
                    } else {
                        isConfigured = false;
                    }
                    break;
                case 'signInResult':
                    if (message.result.success) {
                        showStatus('authStatus', 'Signed in successfully!', 'success');
                        isAuthenticated = true;
                    } else {
                        showStatus('authStatus', \`Sign in failed: \${message.result.error}\`, 'error');
                        isAuthenticated = false;
                    }
                    break;
                case 'signOutResult':
                    if (message.success) {
                        showStatus('authStatus', 'Signed out successfully!', 'success');
                        isAuthenticated = false;
                    } else {
                        showStatus('authStatus', \`Sign out failed: \${message.error}\`, 'error');
                    }
                    break;
                case 'functionResult':
                    if (message.result.success) {
                        showStatus('executionStatus', \`Function executed successfully in \${message.result.executionTime}ms\`, 'success');
                        showResult(message.result.data);
                    } else {
                        showStatus('executionStatus', \`Function failed: \${message.result.error}\`, 'error');
                        document.getElementById('result').classList.add('hidden');
                    }
                    break;
                case 'error':
                    showStatus('executionStatus', \`Extension error: \${message.error}\`, 'error');
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
