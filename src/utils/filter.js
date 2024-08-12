export function equalsFilter(key, value) {
    return {
        [key]: { equals: value, ...(typeof value === 'string' && { mode: 'insensitive' }) }
    };
}

export function containsFilter(key, value) {
    return {
        [key]: { contains: value, ...(typeof value === 'string' && { mode: 'insensitive' }) }
    };
}

export function createEqualsFilter(criteria) {
    return Object.entries(criteria || {}).reduce(
        (acc, [key, value]) => ({ ...acc, ...equalsFilter(key, value) }),
        {}
    );
}

export function createContainsFilter(criteria, searchTerm, fields) {
    if (!searchTerm) return;

    if (fields.some(field => criteria[field])) {
        return fields.reduce(
            (acc, field) => ({
                ...acc,
                ...containsFilter(field, searchTerm)
            }),
            {}
        );
    }

    return {
        OR: fields.map(field => containsFilter(field, searchTerm))
    };
}

export function getPostAccessFilter(postId, userId) {
    if (!userId) return { id: postId, published: true };
    return {
        id: postId,
        OR: [{ published: true }, { author: { id: userId } }]
    };
}

export function getPagination(count, page = 1, take = 100) {
    const pageSize = Math.min(take, 100);
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;

    return {
        take: pageSize,
        startIndex,
        endIndex,
        pagination: {
            ...(startIndex > 0 && {
                prev: {
                    page: page - 1,
                    take: Math.min(pageSize, count)
                }
            }),
            ...(endIndex < count && {
                next: {
                    page: page + 1,
                    take: Math.min(pageSize, count - endIndex)
                }
            })
        }
    };
}
