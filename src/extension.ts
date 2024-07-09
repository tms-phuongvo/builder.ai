import * as vscode from "vscode";
import * as fs from "fs";
import * as showdown from "showdown";
import * as path from "path";

import { ExplorerItem, GptExplorerProvider } from "./fileExplorer";
import { ChatGPT } from "./gpt";
import { error } from "console";
import { COMMAND } from "./constant";
import { getGPTKey, setGPTKey } from "./utils";

let requirement: string | undefined;
const converter = new showdown.Converter();

export function activate(context: vscode.ExtensionContext) {
  const provider = new GptExplorerProvider(
    vscode.workspace.workspaceFolders?.at(0)?.uri.fsPath || "",
    context
  );
  vscode.window.registerTreeDataProvider("builderAIExplorer", provider);
  vscode.commands.registerCommand(COMMAND.clear, () => {
    provider.clearAll();
    provider.refresh();
  });

  vscode.commands.registerCommand(COMMAND.gptKey, async () => {
    const gptKey = await vscode.window.showInputBox({
      placeHolder: "Enter the GPT API Key",
      password: true,
      value: getGPTKey(context)
    });

    if (gptKey) {
      setGPTKey(context, gptKey);
      vscode.window.showInformationMessage(`GPT API Key stored successfully!`);
    }
  });

  vscode.commands.registerCommand(
    COMMAND.selectFile,
    async (node: ExplorerItem) => {
      const {
        isFile,
        resourceUri: { fsPath }
      } = node;
      if (isFile) {
        if (provider.selectedFiles.has(fsPath)) {
          provider.selectedFiles.delete(fsPath);
          vscode.window.showInformationMessage(`Deselected file: ${fsPath}`);
        } else {
          provider.selectedFiles.add(fsPath);
          vscode.window.showInformationMessage(`Selected file: ${fsPath}`);
        }
        provider.refresh();
      } else {
        vscode.window.showErrorMessage(
          "You can only select files, not folders."
        );
      }
    }
  );

  vscode.commands.registerCommand(COMMAND.requirement, async () => {
    const apiKey = getGPTKey(context);
    if (!apiKey) {
      vscode.window.showErrorMessage(
        "Please input API Key before enter requirement"
      );
    }

    const inputRequirement = await vscode.window.showInputBox({
      placeHolder: "Enter the description for your program"
    });

    if (inputRequirement) {
      requirement = inputRequirement;
      vscode.window.showInformationMessage(
        `Entered requirement: ${requirement}`
      );
      if (provider.selectedFiles.size === 0 || !requirement) {
        vscode.window.showErrorMessage(
          "Please select at least one file and enter a requirement first."
        );
        return;
      }

      const gptOutput = await getGPTResponse(
        context,
        Array.from(provider.selectedFiles),
        requirement
      );
      showOutput(context, gptOutput);
    }
  });

  vscode.commands.registerCommand(
    COMMAND.openFile,
    async (node: ExplorerItem) => {
      vscode.window.showTextDocument(node.resourceUri);
    }
  );
}

async function getGPTResponse(
  context: vscode.ExtensionContext,
  filePaths: string[],
  requirement: string
): Promise<string> {
  try {
    const apiKey = getGPTKey(context);
    const gptAPI = new ChatGPT(apiKey ?? "");
    const implement = await getFileContentImplement(filePaths);
    const data = {
      implement: implement,
      requirement: requirement
    };

    return await gptAPI.requestAPI(data);
  } catch {
    vscode.window.showErrorMessage(error.toString());
    throw error;
  }
}

function showOutput(context: vscode.ExtensionContext, output: string) {
  const panel = vscode.window.createWebviewPanel(
    "builderAIOutput",
    "Builder AI",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      enableForms: true,
      enableCommandUris: true,
      enableFindWidget: true,
      localResourceRoots: [
        vscode.Uri.file(
          path.join(context.extensionPath, "resources", "template")
        )
      ]
    }
  );
  const stylePath = panel.webview.asWebviewUri(
    vscode.Uri.file(
      path.join(context.extensionPath, "resources", "template", "prism.css")
    )
  );
  const scriptPath = panel.webview.asWebviewUri(
    vscode.Uri.file(
      path.join(context.extensionPath, "resources", "template", "prism.js")
    )
  );

  panel.webview.html = getWebviewContent(
    converter.makeHtml(output),
    stylePath,
    scriptPath
  );
}

async function getFileContentImplement(filePaths: string[]) {
  return filePaths
    .map((filePath) => {
      const fileName = path.parse(filePath).base;
      const fileContent = fs.readFileSync(filePath, "utf-8");
      return `
    File: ${fileName}
    \n\n
    ${fileContent}
    \n\n`;
    })
    .join();
}

function getWebviewContent(
  output: string,
  stylePath: vscode.Uri,
  scriptPath: vscode.Uri
): string {
  const templatePath = path.join(
    __filename,
    "..",
    "..",
    "resources",
    "template",
    "index.html"
  );
  return fs
    .readFileSync(templatePath, "utf-8")
    .replace("{{output}}", output)
    .replace("{{stylePath}}", stylePath.toString())
    .replace("{{scriptPath}}", scriptPath.toString());
}

export function deactivate() {}
