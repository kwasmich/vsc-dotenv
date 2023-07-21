/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, window, workspace } from 'vscode';
import { IDisposable, filterEvent } from './util';
import { posix } from 'path';



export interface ITerminalEnvironmentProvider {
	getEnv(): { [key: string]: string };
}

const REGEXP = /^(?<key>\w[\w\d]*)(?:=)(?<value>.*)$/gm;



export class TerminalEnvironmentManager {
	private readonly disposables: IDisposable[] = [];

	constructor(private readonly context: ExtensionContext) {
		this.disposables.push(
			filterEvent(workspace.onDidChangeConfiguration, e => e.affectsConfiguration('dotenv'))(this.refresh, this)
		);

		context.subscriptions.push(workspace.onDidChangeWorkspaceFolders((e) => {
			this.refresh();
		}));
		context.subscriptions.push(workspace.onDidCreateFiles((e) => {
			const changedFiles = e.files.map((file) => file.path);
			this.checkChangedFiles(changedFiles);
		}));
		context.subscriptions.push(workspace.onDidDeleteFiles((e) => {
			const changedFiles = e.files.map((file) => file.path);
			this.checkChangedFiles(changedFiles);
		}));
		context.subscriptions.push(workspace.onDidRenameFiles((e) => {
			const changedFiles = e.files.reduce((files, file) => [...files, file.newUri.path, file.oldUri.path], [] as string[]);
			this.checkChangedFiles(changedFiles);
		}));
		context.subscriptions.push(workspace.onDidSaveTextDocument((e) => {
			const changedFiles = [e.fileName];
			this.checkChangedFiles(changedFiles);
		}));

		this.refresh();
	}


	private checkChangedFiles(changedFiles: string[]) {
		for (const workspaceFolder of workspace.workspaceFolders ?? []) {
			const folderUri = workspaceFolder.uri;
			const fileUri = folderUri.with({ path: posix.join(folderUri.path, '.env') });

			if (changedFiles.includes(fileUri.path)) {
				this.refresh();
				return;
			}
		}
	}


	private async refresh(): Promise<void> {
		const config = workspace.getConfiguration('dotenv', null);
		this.context.environmentVariableCollection.clear();

		if (!config.get<boolean>('enabled', true)) {
			return;
		}

		if (!workspace.workspaceFolders) {
			window.showInformationMessage('No folder or workspace opened');
		}

		const env: { [key: string]: string } = {};

		for (const workspaceFolder of workspace.workspaceFolders ?? []) {
			const folderUri = workspaceFolder.uri;
			const fileUri = folderUri.with({ path: posix.join(folderUri.path, '.env') });
	
			try {
				const readData = await workspace.fs.readFile(fileUri);
				const readStr = Buffer.from(readData).toString('utf8');

				const matches = readStr.matchAll(REGEXP);

				for (const match of matches) {
					const {key, value} = match.groups ?? {};
					env[key] = value;
				}

				// console.log([...matches]);
			} catch (e) {
				console.error("could not load .env file");
			}
		}

		// console.log(env);

		for (const name of Object.keys(env)) {
			this.context.environmentVariableCollection.replace(name, env[name]);
		}
	}


	dispose(): void {
		this.disposables.forEach((d) => d.dispose());
	}
}
