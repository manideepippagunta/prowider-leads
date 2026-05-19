import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      include: {
        leadAssignments: {
          include: {
            lead: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    const data = providers.map((p) => ({
      id: p.id,
      name: p.name,
      monthlyQuota: p.monthlyQuota,
      leadsReceived: p.leadsReceived,
      remainingQuota: p.monthlyQuota - p.leadsReceived,
      assignedLeads: p.leadAssignments.map((a) => ({
        id: a.lead.id,
        customerName: a.lead.customerName,
        serviceName: a.lead.service.name,
        assignedAt: a.assignedAt,
      })),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
