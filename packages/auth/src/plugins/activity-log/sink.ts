import type { Database } from "@sycom-learn/db";
import { activity, type NewActivity } from "@sycom-learn/db/schema/activity";
import { createLoggerWithContext } from "@sycom-learn/logger";

const log = createLoggerWithContext("auth:activity");

/** Where activity rows go. Swappable so the plugin can be tested without a database. */
export type ActivitySink = (row: NewActivity) => Promise<void>;

export function createDatabaseSink(db: Database): ActivitySink {
  return async (row) => {
    await db.insert(activity).values(row);
  };
}

/**
 * jsonb drops `undefined` silently, which would leave rows carrying `{}` or
 * `{"provider": null}`. Strip empty values so an absent field reads as absent.
 */
export function cleanMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) return null;
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== undefined,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

/**
 * Wraps a sink so a write can never reject into a caller. An audit row is not
 * worth failing a sign-in over, so failures are logged and dropped.
 *
 * `runInBackground` is handed an already-settled-safe promise: its default
 * implementation (`p => { p.catch(() => {}) }`) does not actually defer past the
 * response and swallows errors, so our own `.catch` has to come first. If
 * `advanced.backgroundTasks.handler` is ever configured, real deferral comes for
 * free.
 */
export function createRecorder(sink: ActivitySink) {
  return function record(
    ctx: { context?: { runInBackground?: (promise: Promise<unknown>) => void } } | null | undefined,
    row: NewActivity,
  ): void {
    const promise = sink({ ...row, metadata: cleanMetadata(row.metadata) }).catch(
      (error: unknown) => {
        log.error("Failed to write activity row", { event: row.event, error });
      },
    );
    ctx?.context?.runInBackground?.(promise);
  };
}

export { log as activityLogger };
