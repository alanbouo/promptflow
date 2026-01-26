import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import prisma from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';

const user = new Hono();

// All routes require authentication
user.use('*', authMiddleware);

// GET /user/account - Get user account details
user.get('/account', async (c) => {
  try {
    const currentUser = c.get('user');

    const account = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!account) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return c.json({ error: 'Failed to fetch account' }, 500);
  }
});

// PUT /user/account - Update user account
user.put('/account', async (c) => {
  try {
    const currentUser = c.get('user');
    const body = await c.req.json();

    const updateData: { name?: string; email?: string } = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.email !== undefined) {
      // Check if email is already taken
      const existing = await prisma.user.findUnique({
        where: { email: body.email }
      });

      if (existing && existing.id !== currentUser.id) {
        return c.json({ error: 'Email already in use' }, 400);
      }

      updateData.email = body.email;
    }

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return c.json(updated);
  } catch (error) {
    console.error('Error updating account:', error);
    return c.json({ error: 'Failed to update account' }, 500);
  }
});

// PUT /user/password - Change password
user.put('/password', async (c) => {
  try {
    const currentUser = c.get('user');
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current and new password are required' }, 400);
    }

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: currentUser.id }
    });

    if (!userWithPassword) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userWithPassword.password);

    if (!isValid) {
      return c.json({ error: 'Current password is incorrect' }, 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { password: hashedPassword }
    });

    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// DELETE /user/account - Delete user account
user.delete('/account', async (c) => {
  try {
    const currentUser = c.get('user');

    // Delete user and all related data (cascade)
    await prisma.user.delete({
      where: { id: currentUser.id }
    });

    return c.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

export default user;
