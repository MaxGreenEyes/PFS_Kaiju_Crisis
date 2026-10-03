import { isAdmin, sameOrigin } from '@/lib/auth';
import { mutate } from '@/lib/server';
export async function POST(req:Request) {
  if(!sameOrigin(req)||!await isAdmin()) return Response.json({error:'House GM access required'},{status:403});
  try {
    const body=await req.json() as Record<string,unknown>;
    return Response.json(await mutate(body));
  } catch(e) {
    return Response.json({error:e instanceof Error?e.message:'Could not save the change'},{status:400});
  }
}
