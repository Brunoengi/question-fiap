import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class DeepseekProvider implements IAiProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY')!;
  }

  async *chat(
    messages: { role: string; content: string }[],
    systemPrompt: string,
  ): AsyncIterable<string> {
    const payload = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          continue;
        }
      }
    }
  }
}
