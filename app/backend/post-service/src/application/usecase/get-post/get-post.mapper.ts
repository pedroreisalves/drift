import type Post from '../../../domain/post/entity/post.aggregate';
import type GetPostOutputDto from './get-post.output-dto';

export default class GetPostMapper {
  static toOutputDto(post: Post): GetPostOutputDto {
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
