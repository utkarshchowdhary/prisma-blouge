const Comment = {
    author(parent, _args, { prisma }) {
        const { authorId } = parent;

        return prisma.user.findUnique({
            where: { id: authorId }
        });
    },
    post(parent, _args, { prisma }) {
        const { postId } = parent;

        return prisma.post.findUnique({
            where: { id: postId }
        });
    }
};

export { Comment as default };
