import type Post from '../../../domain/post/entity/post.aggregate';

export function toPostOutputFields(post: Post): {
  postId: string;
  clientId: string;
  clientName: string;
  title: string;
  body: string;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
} {
  return {
    postId: post.id.toString(),
    clientId: post.clientId.toString(),
    clientName: post.clientName,
    title: post.title,
    body: post.body,
    tags: post.tags,
    isFeatured: post.isFeatured,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
