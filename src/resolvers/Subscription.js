import getCurrentUserId from '../utils/getCurrentUserId';

const Subscription = {
  post: {
    subscribe(parent, args, { pubsub }) {
      return pubsub.asyncIterator('post');
    },
  },
  comment: {
    async subscribe(parent, { postId }, { prisma, pubsub }) {
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      return pubsub.asyncIterator(`comment ${postId}`);
    },
  },
  myPost: {
    async subscribe(parent, args, { prisma, pubsub, request }) {
      const userId = await getCurrentUserId(request);

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return pubsub.asyncIterator(`post ${userId}`);
    },
  },
};

export { Subscription as default };
