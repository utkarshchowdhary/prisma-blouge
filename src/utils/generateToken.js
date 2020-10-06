import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  return jwt.sign({ userId }, 'my-ultra-secure-and-ultra-long-secret', {
    expiresIn: '30d',
  });
};

export { generateToken as default };
