// One-time admin seed script — run with: npm run seed
// Delete this file after running in production
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';

async function seed(): Promise<void> {
  await mongoose.connect(env.mongoUri);

  const { User } = await import('../src/models/user.model');

  const existing = await User.findOne({ email: env.admin.email });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(env.admin.password, 12);
  await User.create({
    name: env.admin.name,
    email: env.admin.email,
    passwordHash,
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
  });

  console.log('Admin created successfully');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
