const Post = {
    author(parent, _args, { prisma }) {
        const { authorId } = parent;
        return prisma.user.findUnique({
            where: { id: authorId }
        });
    },
    comments(parent, _args, { prisma }) {
        const { id: postId } = parent;
        return prisma.comment.findMany({
            where: {
                post: { id: postId }
            }
        });
    }
};

export { Post as default };
