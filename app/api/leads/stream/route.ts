import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ message: 'connected' })}\n\n`)
      );

      let lastCheckTime = new Date();

      const interval = setInterval(async () => {
        try {
          const checkTime = new Date();

          const newAssignments = await prisma.leadAssignment.findMany({
            where: {
              assignedAt: {
                gt: lastCheckTime,
              },
            },
            include: {
              lead: true,
              provider: true,
            },
            orderBy: {
              assignedAt: 'asc',
            },
          });

          if (newAssignments.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(newAssignments)}\n\n`)
            );

            // Update lastCheckTime to the max assignedAt to prevent duplicate sends
            lastCheckTime = newAssignments[newAssignments.length - 1].assignedAt;
          } else {
            // Advance the polling window forward safely
            lastCheckTime = checkTime;
          }
        } catch (error) {
          console.error('SSE Error:', error);
          controller.error(error);
          clearInterval(interval);
        }
      }, 2000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
