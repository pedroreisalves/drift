export interface SearchPostsInputDto {
  q: string;
  clientId: string;
  limit?: number;
  offset?: number;
}

export interface SearchPostsOutputDto {
  postId: string;
  title: string;
  bodyPreview: string;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  isTaggingInProgress: boolean;
}
