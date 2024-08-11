import getCurrentUserId from '../utils/getCurrentUserId';

const Query = {
  async users(parent, args, { prisma }) {
    const limit = {};

    if (args.limit) {
      for (const prop in args.limit) {
        limit[prop] = { equals: args.limit[prop], mode: 'insensitive' };
      }
    }

    const where = args.filter
      ? {
          name: { contains: args.filter, mode: 'insensitive' },
          ...limit,
        }
      : { ...limit };

    const count = await prisma.user.count({ where });

    let startIndex, endIndex;
    const pagination = {};
    if (args.page && args.take) {
      startIndex = (args.page - 1) * args.take;
      endIndex = args.page * args.take;

      if (endIndex < count) {
        pagination.next = {
          page: args.page + 1,
          take: args.take,
        };
      }

      if (startIndex > 0) {
        pagination.prev = {
          page: args.page - 1,
          take: args.take,
        };
      }
    }

    const opArgs = {
      where,
      skip: startIndex,
      take: args.take,
      orderBy: args.orderBy,
    };

    const results = await prisma.user.findMany({
      ...opArgs,
      include: {
        posts: true,
        comments: true,
      },
    });

    return {
      count,
      ...(Object.keys(pagination).length !== 0 && { pagination }),
      results,
    };
  },
  async posts(parent, args, { prisma }) {
    const limit = {};

    if (args.limit) {
      for (const prop in args.limit) {
        limit[prop] = { equals: args.limit[prop], mode: 'insensitive' };
      }
    }

    const where = args.filter
      ? {
          published: true,
          OR: [
            { title: { contains: args.filter, mode: 'insensitive' } },
            { body: { contains: args.filter, mode: 'insensitive' } },
          ],
          ...limit,
        }
      : { published: true, ...limit };

    const count = await prisma.post.count({ where });

    let startIndex, endIndex;
    const pagination = {};
    if (args.page && args.take) {
      startIndex = (args.page - 1) * args.take;
      endIndex = args.page * args.take;

      if (endIndex < count) {
        pagination.next = {
          page: args.page + 1,
          take: args.take,
        };
      }

      if (startIndex > 0) {
        pagination.prev = {
          page: args.page - 1,
          take: args.take,
        };
      }
    }

    const opArgs = {
      where,
      skip: startIndex,
      take: args.take,
      orderBy: args.orderBy,
    };

    const results = await prisma.post.findMany({
      ...opArgs,
      include: {
        author: true,
        comments: true,
      },
    });

    return {
      count,
      ...(Object.keys(pagination).length !== 0 && { pagination }),
      results,
    };
  },
  async myPosts(parent, args, { prisma, request }) {
    const userId = await getCurrentUserId(request);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const limit = {};

    if (args.limit) {
      for (const prop in args.limit) {
        limit[prop] = {
          equals: args.limit[prop],
          ...(typeof args.limit[prop] !== 'boolean' && { mode: 'insensitive' }),
        };
      }
    }

    const where = args.filter
      ? {
          author: {
            id: userId,
          },
          OR: [
            { title: { contains: args.filter, mode: 'insensitive' } },
            { body: { contains: args.filter, mode: 'insensitive' } },
          ],
          ...limit,
        }
      : {
          author: {
            id: userId,
          },
          ...limit,
        };

    const count = await prisma.post.count({ where });

    let startIndex, endIndex;
    const pagination = {};
    if (args.page && args.take) {
      startIndex = (args.page - 1) * args.take;
      endIndex = args.page * args.take;

      if (endIndex < count) {
        pagination.next = {
          page: args.page + 1,
          take: args.take,
        };
      }

      if (startIndex > 0) {
        pagination.prev = {
          page: args.page - 1,
          take: args.take,
        };
      }
    }

    const opArgs = {
      where,
      skip: startIndex,
      take: args.take,
      orderBy: args.orderBy,
    };

    const results = await prisma.post.findMany({
      ...opArgs,
      include: {
        author: true,
        comments: true,
      },
    });

    return {
      count,
      ...(Object.keys(pagination).length !== 0 && { pagination }),
      results,
    };
  },
  async comments(parent, args, { prisma }) {
    const limit = {};

    if (args.limit) {
      for (const prop in args.limit) {
        limit[prop] = { equals: args.limit[prop], mode: 'insensitive' };
      }
    }

    const where = args.filter
      ? {
          text: { contains: args.filter, mode: 'insensitive' },
          ...limit,
        }
      : { ...limit };

    const count = await prisma.comment.count({ where });

    let startIndex, endIndex;
    const pagination = {};
    if (args.page && args.take) {
      startIndex = (args.page - 1) * args.take;
      endIndex = args.page * args.take;

      if (endIndex < count) {
        pagination.next = {
          page: args.page + 1,
          take: args.take,
        };
      }

      if (startIndex > 0) {
        pagination.prev = {
          page: args.page - 1,
          take: args.take,
        };
      }
    }

    const opArgs = {
      where,
      skip: startIndex,
      take: args.take,
      orderBy: args.orderBy,
    };

    const results = await prisma.comment.findMany({
      ...opArgs,
      include: {
        author: true,
        post: true,
      },
    });

    return {
      count,
      ...(Object.keys(pagination).length !== 0 && { pagination }),
      results,
    };
  },
  async post(parent, args, { prisma, request }) {
    const userId = await getCurrentUserId(request, false);

    const opArgs = {
      where: {
        id: args.id,
        OR: [{ published: true }],
      },
    };

    if (userId) {
      opArgs.where.OR.push({ author: { id: userId } });
    }

    const post = await prisma.post.findFirst({
      ...opArgs,
      include: {
        author: true,
        comments: true,
      },
    });

    if (!post) {
      throw new Error('Unable to fetch post');
    }

    return post;
  },
  async me(parent, args, { prisma, request }) {
    const userId = await getCurrentUserId(request);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: { posts: true, comments: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
};

export { Query as default };
