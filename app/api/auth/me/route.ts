import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload || !payload.id) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(payload.id);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Me route error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
