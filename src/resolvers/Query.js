import { GraphQLError } from 'graphql';
import {
    containsFilter,
    createEqualsFilter,
    createContainsFilter,
    getPostAccessFilter,
    getPagination
} from '../utils/filter';
import getCurrentUserId from '../utils/getCurrentUserId';

const Query = {
    async users(_parent, args, { prisma }) {
        const criteria = createEqualsFilter(args.criteria);

        // Search is prioritized based on name criteria over the search term
        const where = {
            ...(args.searchTerm && containsFilter('name', args.searchTerm)),
            ...criteria
        };

        const count = await prisma.user.count({ where });

        const { take, startIndex, pagination } = getPagination(count, args.page, args.take);

        const opArgs = {
            where,
            skip: startIndex,
            take,
            orderBy: args.orderBy
        };

        const results = await prisma.user.findMany(opArgs);

        return {
            count,
            ...(Object.keys(pagination).length && { pagination }),
            results
        };
    },
    async posts(_parent, args, { prisma }) {
        const criteria = createEqualsFilter(args.criteria);

        // Search is prioritized based on criteria; fields not included in criteria are searched using the search term if provided
        const where = {
            published: true,
            ...createContainsFilter(criteria, args.searchTerm, ['title', 'body']),
            ...criteria
        };

        const count = await prisma.post.count({ where });

        const { take, startIndex, pagination } = getPagination(count, args.page, args.take);

        const opArgs = {
            where,
            skip: startIndex,
            take,
            orderBy: args.orderBy
        };

        const results = await prisma.post.findMany(opArgs);

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

        // Search is prioritized based on criteria; searchable fields not included in criteria are searched using the search term if provided
        const where = {
            author: { id: userId },
            ...createContainsFilter(criteria, args.searchTerm, ['title', 'body']),
            ...criteria
        };

        const count = await prisma.post.count({ where });

        const { take, startIndex, pagination } = getPagination(count, args.page, args.take);

        const opArgs = {
            where,
            skip: startIndex,
            take,
            orderBy: args.orderBy
        };

        const results = await prisma.post.findMany(opArgs);

        return {
            count,
            ...(Object.keys(pagination).length && { pagination }),
            results
        };
    },
    async comments(_parent, args, { prisma }) {
        const criteria = createEqualsFilter(args.criteria);

        // Search is prioritized based on text criteria over the search term
        const where = {
            ...(args.searchTerm && containsFilter('text', args.searchTerm)),
            ...criteria
        };

        const count = await prisma.comment.count({ where });

        const { take, startIndex, pagination } = getPagination(count, args.page, args.take);

        const opArgs = {
            where,
            skip: startIndex,
            take,
            orderBy: args.orderBy
        };

        const results = await prisma.comment.findMany(opArgs);

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

        const post = await prisma.post.findFirst(opArgs);

        if (!post) throw new GraphQLError('Unable to fetch post.');

        return post;
    },
    async me(_parent, _args, { request, prisma }) {
        const userId = getCurrentUserId(request);

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) throw new GraphQLError('User not found.');

        return user;
    }
};

export { Query as default };
