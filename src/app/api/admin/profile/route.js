import { NextResponse } from 'next/server';
import { getCurrentAdmin, verifyPassword, hashPassword } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

export async function PUT(request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, current_password, new_password } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    }

    // Check if email belongs to someone else
    const existing = await queryOne('SELECT id FROM admins WHERE email = ? AND id != ? LIMIT 1', [
      email.trim(),
      admin.id,
    ]);
    if (existing) {
      return NextResponse.json({ success: false, message: 'Este e-mail já está em uso.' }, { status: 400 });
    }

    // If changing password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ success: false, message: 'Informe a senha atual.' }, { status: 400 });
      }

      const fullAdmin = await queryOne('SELECT password FROM admins WHERE id = ? LIMIT 1', [admin.id]);
      if (!verifyPassword(current_password, fullAdmin.password)) {
        return NextResponse.json({ success: false, message: 'A senha atual está incorreta.' }, { status: 400 });
      }

      if (new_password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' },
          { status: 400 }
        );
      }

      const hashed = hashPassword(new_password);
      await execute('UPDATE admins SET name = ?, email = ?, password = ? WHERE id = ?', [
        name.trim(),
        email.trim(),
        hashed,
        admin.id,
      ]);
    } else {
      await execute('UPDATE admins SET name = ?, email = ? WHERE id = ?', [name.trim(), email.trim(), admin.id]);
    }

    return NextResponse.json({ success: true, message: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json({ success: false, message: 'Erro ao atualizar perfil.' }, { status: 500 });
  }
}
