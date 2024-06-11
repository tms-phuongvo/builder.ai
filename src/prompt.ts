export function getGPTImplement(implement: string, requirement: string) {
  return `Given this existing implementation:\n
  <implementation>\n
  ${implement}\n
  </implementation>\n\n
  Modify the implementation to satisfy the requirement below:\n
  <requirement>\n
  ${requirement}\n
  </requirement>\n\n
  Some requirements you MUST follow:\n
  - Errors must be logged or displayed to the UI.\n
  - If user requirement is refactor. Please help their refactor following principle DRY, SOLID, Clean Code.
  - If your response mentions a file in the implementation, the file name must follow the framework's convention of the source code or file.\n
  - Only include the modified files in your response.\n\n
  Remember that the source code of each file in your response must be wrapped in a Markdown code block to be well formatted.\n\n
  The implementation provided above contains multiple files, each file has the following format:\n
  File: <Full file path>\n\n
  \`\`\`<proper language>\n
  Source code\n
  \`\`\`\n\n
  Those file paths will be used in the response. Your response must contains multiple parts, each part has the following format as well:\n
  File:<Full file path>\n\n
  \`\`\`<proper language>\n
  Source code\n
  \`\`\`\n\n
  **NOTE**:\n
  Please respond following the above format. DO NOT explain anything outside code`;
}
