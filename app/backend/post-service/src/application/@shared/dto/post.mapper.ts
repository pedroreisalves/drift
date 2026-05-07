import Post from '../../../domain/post/entity/post.aggregate';
import PostDTO from './post.dto';

export default class PostMapper {
  static toDTO(post: Post): PostDTO {
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
