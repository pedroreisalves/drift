export interface ListPostInputDto {
  limit?: number;
  offset?: number;
}

export interface ListPostOutputDto {
  postId: string;
  clientId: string;
  clientName: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
