import type Post from '../../../domain/post/entity/post.aggregate';
import type ListPostOutputDto from './list-post.output-dto';

export default class ListPostMapper {
  static toOutputDto(post: Post): ListPostOutputDto {
    return {
      id: post.id.toString(),
      clientId: post.clientId.toString(),
      clientName: post.clientName,
      title: post.title,
      body: post.body,
      tags: post.tags,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
