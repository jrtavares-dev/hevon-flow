import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, generateToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Informe o e-mail e a senha.' }, { status: 400 });
    }

    const admin = await queryOne('SELECT * FROM admins WHERE email = ? LIMIT 1', [email.trim()]);

    if (!admin) {
      return NextResponse.json({ success: false, message: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    if (admin.status === 'inactive') {
      return NextResponse.json(
        { success: false, message: 'Esta conta está inativa. Contate o administrador.' },
        { status: 403 }
      );
    }

    const valid = verifyPassword(password, admin.password);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });

    const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
    const isHttps = proto === 'https';

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, message: 'Erro interno ao realizar login.' }, { status: 500 });
  }
}
