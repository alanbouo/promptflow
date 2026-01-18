import { execSync } from 'child_process';
try {
  execSync('npx prisma db push', { encoding: 'utf8', stdio: 'inherit' });
  console.log('Database schema pushed successfully');
} catch (error) {
  console.error('Error pushing database schema:', error.message);
  process.exit(1);
}
