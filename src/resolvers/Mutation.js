import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import getCurrentUserId from '../utils/getCurrentUserId';
import generateToken from '../utils/generateToken';
import hashPassword from '../utils/hashPassword';

const Mutation = {
  async createUser(_parent, args, { prisma }) {
    const password = await hashPassword(args.data.password);

    const user = await prisma.user.create({
      data: { ...args.data, password },
      include: { posts: true, comments: true },
    });

    const token = generateToken(user.id);

    return {
      user,
      token,
    };
  },
  async login(_parent, args, { prisma }) {
    const user = await prisma.user.findUnique({
      where: {
        email: args.data.email,
      },
      include: { posts: true, comments: true },
    });

    if (!user || !(await bcrypt.compare(args.data.password, user.password))) {
      throw new GraphQLError('Unable to login');
    }

    const token = generateToken(user.id);

    return {
      user,
      token,
    };
  },
  async deleteUser(_parent, _args, { request, prisma }) {
    const userId = await getCurrentUserId(request);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new GraphQLError('User not found');

    return prisma.user.delete({
      where: { id: userId },
      include: { posts: true, comments: true },
    });
  },
  async updateUser(_parent, args, { request, prisma }) {
    const userId = await getCurrentUserId(request);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new GraphQLError('User not found');

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...args.data,
        ...(args.data.password && {
          password: await hashPassword(args.data.password),
        }),
      },
      include: { posts: true, comments: true },
    });
  },
  async createPost(_parent, args, { request, prisma, pubsub }) {
    const userId = await getCurrentUserId(request);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new GraphQLError('User not found');

    const post = await prisma.post.create({
      data: {
        ...(args.data.published ? { published: args.data.published } : {}),
        title: args.data.title,
        body: args.data.body,
        author: { connect: { id: userId } },
      },
      include: { author: true, comments: true },
    });

    if (post.published) {
      pubsub.publish('post', { post: { mutation: 'CREATED', data: post } });
    }

    pubsub.publish(`post ${userId}`, {
      myPost: { mutation: 'CREATED', data: post },
    });

    return post;
  },
  async deletePost(_parent, args, { request, prisma, pubsub }) {
    const userId = await getCurrentUserId(request);
    let post;

    post = await prisma.post.findFirst({
      where: {
        id: args.id,
        author: {
          id: userId,
        },
      },
    });

    if (!post) throw new GraphQLError('Unable to delete Post');

    post = await prisma.post.delete({
      where: { id: args.id },
      include: { author: true, comments: true },
    });

    if (post.published) {
      pubsub.publish('post', { post: { mutation: 'DELETED', data: post } });
    }

    pubsub.publish(`post ${userId}`, {
      myPost: { mutation: 'DELETED', data: post },
    });

    return post;
  },
  async updatePost(_parent, args, { request, prisma, pubsub }) {
    const userId = await getCurrentUserId(request);
    let post;

    post = await prisma.post.findFirst({
      where: {
        id: args.id,
        author: {
          id: userId,
        },
      },
    });

    if (!post) throw new GraphQLError('Unable to update Post');

    if (post.published && !args.data.published) {
      await prisma.comment.deleteMany({
        where: { post: { id: args.id } },
      });
    }

    post = await prisma.post.update({
      where: { id: args.id },
      data: args.data,
      include: { author: true, comments: true },
    });

    if (post.published) {
      pubsub.publish('post', { post: { mutation: 'UPDATED', data: post } });
    }

    pubsub.publish(`post ${userId}`, {
      myPost: { mutation: 'UPDATED', data: post },
    });

    return post;
  },
  async createComment(_parent, args, { request, prisma, pubsub }) {
    const userId = await getCurrentUserId(request);
    const postId = args.data.post;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new GraphQLError('User not found');

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        published: true,
      },
    });

    if (!post) throw new GraphQLError('Post not found');

    const comment = await prisma.comment.create({
      data: {
        text: args.data.text,
        post: { connect: { id: postId } },
        author: { connect: { id: userId } },
      },
      include: { author: true, post: true },
    });

    pubsub.publish(`comment ${postId}`, {
      comment: {
        mutation: 'CREATED',
        data: comment,
      },
    });

    return comment;
  },
  async deleteComment(_parent, args, { request, prisma, pubsub }) {
    const userId = await getCurrentUserId(request);
    let comment;

    comment = await prisma.comment.findFirst({
      where: {
        id: args.id,
        OR: [{ author: { id: userId } }, { post: { author: { id: userId } } }],
      },
    });

    if (!comment) throw new GraphQLError('Unable to delete comment');

    comment = await prisma.comment.delete({
      where: { id: args.id },
      include: { author: true, post: true },
    });

    pubsub.publish(`comment ${comment.post.id}`, {
      comment: {
        mutation: 'DELETED',
        data: comment,
      },
    });

    return comment;
  },
  async updateComment(_parent, args, { request, prisma, pubsub }) {
    const userId = await getCurrentUserId(request);
    let comment = await prisma.comment.findFirst({
      where: {
        id: args.id,
        author: {
          id: userId,
        },
      },
    });

    if (!comment) throw new GraphQLError('Unable to update comment');

    comment = await prisma.comment.update({
      where: { id: args.id },
      data: args.data,
      include: { author: true, post: true },
    });

    pubsub.publish(`comment ${comment.post.id}`, {
      comment: {
        mutation: 'UPDATED',
        data: comment,
      },
    });

    return comment;
  },
};

export { Mutation as default };
