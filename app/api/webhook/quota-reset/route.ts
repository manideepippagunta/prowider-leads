import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idempotencyKey, providerId } = body;

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check for already processed webhook
      const existingEvent = await tx.webhookEvent.findUnique({
        where: { idempotencyKey },
      });

      if (existingEvent) {
        return { status: 200, message: 'already processed' };
      }

      // Reset logic
      if (providerId) {
        await tx.provider.update({
          where: { id: Number(providerId) },
          data: { leadsReceived: 0 },
        });
      } else {
        await tx.provider.updateMany({
          data: { leadsReceived: 0 },
        });
      }

      // Mark as processed
      await tx.webhookEvent.create({
        data: {
          idempotencyKey,
          processedAt: new Date(),
        },
      });

      return { status: 200, message: 'quota reset successfully' };
    });

    return NextResponse.json({ message: result.message }, { status: result.status });
  } catch (error: unknown) {
    console.error('Error in quota-reset webhook:', error);
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ message: 'already processed' }, { status: 200 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
