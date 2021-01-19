import jwt from 'jsonwebtoken';

const getCurrentUserId = async (request, authAssign = true) => {
  const header = request.request
    ? request.request.headers.authorization
    : request.connection.context.Authorization;

  try {
    if (header) {
      const token = header.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      return decoded.userId;
    }

    if (authAssign) {
      throw new Error('Authentication required');
    }

    return null;
  } catch (error) {
    if (!authAssign) {
      return null;
    }
    throw error;
  }
};

export { getCurrentUserId as default };
