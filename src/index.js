import '@babel/polyfill';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createServer } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { createSchema, createPubSub, createYoga } from 'graphql-yoga';
import Query from './resolvers/Query';
import Mutation from './resolvers/Mutation';
import Subscription from './resolvers/Subscription';
import User from './resolvers/User';

const prisma = new PrismaClient();

const pubSub = createPubSub();

const typeDefs = fs.readFileSync(
  path.join(__dirname, 'schema.graphql'),
  'utf8'
);

const schema = createSchema({
  typeDefs,
  resolvers: {
    Query,
    Mutation,
    Subscription,
    User,
  },
});

const createContext = () => ({
  prisma,
  pubSub,
});

const yoga = createYoga({
  schema,
  context: createContext,
});

const server = createServer(yoga);

const port = process.env.PORT;

server.listen({ port }, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
});
