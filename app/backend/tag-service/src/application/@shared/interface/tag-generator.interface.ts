export default interface TagGenerator {
  generateTags: (title: string, body: string) => Promise<string[]>;
}
