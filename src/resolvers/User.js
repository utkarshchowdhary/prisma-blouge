import getCurrentUserId from '../utils/getCurrentUserId';

const User = {
  async email(parent, args, { prisma, request }) {
    const userId = await getCurrentUserId(request, false);

    if (userId && parent.id === userId) {
      return parent.email;
    } else {
      return null;
    }
  },
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
