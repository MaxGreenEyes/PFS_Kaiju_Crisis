import { snapshot } from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET() {
  try { return Response.json(await snapshot(),{headers:{'Cache-Control':'no-store'}}); }
  catch { return Response.json({error:'Live event data is temporarily unavailable'},{status:503}); }
}
