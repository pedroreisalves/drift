export interface SearchPostsInputDto {
  q: string;
  clientId: string;
  limit?: number;
  offset?: number;
}
