import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';

const getCurrentUserId = async (request, authAssign = true) => {
  const header = request.headers.get('authorization');

  try {
    if (header) {
      const token = header.replace('Bearer ', '');
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      return userId;
    }

    if (authAssign) throw new GraphQLError('Authentication required');
  } catch (error) {
    if (authAssign) throw new GraphQLError('Authentication failed');
  }
};

export { getCurrentUserId as default };
