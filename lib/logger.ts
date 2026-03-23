export function logServerError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const normalized = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };

  console.error(
    JSON.stringify({
      level: "error",
      context,
      ...normalized,
      ...(extra ?? {}),
      ts: new Date().toISOString()
    })
  );
}
