import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// POST /api/auth/backend-token - Exchange NextAuth session for backend JWT token
// This endpoint allows the frontend to get a backend token without re-entering credentials
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Call backend to generate a token for this user
    // The backend needs a special endpoint that trusts the frontend server
    const response = await fetch(`${BACKEND_URL}/api/auth/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role || 'user',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to get backend token' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
