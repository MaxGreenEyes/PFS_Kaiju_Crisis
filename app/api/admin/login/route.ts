import { adminCookie, sameOrigin, validPasscode } from '@/lib/auth';
export async function POST(req:Request) {
  if(!sameOrigin(req)) return Response.json({error:'Request rejected'},{status:403});
  let body; try {body=await req.json() as {passcode?:unknown};} catch {return Response.json({error:'Invalid request'},{status:400});}
  if(!await validPasscode(body.passcode)) return Response.json({error:'Incorrect passcode'},{status:401});
  const token=await adminCookie();
  return Response.json({ok:true},{headers:{'Set-Cookie':`house_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`}});
}
