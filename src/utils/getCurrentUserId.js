import jwt from 'jsonwebtoken';

const getCurrentUserId = async (request, authAssign = true) => {
  const header = request.request
    ? request.request.headers.authorization
    : request.connection.context.Authorization;

  if (header) {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, 'my-ultra-secure-and-ultra-long-secret');

    return decoded.userId;
  }

  if (authAssign) {
    throw new Error('Authentication required');
  }

  return null;
};

export { getCurrentUserId as default };
