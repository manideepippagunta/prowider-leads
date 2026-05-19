import { prisma } from './prisma';

export async function assignProviders(leadId: string, serviceId: string): Promise<void> {
  const lId = parseInt(leadId, 10);
  const sId = parseInt(serviceId, 10);

  if (isNaN(lId) || isNaN(sId)) {
    throw new Error('Invalid leadId or serviceId');
  }

  // Business Rules Config
  // Service IDs: Service 1=7, Service 2=8, Service 3=9
  // Provider IDs: Provider 1=17, Provider 2=18, ..., Provider 8=24
  const MANDATORY_MAP: Record<number, number[]> = {
    7: [17],        // Service 1 → Provider 1
    8: [21],        // Service 2 → Provider 5
    9: [17, 20],    // Service 3 → Provider 1 AND Provider 4
  };

  const POOL_MAP: Record<number, number[]> = {
    7: [18, 19, 20],              // Service 1 → Providers 2, 3, 4
    8: [22, 23, 24],              // Service 2 → Providers 6, 7, 8
    9: [18, 19, 21, 22, 23, 24], // Service 3 → Providers 2, 3, 5, 6, 7, 8
  };

  const mandatoryIds = MANDATORY_MAP[sId] || [];
  const poolIds = POOL_MAP[sId] || [];

  await prisma.$transaction(async (tx) => {
    // 1. Lock AllocationState for this service to prevent race conditions during round-robin
    const stateLock = await tx.$queryRaw<{ id: number; lastProviderIndex: number }[]>`
      SELECT id, "lastProviderIndex" 
      FROM "AllocationState" 
      WHERE "serviceId" = ${sId} 
      FOR UPDATE
    `;

    if (stateLock.length === 0) {
      throw new Error(`AllocationState not found for serviceId ${sId}`);
    }

    let currentIndex = stateLock[0].lastProviderIndex;
    const allocationStateId = stateLock[0].id;

    // 2. Fetch existing assignments for this lead to avoid duplicates
    const existingAssignments = await tx.leadAssignment.findMany({
      where: { leadId: lId },
    });
    const assignedProviderIds = new Set(existingAssignments.map((a) => a.providerId));

    // 3. Fetch all relevant providers to check quotas
    const providerIdsToCheck = Array.from(new Set([...mandatoryIds, ...poolIds]));
    const providers = await tx.provider.findMany({
      where: {
        id: { in: providerIdsToCheck },
      },
    });

    // 4. Filter eligible providers (quota > leadsReceived and not already assigned)
    const eligibleProviders = providers.filter(
      (p) => p.leadsReceived < p.monthlyQuota && !assignedProviderIds.has(p.id)
    );
    const eligibleProviderIds = new Set(eligibleProviders.map((p) => p.id));

    const selectedProviders = new Set<number>();

    // 5. Assign Mandatory Providers
    for (const mId of mandatoryIds) {
      if (eligibleProviderIds.has(mId)) {
        selectedProviders.add(mId);
      }
    }

    // 6. Assign Fair Pool Providers via Round Robin
    const needed = 3 - selectedProviders.size;

    if (needed > 0 && poolIds.length > 0) {
      let attempts = 0;
      const maxAttempts = poolIds.length;

      // Advance through the pool round-robin style
      while (selectedProviders.size < 3 && attempts < maxAttempts) {
        currentIndex = (currentIndex + 1) % poolIds.length;
        const candidateId = poolIds[currentIndex];

        if (
          eligibleProviderIds.has(candidateId) &&
          !selectedProviders.has(candidateId)
        ) {
          selectedProviders.add(candidateId);
        }

        attempts++;
      }
    }

    if (selectedProviders.size < 3) {
      throw new Error(`Insufficient provider quota: Could only find ${selectedProviders.size} out of 3 required providers. Lead allocation aborted.`);
    }

    // 7. Create assignments
    const assignmentPromises = Array.from(selectedProviders).map((pId) => {
      return tx.leadAssignment.create({
        data: {
          leadId: lId,
          providerId: pId,
        },
      });
    });

    await Promise.all(assignmentPromises);

    // 8. Update leadsReceived (which effectively decrements remaining quota)
    await tx.provider.updateMany({
      where: { id: { in: Array.from(selectedProviders) } },
      data: {
        leadsReceived: {
          increment: 1,
        },
      },
    });

    // 9. Persist the new round-robin index
    await tx.allocationState.update({
      where: { id: allocationStateId },
      data: {
        lastProviderIndex: currentIndex,
      },
    });
  });
}
