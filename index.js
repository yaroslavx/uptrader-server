import fastify from 'fastify';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import sensible from '@fastify/sensible';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
dotenv.config();

const server = fastify();
server.register(sensible);
server.register(cookie, { secret: process.env.COOKIE_SECRET });
server.register(cors, {
  origin: process.env.CLIENT_URL,
  credentials: true,
});
server.addHook('onRequest', (req, res, done) => {
  if (req.cookies.userId !== CURRENT_USER_ID) {
    req.cookies.userId = CURRENT_USER_ID;
    res.clearCookie('userId');
    res.setCookie('userId', CURRENT_USER_ID);
  }
  done();
});
const prisma = new PrismaClient();
const CURRENT_USER_ID = (
  await prisma.user.findFirst({ where: { name: 'Josh' } })
).id;

const COMMENT_SELECT_FIELD = {
  id: true,
  message: true,
  parentId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
    },
  },
};

server.get('/projects', async (req, res) => {
  return await commitToDb(
    prisma.project.findMany({
      select: {
        id: true,
        title: true,
      },
    })
  );
});

server.get('/projects/:id', async (req, res) => {
  return await commitToDb(
    prisma.project.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        columns: {
          include: {
            tasks: {
              include: {
                comments: {
                  include: {
                    children: true,
                  },
                },
                subtasks: true,
              },
            },
          },
        },
      },
    })
  );
});

server.get('/tasks', async (req, res) => {
  return await commitToDb(
    prisma.task.findMany({
      select: {
        id: true,
        title: true,
      },
    })
  );
});

server.get('/tasks/:id', async (req, res) => {
  return await commitToDb(
    prisma.task.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        description: true,
        title: true,
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
          select: COMMENT_SELECT_FIELD,
        },
      },
    })
  );
});

server.put('/tasks/changeStatus/:taskId', async (req, res) => {
  const { columnId } = await prisma.column.findFirst({
    where: { title: req.params.status },
    select: { id: true },
  });

  return await commitToDb(
    prisma.task.updateMany({
      where: { id: req.params.taskId },
      data: {
        status: req.body.status,
        columnId: columnId,
      },
    })
  );
});

server.post('/tasks/:id/comments', async (req, res) => {
  if (req.body.message === '' || req.body.message == null) {
    return res.send(server.httpErrors.badRequest('Message is required'));
  }

  return await commitToDb(
    prisma.comment.create({
      data: {
        message: req.body.message,
        userId: req.cookies.userId,
        parentId: req.body.parentId,
        taskId: req.params.id,
      },
      select: COMMENT_SELECT_FIELD,
    })
  );
});

server.put('/tasks/:id/comments/:commentId', async (req, res) => {
  if (req.body.message === '' || req.body.message == null) {
    return res.send(server.httpErrors.badRequest('Message is required'));
  }

  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true },
  });
  if (userId !== req.cookies.userId) {
    return res.send(
      server.httpErrors.unauthorized(
        'You do not have permission to edit this message'
      )
    );
  }

  return await commitToDb(
    prisma.comment.update({
      where: { id: req.params.commentId },
      data: { message: req.body.message },
      select: { message: true },
    })
  );
});

server.delete('/posts/:id/comments/:commentId', async (req, res) => {
  const { userId } = await prisma.comment.findUnique({
    where: { id: req.params.commentId },
    select: { userId: true },
  });
  if (userId !== req.cookies.userId) {
    return res.send(
      server.httpErrors.unauthorized(
        'You do not have permission to delete this message'
      )
    );
  }

  return await commitToDb(
    prisma.comment.delete({
      where: { id: req.params.commentId },
      select: { id: true },
    })
  );
});

async function commitToDb(promise) {
  const [err, data] = await server.to(promise);
  if (err) {
    return server.httpErrors.internalServerError(err.message);
  }
  return data;
}

server.listen({ port: process.env.PORT });
