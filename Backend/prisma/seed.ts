import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_ENV = 'development'; // Ensure we are in development for seeding

const prisma = new PrismaClient();

async function main() {
  console.log( 'Starting seed...');

  // Clear existing data
  await prisma.timeEntry.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectPhase.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.projectStaffing.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create Users
  const manager = await prisma.user.create({
    data: {
      email: 'niraj@example.com',
      name: 'Niraj',
      role: Role.MANAGER,
      password: await bcrypt.hash('manager123', 10),
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
      role: Role.CONTRIBUTOR,
      password: await bcrypt.hash('alice123', 10),
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob',
      role: Role.CONTRIBUTOR,
      password: await bcrypt.hash('bob123', 10),
    },
  });

  console.log(' Created users (Manager Niraj, Alice, Bob)');

  // Create Project ABC 
  const projectABC = await prisma.project.create({
    data: {
      name: 'Project ABC',
      clientName: 'Miebach',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
    },
  });

  console.log('Created Project ABC');

  // Project Staffing - Alice: $100/hr, 50 hours | Bob: $80/hr, 30 hours
  await prisma.projectStaffing.createMany({
    data: [
      {
        projectId: projectABC.id,
        userId: alice.id,
        roleName: 'Consultant',
        hourlyRate: 100,
        forecastHours: 50, // 3 days/week for 10 weeks simplified to 50
      },
      {
        projectId: projectABC.id,
        userId: bob.id,
        roleName: 'Analyst',
        hourlyRate: 80,
        forecastHours: 30, // 2 days/week for 8 weeks = 128, simplified to 30
      },
    ],
  });

  console.log('✅ Added project staffing (forecast budget: $5,000 + $2,400 = $7,400)');

  // Create Phase: Design
  const designPhase = await prisma.projectPhase.create({
    data: {
      projectId: projectABC.id,
      name: 'Design',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
    },
  });

  console.log(' Created phases (Design)');

  // Create Task: Website Redesign
  const websiteRedesignTask = await prisma.task.create({
    data: {
      phaseId: designPhase.id,
      title: 'Website Redesign',
      description: 'Complete overhaul of company website with modern UI/UX',
      status: TaskStatus.IN_PROGRESS,
      startDate: new Date('2025-01-13'),
      endDate: new Date('2025-01-31'),
      dueDate: new Date('2025-01-31'),
      budget: 2000,
    },
  });


  console.log('✅ Created tasks (Website Redesign');

  // Assign Alice to Website Redesign
  await prisma.taskAssignment.create({
    data: {
      taskId: websiteRedesignTask.id,
      userId: alice.id,
      hourlyRate: 100,
    },
  });

  console.log('Created task assignments');

  // Alice logs time (Acceptance Scenario)
  await prisma.timeEntry.createMany({
    data: [
      {
        taskId: websiteRedesignTask.id,
        userId: alice.id,
        date: new Date('2025-01-13'),
        hours: 8,
        isBillable: true,
      },
      {
        taskId: websiteRedesignTask.id,
        userId: alice.id,
        date: new Date('2025-01-14'),
        hours: 6,
        isBillable: true,
      },
    ],
  });

  console.log('Alice logged 14 hours (8h + 6h)');

 

  console.log('\n Seed completed successfully!');
  console.log('\n Summary:');
  console.log('- Users: 3 (1 Manager, 2 Contributors)');
  console.log('- Projects: 1 (Project ABC)');
  console.log('- Phases: 1 (Design)');
  console.log('- Tasks: 1 (Website Redesign)');
  console.log('- Time Entries: 16 hours total');
  console.log('\n🔑 Login Credentials:');
  console.log('Manager: niraj@example.com / manager123');
  console.log('Alice (Contributor): alice@example.com / alice123');
  console.log('Bob (Contributor): bob@example.com / bob123');
  console.log('\n💰 Project ABC Budget Status:');
  console.log('Task: Website Redesign - Budget: $2,000 | Actual: $1,400 | Remaining: $600');
  console.log('Phase: Design - Budget: $2,000 consumed $1,400');
  console.log('Project: ABC - Forecast: $7,400 | Actual: $1,400 | Remaining: $6,000');
  console.log('Alice utilization is 14/50 hours (28%)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });