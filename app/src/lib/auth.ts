import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './db';

// Log secret status at startup (not the actual secret!)
const secret = process.env.NEXTAUTH_SECRET;
console.log('[NextAuth] NEXTAUTH_SECRET status:', {
  exists: !!secret,
  length: secret?.length || 0,
  startsWithQuote: secret?.startsWith('"') || secret?.startsWith("'"),
});

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode to see detailed logs
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('[NextAuth] authorize called with email:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log('[NextAuth] Missing credentials');
            throw new Error('Email and password are required');
          }

          console.log('[NextAuth] Looking up user in database...');
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            console.log('[NextAuth] User not found');
            throw new Error('Invalid email or password');
          }

          console.log('[NextAuth] User found, checking password...');
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log('[NextAuth] Invalid password');
            throw new Error('Invalid email or password');
          }

          console.log('[NextAuth] Login successful for user:', user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          console.error('[NextAuth] authorize error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        console.log('[NextAuth] jwt callback called, user:', user?.id);
        if (user) {
          token.id = user.id;
          token.role = (user as any).role;
        }
        return token;
      } catch (error) {
        console.error('[NextAuth] jwt callback error:', error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        console.log('[NextAuth] session callback called, token.id:', token.id);
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
        }
        return session;
      } catch (error) {
        console.error('[NextAuth] session callback error:', error);
        throw error;
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      console.error('[NextAuth] Error:', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth] Warning:', code);
    },
    debug(code, metadata) {
      console.log('[NextAuth] Debug:', code, metadata);
    }
  }
};

// Helper to get current user from session
export async function getCurrentUser(session: any) {
  if (!session?.user?.id) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
  
  return user;
}
