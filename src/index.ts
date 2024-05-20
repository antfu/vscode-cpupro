import type { CustomDocument, CustomReadonlyEditorProvider, ExtensionContext, WebviewPanel } from 'vscode'
import { CustomDocumentOpenContext, Selection, TextEditorRevealType, Uri, window, workspace } from 'vscode'
import { report } from './html/report'

export class ReadonlyCustomDocument implements CustomDocument {
  constructor(
    public readonly uri: Uri,
    public readonly userData: Uint8Array,
  ) {}

  /**
   * @inheritdoc
   */
  public dispose() {
    // no-op
  }
}

class EditorProvider implements CustomReadonlyEditorProvider<ReadonlyCustomDocument> {
  async openCustomDocument(uri: Uri) {
    return new ReadonlyCustomDocument(uri, await workspace.fs.readFile(uri))
  }

  async resolveCustomEditor(document: ReadonlyCustomDocument, webviewPanel: WebviewPanel) {
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      if (message?.command === 'openInEditor') {
        const file = message.filepath
          .replace(/^file:\/\//, '')
        const [_, filepath, line, col] = file.match(/^(.*):(\d+):(\d+)$/) || [file, file]
        const doc = await workspace.openTextDocument(Uri.file(filepath))
        if (!doc)
          return window.showWarningMessage(`File ${filepath} not found`)
        const editor = await window.showTextDocument(doc)
        if (line && col) {
          editor.revealRange(
            doc.lineAt(Number(line) - 1).range,
            TextEditorRevealType.InCenter,
          )
          editor.selection = new Selection(
            Number(line) - 1,
            Number(col),
            Number(line) - 1,
            Number(col),
          )
        }
      }
    })

    webviewPanel.webview.options = { enableScripts: true }
    let html = report
      // TODO: workaround, postMessage does not exists in vscode webview, maybe a PR upstream?
      .replaceAll('.postMessage', '?.postMessage')

    html += `\n<script>
    window.handleOpenInEditor = (el, filepath) => {
      el.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const vscode = acquireVsCodeApi()
        vscode.postMessage({ command: 'openInEditor', filepath })
      })
    }
    discoveryLoader.start(${JSON.stringify({
        type: 'file',
        name: document.uri.fsPath,
        createdAt: Date.now(),
    })})
    discoveryLoader.push(${JSON.stringify(document.userData.toString())})
    discoveryLoader.finish()
    </script>`

    webviewPanel.webview.html = html
  }
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    window.registerCustomEditorProvider(
      'cpupro.editor',
      new EditorProvider(),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      },
    ),
  )
}

export function deactivate() {

}
