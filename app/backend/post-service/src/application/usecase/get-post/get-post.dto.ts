export interface GetPostInputDto {
  postId: string;
}

export interface GetPostOutputDto {
  postId: string;
  clientId: string;
  clientName: string;
  title: string;
  body: string;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}
