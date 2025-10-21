import { NextRequest, NextResponse } from 'next/server';
import type { AICustomInstructions } from '@/types';

// Mock storage - in production, use database
let mockInstructions: AICustomInstructions[] = [
  {
    id: 'instr-1',
    userId: 'user-1',
    adminId: 'admin-1',
    instructions: 'Focus su scuole e comuni. Evita hotel per ora. Priorità: chiudere Liceo Da Vinci entro fine mese.',
    priority: 'high',
    active: true,
    createdAt: new Date('2025-10-15').toISOString(),
    updatedAt: new Date('2025-10-15').toISOString(),
  },
  {
    id: 'instr-2',
    userId: 'user-2',
    adminId: 'admin-1',
    instructions: 'Ottimo lavoro su Siena! Continua con Comuni. Prepara demo per Roma Palace.',
    priority: 'medium',
    active: true,
    createdAt: new Date('2025-10-14').toISOString(),
    updatedAt: new Date('2025-10-14').toISOString(),
  },
];

// GET - Fetch instructions for a specific user or all instructions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const userInstructions = mockInstructions.filter(
        (instr) => instr.userId === userId && instr.active
      );
      return NextResponse.json(userInstructions);
    }

    // Return all active instructions
    return NextResponse.json(mockInstructions.filter((instr) => instr.active));
  } catch (error) {
    console.error('Error fetching instructions:', error);
    return NextResponse.json({ error: 'Failed to fetch instructions' }, { status: 500 });
  }
}

// POST - Create new instruction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, instructions, priority, expiresAt } = body;

    if (!userId || !instructions) {
      return NextResponse.json(
        { error: 'userId and instructions are required' },
        { status: 400 }
      );
    }

    const newInstruction: AICustomInstructions = {
      id: `instr-${Date.now()}`,
      userId,
      adminId: 'admin-1', // In production, get from session
      instructions,
      priority: priority || 'medium',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt || undefined,
    };

    mockInstructions.push(newInstruction);

    return NextResponse.json(newInstruction, { status: 201 });
  } catch (error) {
    console.error('Error creating instruction:', error);
    return NextResponse.json({ error: 'Failed to create instruction' }, { status: 500 });
  }
}

// PUT - Update instruction
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, instructions, priority, active, expiresAt } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const index = mockInstructions.findIndex((instr) => instr.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Instruction not found' }, { status: 404 });
    }

    mockInstructions[index] = {
      ...mockInstructions[index],
      instructions: instructions !== undefined ? instructions : mockInstructions[index].instructions,
      priority: priority !== undefined ? priority : mockInstructions[index].priority,
      active: active !== undefined ? active : mockInstructions[index].active,
      expiresAt: expiresAt !== undefined ? expiresAt : mockInstructions[index].expiresAt,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockInstructions[index]);
  } catch (error) {
    console.error('Error updating instruction:', error);
    return NextResponse.json({ error: 'Failed to update instruction' }, { status: 500 });
  }
}

// DELETE - Delete instruction (soft delete by setting active = false)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const index = mockInstructions.findIndex((instr) => instr.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Instruction not found' }, { status: 404 });
    }

    mockInstructions[index].active = false;
    mockInstructions[index].updatedAt = new Date().toISOString();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    return NextResponse.json({ error: 'Failed to delete instruction' }, { status: 500 });
  }
}
