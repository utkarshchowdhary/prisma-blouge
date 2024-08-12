import getCurrentUserId from '../utils/getCurrentUserId';

const User = {
    posts(parent, _args, { request, prisma }) {
        const { id: authorId } = parent;
        const userId = getCurrentUserId(request, false);
        const isMyPost = authorId === userId;

        return prisma.post.findMany({
            where: {
                author: { id: authorId },
                ...(!isMyPost && { published: true })
            }
        });
    },
    comments(parent, _args, { prisma }) {
        const { id: authorId } = parent;

        return prisma.comment.findMany({
            where: {
                author: { id: authorId }
            }
        });
    }
};

export { User as default };
