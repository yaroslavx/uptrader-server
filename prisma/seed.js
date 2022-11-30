import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
  await prisma.project.deleteMany();
  await prisma.column.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  const josh = await prisma.user.create({ data: { name: 'Josh' } });
  const sam = await prisma.user.create({ data: { name: 'Sam' } });

  const project1 = await prisma.project.create({
    data: {
      title: 'Project',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Second project',
    },
  });

  const columnQueue = await prisma.column.create({
    data: {
      title: 'Queue',
      projectId: project1.id,
    },
  });

  const columnDevelopment = await prisma.column.create({
    data: {
      title: 'Development',
      projectId: project1.id,
    },
  });

  const columnDone = await prisma.column.create({
    data: {
      title: 'Done',
      projectId: project1.id,
    },
  });

  const task1 = await prisma.task.create({
    data: {
      title: 'Task 1',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer placerat urna vel ante volutpat, ut elementum mi placerat.',
      inProcess: '60 days',
      finishAt: new Date(Date.parse('2022-10-10')),
      priority: 'Main',
      status: 'Queue',
      file: 'file',
      columnId: columnQueue.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Task 2',
      description:
        'Proin ut sollicitudin lacus. Mauris blandit, turpis in efficitur lobortis, lectus lacus dictum ipsum, vel pretium ex lacus id mauris.',
      inProcess: '60 days',
      finishAt: new Date(Date.parse('2022-10-10')),
      priority: 'Main',
      status: 'Done',
      file: 'file',
      file: 'file',
      columnId: columnDone.id,
    },
  });

  const subtask1 = await prisma.subtask.create({
    data: {
      description: 'Subtask description N1',
      done: true,
      taskId: task1.id,
    },
  });

  const subtask2 = await prisma.subtask.create({
    data: {
      description: 'Second subtask description',
      done: false,
      taskId: task1.id,
    },
  });

  const comment1 = await prisma.comment.create({
    data: {
      message: 'I am a root comment',
      userId: josh.id,
      taskId: task1.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      parentId: comment1.id,
      message: 'I am a nested comment',
      userId: sam.id,
      taskId: task1.id,
    },
  });

  const comment3 = await prisma.comment.create({
    data: {
      message: 'I am another root comment',
      userId: sam.id,
      taskId: task1.id,
    },
  });
}

seed();
