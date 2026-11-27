import { NextResponse } from 'next/server';
import { PuzzleService } from '@/lib/puzzle/PuzzleService';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const puzzleId = parseInt(searchParams.get('id') || 0);
    const email = searchParams.get('email') || 'joao@silva.com.br';

    if (!puzzleId) {
      return NextResponse.json({ success: false, error: 'ID do quebra-cabeça não informado' }, { status: 400 });
    }

    const data = await PuzzleService.getUserPuzzleView(email, puzzleId);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Quebra-cabeça não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error('Error fetching single puzzle:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'update_piece') {
      const pieceId = parseInt(body.piece_id);
      if (!pieceId) return NextResponse.json({ success: false, error: 'ID da peça inválido' }, { status: 400 });

      await PuzzleService.updatePieceRule(pieceId, body.unlock_rule_type, body.unlock_rule_data);
      return NextResponse.json({ success: true, message: 'Regra da peça atualizada com sucesso!' });
    }

    return NextResponse.json({ success: false, error: 'Ação inválida' }, { status: 400 });
  } catch (err) {
    console.error('Error updating piece:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
