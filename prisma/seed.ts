import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = 'demo@taskflow.dev';
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Demo User',
      email,
      passwordHash,
    },
  });

  let project = await prisma.project.findFirst({
    where: { ownerId: user.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        title: 'Website Redesign',
        description: 'Refresh the marketing site and improve conversion.',
        ownerId: user.id,
      },
    });
  }

  const taskCount = await prisma.task.count({ where: { projectId: project.id } });

  if (taskCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          projectId: project.id,
          title: 'Draft new landing page copy',
          status: 'IN_PROGRESS',
          dueDate: new Date('2026-11-01'),
        },
        {
          projectId: project.id,
          title: 'Audit accessibility of navigation',
          status: 'TODO',
        },
        {
          projectId: project.id,
          title: 'Ship responsive hero section',
          status: 'COMPLETED',
          assignedTo: user.id,
        },
      ],
    });
  }

  console.log(`Seeded demo account: ${email} / Password123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
