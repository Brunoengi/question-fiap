export interface IAiProvider {
  chat(messages: { role: string; content: string }[], systemPrompt: string): AsyncIterable<string>;
}
