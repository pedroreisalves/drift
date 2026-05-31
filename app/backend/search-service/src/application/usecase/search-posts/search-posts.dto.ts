export interface SearchPostsInputDto {
  q: string;
  clientHash?: string;
  limit?: number;
  offset?: number;
}

export interface SearchPostsOutputDto {
  postId: string;
  clientHash: string;
  clientName: string;
  title: string;
  bodyPreview: string;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  isTaggingInProgress: boolean;
}
