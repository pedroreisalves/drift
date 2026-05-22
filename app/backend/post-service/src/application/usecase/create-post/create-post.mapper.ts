import type Post from '../../../domain/post/entity/post.aggregate';
import type { CreatePostOutputDto } from './create-post.output-dto';

export function toCreatePostOutputDto(post: Post): CreatePostOutputDto {
  return { id: post.id.toString() };
}
