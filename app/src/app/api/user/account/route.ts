import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete account' },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 }
      );
    }

    // Delete user and all related data (cascades will handle related records)
    await prisma.$transaction([
      // Delete jobs first (no cascade set)
      prisma.job.deleteMany({
        where: { userId: session.user.id }
      }),
      // Delete templates (no cascade set)
      prisma.template.deleteMany({
        where: { userId: session.user.id }
      }),
      // Delete password reset tokens (has cascade)
      prisma.passwordResetToken.deleteMany({
        where: { userId: session.user.id }
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id: session.user.id }
      })
    ]);

    return NextResponse.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
