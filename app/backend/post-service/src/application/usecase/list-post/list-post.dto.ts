export interface ListPostInputDto {
  limit?: number;
  offset?: number;
  featured?: boolean;
}

export interface ListPostOutputDto {
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
