import * as vscode from "vscode";
import { GPT_BUILDER_AI_KEY, GPT_BUILDER_AI_MODEl } from "./constant";

export function getGPTKey(
  context: vscode.ExtensionContext
): string | undefined {
  const storedKey = context.globalState.get<string>(GPT_BUILDER_AI_KEY);
  return storedKey;
}

export function setGPTKey(context: vscode.ExtensionContext, value: string) {
  context.globalState.update(GPT_BUILDER_AI_KEY, value);
}

export function getGPTModel(
  context: vscode.ExtensionContext
): string | undefined {
  const storedKey = context.globalState.get<string>(GPT_BUILDER_AI_MODEl);
  return storedKey;
}

export function setGPTModel(context: vscode.ExtensionContext, value: string) {
  context.globalState.update(GPT_BUILDER_AI_MODEl, value);
}
