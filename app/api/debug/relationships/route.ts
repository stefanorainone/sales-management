import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'list' or 'delete'
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    const relationshipsRef = adminDb.collection('relationships');
    let query = relationshipsRef.where('userId', '==', userId);

    if (action === 'delete') {
      const snapshot = await query.get();

      if (snapshot.empty) {
        return NextResponse.json({ message: 'No relationships to delete', count: 0 });
      }

      const batch = adminDb.batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return NextResponse.json({
        message: 'Relationships deleted successfully',
        count: snapshot.size,
      });
    }

    // Default: list relationships
    const snapshot = await query.get();

    const relationships = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      count: relationships.length,
      relationships,
    });

  } catch (error: any) {
    console.error('Error managing relationships:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
