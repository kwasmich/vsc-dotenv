/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as path from 'path';
import { window, workspace } from 'vscode';
import { ITerminalEnvironmentProvider } from './terminal';
import { EmptyDisposable, IDisposable } from './util';
import { posix } from 'path';


const REGEXP = /^(?<key>\w[\w\d]*)(?:=)(?<value>.*)$/gm;


export class EnvLoader implements ITerminalEnvironmentProvider {
	private env: { [key: string]: string };
	private disposable: IDisposable = EmptyDisposable;

	constructor() {
		const rootPath = (workspace.workspaceFolders && (workspace.workspaceFolders.length > 0))
		? workspace.workspaceFolders[0].uri.fsPath : undefined;

		console.log(rootPath);

		this.load();

		this.env = {
			ENV_EDITOR: `"${path.join(__dirname, 'git-editor-empty.sh')}"`,
			VSCODE_ENV_EDITOR_NODE: process.execPath,
			VSCODE_ENV_EDITOR_EXTRA_ARGS: (process.versions['electron'] && process.versions['microsoft-build']) ? '--ms-enable-electron-run-as-node' : '',
			VSCODE_ENV_EDITOR_MAIN: path.join(__dirname, 'git-editor-main.js')
		};
	}

	getEnv(): { [key: string]: string } {
		return this.env;
		const config = workspace.getConfiguration('env');
		return config.get<boolean>('useEditorAsCommitInput') && config.get<boolean>('terminalGitEditor') ? this.env : {};
	}

	dispose(): void {
		this.disposable.dispose();
	}

	async load() {
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

				console.log([...matches]);
			} catch (e) {
				console.error("could not load .env file", e);
			}
		}

		console.log(env);
	}
}
