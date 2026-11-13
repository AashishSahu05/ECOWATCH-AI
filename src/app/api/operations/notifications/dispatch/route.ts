/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Multi-Channel Notification Dispatch API Endpoint
 * POST /api/operations/notifications/dispatch
 */

import { NextRequest } from "next/server";
import { getOperationsAdapter } from "@/lib/operations/adapter";
import { DispatchNotificationInputSchema } from "@/lib/operations/schema";
import {
  requireMunicipalAuthority,
  operationsSuccessResponse,
  operationsErrorResponse,
} from "@/lib/operations/api-helper";

export async function POST(request: NextRequest) {
  try {
    // 1. RBAC Guard: Municipal officers and administrators only
    await requireMunicipalAuthority(request);

    // 2. Parse and validate notification payload
    const body = await request.json();
    const validatedInput = DispatchNotificationInputSchema.parse(body);

    // 3. Dispatch notification via adapter
    const adapter = getOperationsAdapter();
    const notificationLog = await adapter.recordNotificationLog(validatedInput);

    return operationsSuccessResponse(
      {
        notification: notificationLog,
        message: `Notification successfully queued and dispatched via ${notificationLog.channel.toUpperCase()}`,
        isMock: adapter.isMockMode,
      },
      201
    );
  } catch (error) {
    return operationsErrorResponse(error, "Failed to dispatch operational notification");
  }
}
