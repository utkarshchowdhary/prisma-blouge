import { GraphQLError } from 'graphql';
import getCurrentUserId from '../utils/getCurrentUserId';

const Subscription = {
  post: {
    subscribe(_parent, _args, { pubsub }) {
      return pubsub.asyncIterator('post');
    },
  },
  comment: {
    async subscribe(_parent, { postId }, { prisma, pubsub }) {
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
      });

      if (!post) throw new GraphQLError('Post not found');

      return pubsub.asyncIterator(`comment ${postId}`);
    },
  },
  myPost: {
    async subscribe(_parent, _args, { request, prisma, pubsub }) {
      const userId = await getCurrentUserId(request);

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) throw new GraphQLError('User not found');

      return pubsub.asyncIterator(`post ${userId}`);
    },
  },
};

export { Subscription as default };
