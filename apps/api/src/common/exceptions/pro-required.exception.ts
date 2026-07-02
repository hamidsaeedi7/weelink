import { ForbiddenException } from "@nestjs/common";

/**
 * Thrown when a free-plan user tries to access a PRO-only feature.
 * Carries a machine-readable `code` so the frontend can show an
 * "Upgrade to PRO" modal instead of a generic error toast.
 */
export class ProRequiredException extends ForbiddenException {
  constructor(message = "این ویژگی برای پلن Pro است") {
    super({ statusCode: 403, message, code: "PRO_REQUIRED" });
  }
}
