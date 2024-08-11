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
