import { NextResponse } from 'next/server';
import { validateIdea } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idea = typeof body.idea === 'string' ? body.idea.trim() : '';
    const customer = typeof body.customer === 'string' ? body.customer.trim() : '';
    if (!idea || !customer) return NextResponse.json({ error: 'Idea and target customer are required.' }, { status: 400 });
    if (idea.length > 5000 || customer.length > 500) return NextResponse.json({ error: 'Input is too long.' }, { status: 400 });
    return NextResponse.json(validateIdea({ idea, customer }));
  } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
}
