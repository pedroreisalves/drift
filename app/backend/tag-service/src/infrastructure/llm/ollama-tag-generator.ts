import TagGenerationFailedError from '../../application/@shared/error/tag-generation-failed.error';
import type TagGenerator from '../../application/@shared/interface/tag-generator.interface';

export default class OllamaTagGenerator implements TagGenerator {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly timeoutMs: number,
  ) {}

  async generateTags(title: string, body: string): Promise<string[]> {
    const prompt = this.buildPrompt(title, body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.3,
            num_predict: 200,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new TagGenerationFailedError(`Ollama responded with status ${response.status}`);
      }

      const data = (await response.json()) as { response: string };
      return this.parseResponse(data.response);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPrompt(title: string, body: string): string {
    return `
      You are an expert content tagging system.

      Your task is to generate accurate and relevant tags for a blog post based strictly on the provided title and body.

      Instructions:
      - Return ONLY a JSON object with a single key "tags" containing an array of strings
      - The response must be exactly this shape: { "tags": ["tag1", "tag2", "tag3"] }
      - Do not return a raw array
      - Do not include markdown, explanations, comments, or extra text
      - The response must always be valid JSON
      - Generate a maximum of 10 tags
      - Each tag must contain a maximum of 45 characters
      - Every tag must be directly supported by the content
      - Never invent, infer, or hallucinate topics not clearly present in the post

      CORRECT output:
      { "tags": ["postgresql", "indexing", "performance"] }

      INCORRECT output (never do this):
      ["postgresql", "indexing", "performance"]
      { "result": ["postgresql"] }
      { "data": ["postgresql"] }

      Tag formatting rules:
      - lowercase only
      - use only letters, numbers and hyphens
      - concise and semantically precise
      - no duplicate tags

      Tag style rules:
      - Prefer single-word tags whenever possible: "postgresql", "indexing", "performance"
      - Use multi-word tags only when a single word would lose essential meaning: "strength-training", "high-protein-diet"
      - Never use more than 3 words in a tag
      - Avoid generic or vague tags: prefer "postgresql" over "database", "hypertrophy" over "fitness"

      Tag quality rules:
      - Tags should represent the most important topics, themes, entities, concepts, categories, activities, locations, industries, people, technologies, or subjects discussed in the post
      - Avoid redundant or overlapping tags
      - Avoid overly broad tags unless they are central to the article
      - Use the same language as the post
      - Do not force technical tags unless the content is technical

      Tag selection priority:
      1. Main subject or theme
      2. Important concepts or topics
      3. Relevant entities or categories
      4. Specialized terminology
      5. Supporting contextual topics

      Tag count guidance:
      - Short/simple posts: 3-5 tags
      - Medium posts: 5-8 tags
      - Detailed/complex posts: 8-10 tags only when justified by the content

      Title:
      ${title}

      Body:
      ${body}
    `;
  }

  private parseResponse(raw: string): string[] {
    const parsed = JSON.parse(raw) as unknown;

    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'tags' in parsed &&
      Array.isArray(parsed.tags)
    ) {
      const tags = (parsed as { tags: unknown[] }).tags;
      if (!tags.every((tag) => typeof tag === 'string')) {
        throw new TagGenerationFailedError(`Ollama returned non-string tags: ${raw}`);
      }
      return tags;
    }

    throw new TagGenerationFailedError(`Unexpected Ollama response format: ${raw}`);
  }
}
