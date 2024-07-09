import * as vscode from "vscode";
import { GPT_BUILDER_AI_KEY } from "./constant";

export function getGPTKey(
  context: vscode.ExtensionContext
): string | undefined {
  const storedKey = context.globalState.get<string>(GPT_BUILDER_AI_KEY);
  return storedKey;
}

export function setGPTKey(context: vscode.ExtensionContext, value: string) {
  context.globalState.update(GPT_BUILDER_AI_KEY, value);
}
