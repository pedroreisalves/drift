import type Post from '../../../domain/post/entity/post.aggregate';
import type { CreatePostOutputDto } from './create-post.dto';

export function toCreatePostOutputDto(post: Post): CreatePostOutputDto {
  return { postId: post.id.toString() };
}
