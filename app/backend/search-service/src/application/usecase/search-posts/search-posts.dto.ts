export interface SearchPostsInputDto {
  q: string;
  clientId: string;
  limit?: number;
  offset?: number;
}

export interface SearchPostsOutputDto {
  postId: string;
  title: string;
  body: string;
  tags: string[];
}
