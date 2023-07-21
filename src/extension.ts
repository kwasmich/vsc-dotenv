// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TerminalEnvironmentManager } from "./terminal";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const disposables = [];
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "dotEnv" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the commanÍd with registerCommand
	// The commandId parameter must match the command field in package.json
	const command = vscode.commands.registerCommand('dotenv.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from dotEnv!');
	});

	disposables.push(command);

	const terminalEnvironmentManager = new TerminalEnvironmentManager(context);
	disposables.push(terminalEnvironmentManager);

	context.subscriptions.push(...disposables);
}

// This method is called when your extension is deactivated
export function deactivate() {}
