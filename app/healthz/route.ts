export async function GET(): Promise<Response> {
  return Response.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
