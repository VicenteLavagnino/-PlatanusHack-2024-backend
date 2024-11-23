const Anthropic = require('@anthropic-ai/sdk');

class AnthropicService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateText(model) {
    const msg = await this.anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages:[{ role: "user", content: "Hello, Claude" }],
    });

    return msg;
  }
}
module.exports = AnthropicService;