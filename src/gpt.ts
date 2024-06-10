import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { error } from "console";
import { getGPTImplement } from "./prompt";

export type Request = {
  implement: string;
  requirement: string;
};

export class ChatGPT {
  openAI: ChatOpenAI;
  // Public
  constructor(
    private readonly apiKey: string,
    modelName: string = "gpt-3.5-turbo"
  ) {
    this.openAI = new ChatOpenAI({
      model: modelName,
      apiKey: this.apiKey,
      streaming: false,
      temperature: 0.5
    });
  }

  async testAPIKey(): Promise<boolean> {
    return true;
  }

  async requestAPI({ implement, requirement }: Request): Promise<string> {
    try {
      console.log("START GPT ");
      let prompt = getGPTImplement(implement, requirement);
      let response = await this.openAI.invoke([
        new HumanMessage({ content: prompt })
      ]);
      return String(response.content);
    } catch {
      throw error;
    } finally {
      console.log("END GPT");
    }
  }
}
