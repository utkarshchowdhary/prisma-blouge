const User = {
  posts(parent, args, { prisma }) {
    return prisma.post.findMany({
      where: {
        published: true,
        author: {
          id: parent.id,
        },
      },
    });
  },
};

export { User as default };
