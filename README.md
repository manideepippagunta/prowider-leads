# Prowider Leads Allocation Engine

A high-concurrency, intelligent lead allocation engine built with Next.js 14 (App Router), Prisma, and PostgreSQL.

## How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup PostgreSQL Database:**
   Ensure you have a PostgreSQL instance running. Update the `DATABASE_URL` in your `.env` file to point to your database.
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/prowider_leads?schema=public"
   ```

3. **Run Migrations and Seed the Database:**
   ```bash
   npx prisma migrate dev --name init
   ```
   *(This will apply the schema and automatically run `prisma/seed.ts` to populate the default services and providers)*

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to interact with the dashboard and API tools!

---

## Architecture & Business Rules

### Allocation Algorithm (Round-Robin with Persisted State)
Every lead arriving in the system is processed to be assigned to **exactly 3 providers** (assuming quota limits allow). 
- **Mandatory Assignments:** Certain providers are statically bound to certain services (e.g., Service 1 always goes to Provider 1). They are picked first.
- **Fair Pool Assignments:** The remaining slots (up to 3 total) are filled by selecting providers from a defined "pool" for that service.
- **Persisted State:** To guarantee a fair round-robin distribution, the index (`lastProviderIndex`) of the last selected pool provider is persisted in the `AllocationState` table. The next lead simply picks up where the previous one left off.

### How Concurrency is Handled
The system handles extreme concurrent load and prevents duplicate distributions using two main pillars:

1. **Database-Level Row Locking:**
   Inside `lib/allocate.ts`, the lead assignment process is wrapped in a Prisma `$transaction`. Before reading the `lastProviderIndex`, the engine executes a PostgreSQL raw query:
   ```sql
   SELECT id, "lastProviderIndex" FROM "AllocationState" WHERE "serviceId" = $1 FOR UPDATE
   ```
   The `FOR UPDATE` clause exclusively locks that service's allocation row. If 10 leads arrive at the exact same millisecond, the database forces them to queue up and process sequentially, ensuring no two requests ever read the same "next index" or step on each other's quota counts.

2. **Unique Constraints:**
   - **`Lead (phone, serviceId)`**: Enforced at the schema level so the DB fundamentally rejects duplicate lead insertions.
   - **`LeadAssignment (leadId, providerId)`**: Prevents the same provider from being accidentally assigned the same lead twice.

### Webhook Idempotency
Provider quotas can be reset dynamically via a webhook (`POST /api/webhook/quota-reset`). To protect against retry-loops or network anomalies where a webhook might fire 5 times simultaneously:
- The endpoint demands an `idempotencyKey`.
- It executes a transaction that checks the `WebhookEvent` table for that exact key.
- If it exists, it returns a safe `200` without doing anything. If it's new, it resets the quotas and writes the key to the table inside the same transaction block, ensuring identical repeated calls yield exactly one reset.
