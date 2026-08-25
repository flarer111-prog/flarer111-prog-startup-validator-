import type {Metadata} from 'next';import './globals.css'
export const metadata:Metadata={title:'VentureProof — Validate Before You Build',description:'Evidence-driven startup validation for founders.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
