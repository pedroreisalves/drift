export interface ListPostInputDto {
  limit?: number;
  offset?: number;
  featured?: boolean;
}

export interface ListPostOutputDto {
  postId: string;
  clientHash: string;
  clientName: string;
  title: string;
  bodyPreview: string;
  tags: string[];
  isFeatured: boolean;
  isTaggingInProgress: boolean;
  createdAt: string;
  updatedAt: string;
}
