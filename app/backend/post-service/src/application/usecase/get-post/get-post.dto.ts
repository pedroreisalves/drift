export interface GetPostInputDto {
  postId: string;
}

export interface GetPostOutputDto {
  postId: string;
  clientHash: string;
  clientName: string;
  title: string;
  body: string;
  tags: string[];
  isFeatured: boolean;
  isTaggingInProgress: boolean;
  createdAt: string;
  updatedAt: string;
}
