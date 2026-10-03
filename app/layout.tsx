import type { Metadata } from 'next';
import './globals.css';
import './themes.css';
export const metadata: Metadata = {title:'The Kaiju Crisis · House Command',description:'Live House GM clock, reports, and effects for The Kaiju Crisis.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
