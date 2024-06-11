import * as vscode from "vscode";
import * as fs from "fs";
import * as showdown from "showdown";
import * as path from "path";

import { ExplorerItem, GptExplorerProvider } from "./fileExplorer";
import { ChatGPT } from "./gpt";
import { error } from "console";
import { COMMAND, Model } from "./constant";
import { getGPTKey, getGPTModel, setGPTKey, setGPTModel } from "./utils";

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
    const options: {
      [key: string]: (context: vscode.ExtensionContext) => Promise<void>;
    } = {
      "GPT Model": showQuickPick,
      "GPT Key": showGPTInputBox
    };
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = Object.keys(options).map((label) => ({ label }));
    quickPick.onDidChangeSelection((selection) => {
      if (selection[0]) {
        options[selection[0].label](context).catch(console.error);
      }
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
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
      try {
        const gptOutput = await getGPTResponse(
          context,
          Array.from(provider.selectedFiles),
          requirement
        );
        showOutput(context, gptOutput);
      } catch (err: any) {
        vscode.window.showErrorMessage(err?.message);
      }
    }
  });

  vscode.commands.registerCommand(
    COMMAND.openFile,
    async (node: ExplorerItem) => {
      vscode.window.showTextDocument(node.resourceUri);
    }
  );
}

export async function showQuickPick(context: vscode.ExtensionContext) {
  const options: vscode.QuickPickItem[] = [
    { label: "GPT 3.5", detail: Model.gpt_3_5 },
    { label: "GPT 4.0", detail: Model.gpt_4_0 }
  ];

  const quickPick = vscode.window.createQuickPick();
  let currentModel = getGPTModel(context);
  quickPick.placeholder = currentModel
    ? currentModel === Model.gpt_3_5
      ? "GPT 3.5"
      : "GPT 4.0"
    : "GPT 3.5";
  quickPick.canSelectMany = false;
  quickPick.items = options;
  quickPick.onDidChangeSelection((selections) => {
    const selection = selections[0];
    if (selection) {
      setGPTModel(context, selection.detail ?? "");
      vscode.window.showInformationMessage(
        `You already selected ${selection.label}!`
      );
      quickPick.dispose();
    } else {
      vscode.window.showInformationMessage(`You don't select GPT Model!`);
    }
  });
  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
}

export async function showGPTInputBox(context: vscode.ExtensionContext) {
  const gptKey = await vscode.window.showInputBox({
    placeHolder: "Enter the GPT API Key",
    password: true,
    value: getGPTKey(context)
  });

  if (gptKey) {
    setGPTKey(context, gptKey);
    vscode.window.showInformationMessage(`GPT API Key stored successfully!`);
  }
}

async function getGPTResponse(
  context: vscode.ExtensionContext,
  filePaths: string[],
  requirement: string
): Promise<string> {
  const apiKey = getGPTKey(context) ?? "";
  const modelName = getGPTModel(context) ?? Model.gpt_3_5;
  const gptAPI = new ChatGPT(apiKey, modelName);
  const implement = await getFileContentImplement(filePaths);
  const data = {
    implement: implement,
    requirement: requirement
  };
  return await gptAPI.requestAPI(data);
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
