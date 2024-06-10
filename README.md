# Builder AI README

Builder AI is a VS Code extension designed to accelerate your coding process by leveraging GPT technology. It reads the necessary files in your project to assist in writing code for specified tasks as per your requirements.

## Features

- **Intelligent Code Suggestions**: Provides code suggestions by understanding the context of your project files and the specified tasks.
- **Seamless Integration**: Easily integrates with your existing workflow. Select the relevant files and input your requirements to receive tailored code suggestions.
- **Enhanced Productivity**: Save time and enhance productivity with precise and context-aware code completions.

## Requirements

- **OpenGPT Key**: Users need to provide an OpenGPT API key to utilize the features of this extension.

## Usage

1. Open your project in VS Code.
2. Open the "Builder AI Code" view from the activity bar.
3. Select key icon in navigation bar and input GPT Key
3. Select the files relevant to your task:
    - Click at "Select File" in left side a file in the "Builder AI" view .
4. Enter your requirement:
    - Click pencil icon in navigation.
    - Input the description of the task you need assistance with.
5. Generate code suggestions:
    - The extension will read the selected files and provide code suggestions based on your input.
6. View the output:
    - The generated code suggestions will be displayed in a new panel.

## Commands

- `builderAIAssistant.selectFile`: Select a file to be read by the extension.
- `builderAIAssistant.enterRequirement`: Enter the description for your task.
- `builderAIAssistant.showGPTOutput`: View the generated code based on the selected files and requirements.
- `builderAIAssistant.clearAll`: Clear all selected files and reset the extension.
- `builderAIAssistant.gptKey`: Enter and store your OpenGPT API key.

## Changelog

### 0.0.1

- Initial release
