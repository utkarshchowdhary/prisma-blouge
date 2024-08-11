import { GraphQLError } from 'graphql';
import {
    containsFilter,
    createEqualsFilter,
    createContainsFilter,
    getPostAccessFilter
} from '../utils/filter';
import getCurrentUserId from '../utils/getCurrentUserId';

const Query = {
    async users(_parent, args, { prisma }) {
        const criteria = createEqualsFilter(args.criteria);

        const where = {
            ...(args.searchTerm && containsFilter('name', args.searchTerm)),
            ...criteria
        };

        const count = await prisma.user.count({ where });

        let startIndex, endIndex;
        const pagination = {};

        if (args.page && args.take) {
            startIndex = (args.page - 1) * args.take;
            endIndex = args.page * args.take;

            if (endIndex < count) {
                pagination.next = {
                    page: args.page + 1,
                    take: args.take
                };
            }

            if (startIndex > 0) {
                pagination.prev = {
                    page: args.page - 1,
                    take: args.take
                };
            }
        }

        const opArgs = {
            where,
            skip: startIndex,
            take: args.take,
            orderBy: args.orderBy
        };

        const results = await prisma.user.findMany({
            ...opArgs,
            include: {
                posts: true,
                comments: true
            }
        });

        return {
            count,
            ...(Object.keys(pagination).length && { pagination }),
            results
        };
    },
    async posts(_parent, args, { prisma }) {
        const criteria = createEqualsFilter(args.criteria);

        const where = {
            published: true,
            ...createContainsFilter(criteria, args.searchTerm, ['title', 'body']),
            ...criteria
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
                    take: args.take
                };
            }

            if (startIndex > 0) {
                pagination.prev = {
                    page: args.page - 1,
                    take: args.take
                };
            }
        }

        const opArgs = {
            where,
            skip: startIndex,
            take: args.take,
            orderBy: args.orderBy
        };

        const results = await prisma.post.findMany({
            ...opArgs,
            include: {
                author: true,
                comments: true
            }
        });

        return {
            count,
            ...(Object.keys(pagination).length && { pagination }),
            results
        };
    },
    async myPosts(_parent, args, { request, prisma }) {
        const userId = getCurrentUserId(request);

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) throw new GraphQLError('User not found.');

        const criteria = createEqualsFilter(args.criteria);

        const where = {
            author: { id: userId },
            ...createContainsFilter(criteria, args.searchTerm, ['title', 'body']),
            ...criteria
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
                    take: args.take
                };
            }

            if (startIndex > 0) {
                pagination.prev = {
                    page: args.page - 1,
                    take: args.take
                };
            }
        }

        const opArgs = {
            where,
            skip: startIndex,
            take: args.take,
            orderBy: args.orderBy
        };

        const results = await prisma.post.findMany({
            ...opArgs,
            include: {
                author: true,
                comments: true
            }
        });

        return {
            count,
            ...(Object.keys(pagination).length && { pagination }),
            results
        };
    },
    async comments(_parent, args, { prisma }) {
        const criteria = createEqualsFilter(args.criteria);

        const where = {
            ...(args.searchTerm && containsFilter('text', args.searchTerm)),
            ...criteria
        };

        const count = await prisma.comment.count({ where });

        let startIndex, endIndex;
        const pagination = {};

        if (args.page && args.take) {
            startIndex = (args.page - 1) * args.take;
            endIndex = args.page * args.take;

            if (endIndex < count) {
                pagination.next = {
                    page: args.page + 1,
                    take: args.take
                };
            }

            if (startIndex > 0) {
                pagination.prev = {
                    page: args.page - 1,
                    take: args.take
                };
            }
        }

        const opArgs = {
            where,
            skip: startIndex,
            take: args.take,
            orderBy: args.orderBy
        };

        const results = await prisma.comment.findMany({
            ...opArgs,
            include: {
                author: true,
                post: true
            }
        });

        return {
            count,
            ...(Object.keys(pagination).length && { pagination }),
            results
        };
    },
    async post(_parent, args, { request, prisma }) {
        const userId = getCurrentUserId(request, false);

        const opArgs = {
            where: getPostAccessFilter(args.id, userId)
        };

        const post = await prisma.post.findFirst({
            ...opArgs,
            include: {
                author: true,
                comments: true
            }
        });

        if (!post) throw new GraphQLError('Unable to fetch post.');

        return post;
    },
    async me(_parent, _args, { request, prisma }) {
        const userId = getCurrentUserId(request);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { posts: true, comments: true }
        });

        if (!user) throw new GraphQLError('User not found.');

        return user;
    }
};

export { Query as default };
