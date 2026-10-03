import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
const secret=()=> (env as unknown as {ADMIN_PASSCODE?:string}).ADMIN_PASSCODE;
const b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
async function sign(value:string) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret()),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))));
}
export async function adminCookie() {
  const exp=Date.now()+12*60*60*1000;
  const value=String(exp);
  return `${value}.${await sign(value)}`;
}
export async function isAdmin() {
  if(!secret()) return false;
  const token=(await cookies()).get('house_admin')?.value ?? '';
  const [exp,sig]=token.split('.');
  if(!exp||!sig||Number(exp)<Date.now()||Number(exp)>Date.now()+12*60*60*1000) return false;
  return (await sign(exp))===sig;
}
export async function validPasscode(input:unknown) {
  const s=secret();
  if(!s||typeof input!=='string'||input.length!==s.length) return false;
  const a=new TextEncoder().encode(input), b=new TextEncoder().encode(s);
  let diff=0; for(let i=0;i<a.length;i++) diff|=a[i]^b[i];
  return diff===0;
}
export function sameOrigin(req:Request) {
  const origin=req.headers.get('origin');
  return !!origin && new URL(origin).host===new URL(req.url).host;
}
