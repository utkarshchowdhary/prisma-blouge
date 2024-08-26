import { GraphQLError } from 'graphql';
import getCurrentUserId from '../utils/getCurrentUserId';

const Subscription = {
    post: {
        subscribe(_parent, _args, { pubSub }) {
            return pubSub.subscribe('post');
        }
    },
    comment: {
        async subscribe(_parent, { postId }, { prisma, pubSub }) {
            const post = await prisma.post.findUnique({
                where: {
                    id: postId
                }
            });

            if (!post) throw new GraphQLError('Post not found.');

            return pubSub.subscribe(`comment ${postId}`);
        }
    },
    myPost: {
        async subscribe(_parent, _args, { request, prisma, pubSub }) {
            const userId = getCurrentUserId(request);

            const user = await prisma.user.findUnique({
                where: {
                    id: userId
                }
            });

            if (!user) throw new GraphQLError('User not found.');

            return pubSub.subscribe(`post ${userId}`);
        }
    }
};

export { Subscription as default };
