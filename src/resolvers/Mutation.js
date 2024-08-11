import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import getCurrentUserId from '../utils/getCurrentUserId';
import generateToken from '../utils/generateToken';
import hashPassword from '../utils/hashPassword';

const Mutation = {
    async createUser(_parent, args, { prisma }) {
        const { password } = args.data;
        const hash = await hashPassword(password);

        const user = await prisma.user.create({
            data: { ...args.data, password: hash },
            include: { posts: true, comments: true }
        });

        const token = generateToken(user.id);

        return { user, token };
    },
    async login(_parent, args, { prisma }) {
        const { email, password } = args.data;
        const user = await prisma.user.findUnique({
            where: { email },
            include: { posts: true, comments: true }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new GraphQLError('Unable to login');
        }

        const token = generateToken(user.id);

        return { user, token };
    },
    async deleteUser(_parent, _args, { request, prisma }) {
        const userId = getCurrentUserId(request);

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) throw new GraphQLError('User not found');

        return prisma.user.delete({
            where: { id: userId },
            include: { posts: true, comments: true }
        });
    },
    async updateUser(_parent, args, { request, prisma }) {
        const { password } = args.data;
        const userId = getCurrentUserId(request);

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) throw new GraphQLError('User not found');

        return prisma.user.update({
            where: { id: userId },
            data: {
                ...args.data,
                ...(password && { password: await hashPassword(password) })
            },
            include: { posts: true, comments: true }
        });
    },
    async createPost(_parent, args, { request, prisma, pubSub }) {
        const { title, body, published } = args.data;
        const userId = getCurrentUserId(request);

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) throw new GraphQLError('User not found');

        const post = await prisma.post.create({
            data: {
                title,
                body,
                author: { connect: { id: userId } },
                ...(published && { published })
            },
            include: { author: true, comments: true }
        });

        if (published) {
            pubSub.publish('post', { post: { mutation: 'CREATED', data: post } });
        }

        pubSub.publish(`post ${userId}`, {
            myPost: { mutation: 'CREATED', data: post }
        });

        return post;
    },
    async deletePost(_parent, args, { request, prisma, pubSub }) {
        const userId = getCurrentUserId(request);

        let post = await prisma.post.findFirst({
            where: {
                id: args.id,
                author: { id: userId }
            }
        });

        if (!post) throw new GraphQLError('Unable to delete Post');

        post = await prisma.post.delete({
            where: { id: args.id },
            include: { author: true, comments: true }
        });

        if (post.published) {
            pubSub.publish('post', { post: { mutation: 'DELETED', data: post } });
        }

        pubSub.publish(`post ${userId}`, {
            myPost: { mutation: 'DELETED', data: post }
        });

        return post;
    },
    async updatePost(_parent, args, { request, prisma, pubSub }) {
        const { published } = args.data;
        const userId = getCurrentUserId(request);

        let post = await prisma.post.findFirst({
            where: {
                id: args.id,
                author: { id: userId }
            }
        });

        if (!post) throw new GraphQLError('Unable to update Post');

        if (post.published && !published) {
            await prisma.comment.deleteMany({
                where: { post: { id: args.id } }
            });
        }

        post = await prisma.post.update({
            where: { id: args.id },
            data: args.data,
            include: { author: true, comments: true }
        });

        if (published) {
            pubSub.publish('post', { post: { mutation: 'UPDATED', data: post } });
        }

        pubSub.publish(`post ${userId}`, {
            myPost: { mutation: 'UPDATED', data: post }
        });

        return post;
    },
    async createComment(_parent, args, { request, prisma, pubSub }) {
        const { postId, text } = args.data;
        const userId = getCurrentUserId(request);

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) throw new GraphQLError('User not found');

        const post = await prisma.post.findFirst({
            where: {
                id: postId,
                published: true
            }
        });

        if (!post) throw new GraphQLError('Post not found');

        const comment = await prisma.comment.create({
            data: {
                text,
                post: { connect: { id: postId } },
                author: { connect: { id: userId } }
            },
            include: { author: true, post: true }
        });

        pubSub.publish(`comment ${postId}`, {
            comment: {
                mutation: 'CREATED',
                data: comment
            }
        });

        return comment;
    },
    async deleteComment(_parent, args, { request, prisma, pubSub }) {
        const userId = getCurrentUserId(request);

        let comment = await prisma.comment.findFirst({
            where: {
                id: args.id,
                OR: [{ author: { id: userId } }, { post: { author: { id: userId } } }]
            }
        });

        if (!comment) throw new GraphQLError('Unable to delete comment');

        comment = await prisma.comment.delete({
            where: { id: args.id },
            include: { author: true, post: true }
        });

        pubSub.publish(`comment ${comment.post.id}`, {
            comment: {
                mutation: 'DELETED',
                data: comment
            }
        });

        return comment;
    },
    async updateComment(_parent, args, { request, prisma, pubSub }) {
        const userId = getCurrentUserId(request);
        let comment = await prisma.comment.findFirst({
            where: {
                id: args.id,
                author: { id: userId }
            }
        });

        if (!comment) throw new GraphQLError('Unable to update comment');

        comment = await prisma.comment.update({
            where: { id: args.id },
            data: args.data,
            include: { author: true, post: true }
        });

        pubSub.publish(`comment ${comment.post.id}`, {
            comment: {
                mutation: 'UPDATED',
                data: comment
            }
        });

        return comment;
    }
};

export { Mutation as default };
