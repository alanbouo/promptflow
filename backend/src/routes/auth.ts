import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/db.js';
import { signToken } from '../lib/jwt.js';
import { authMiddleware } from '../middleware/auth.js';

const auth = new Hono();

// POST /auth/register - Register a new user
auth.post('/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: 'user'
      }
    });

    // Generate token
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Failed to register user' }, 500);
  }
});

// POST /auth/login - Login user
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate token
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Failed to login' }, 500);
  }
});

// POST /auth/forgot-password - Request password reset
auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({ message: 'If an account exists, a reset email has been sent' });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt
      }
    });

    // TODO: Send email with reset link
    // For now, just log it
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return c.json({ message: 'If an account exists, a reset email has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
});

// POST /auth/reset-password - Reset password with token
auth.post('/reset-password', async (c) => {
  try {
    const { token, password } = await c.req.json();

    if (!token || !password) {
      return c.json({ error: 'Token and password are required' }, 400);
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return c.json({ error: 'Invalid or expired token' }, 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });

    return c.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// GET /auth/me - Get current user (protected)
auth.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!fullUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(fullUser);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// POST /auth/exchange-token - Exchange NextAuth session for backend JWT (internal use only)
auth.post('/exchange-token', async (c) => {
  try {
    // Verify internal secret to ensure this is from our frontend server
    const internalSecret = c.req.header('X-Internal-Secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    
    if (!expectedSecret || internalSecret !== expectedSecret) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { userId, email, role } = await c.req.json();

    if (!userId || !email) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.email !== email) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Generate token
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return c.json({ token });
  } catch (error) {
    console.error('Exchange token error:', error);
    return c.json({ error: 'Failed to exchange token' }, 500);
  }
});

export default auth;
