import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/services/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, deals, clients, recentActivities, yesterdayTasks, date } = body;

    const briefing = await generateDailyBriefing({
      userId,
      userName,
      deals,
      clients,
      recentActivities,
      yesterdayTasks,
      date,
    });

    return NextResponse.json(briefing);
  } catch (error) {
    console.error('Error generating briefing:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
