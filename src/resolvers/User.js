const User = {
    posts(parent, _args, { prisma }) {
        const { id: authorId } = parent;
        return prisma.post.findMany({
            where: {
                published: true,
                author: { id: authorId }
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
