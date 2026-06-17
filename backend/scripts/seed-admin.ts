// One-time admin seed script — run with: npm run seed
// Delete this file after running in production
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function seed(): Promise<void> {
  await mongoose.connect(process.env.MONGO_URI as string);

  const { User } = await import('../src/models/user.model');

  const email = process.env.ADMIN_EMAIL as string;
  const password = process.env.ADMIN_PASSWORD as string;
  const name = process.env.ADMIN_NAME as string;

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email, passwordHash, role: 'admin', isActive: true, createdAt: new Date() });

  console.log('Admin created successfully');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
