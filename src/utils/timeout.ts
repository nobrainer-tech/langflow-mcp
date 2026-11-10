export const DEFAULT_LANGFLOW_TIMEOUT_MS = 30000;
const MIN_LANGFLOW_TIMEOUT_MS = 1000;
const MAX_LANGFLOW_TIMEOUT_MS = 300000;

/** The request timeout the Langflow client uses; an unset or out-of-range value falls back to the default. */
export function resolveLangflowTimeout(raw: string | undefined = process.env.LANGFLOW_TIMEOUT): number {
  const timeout = parseInt(raw || '', 10);
  return isNaN(timeout) || timeout < MIN_LANGFLOW_TIMEOUT_MS || timeout > MAX_LANGFLOW_TIMEOUT_MS
    ? DEFAULT_LANGFLOW_TIMEOUT_MS
    : timeout;
}
