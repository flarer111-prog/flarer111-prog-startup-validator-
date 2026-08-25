'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#07090d',color:'#f5f7fb',fontFamily:'system-ui',padding:24}}><section style={{maxWidth:520,textAlign:'center'}}><div style={{fontSize:48,color:'#b7ff4a'}}>!</div><h1 style={{fontSize:32,margin:'10px 0'}}>VentureProof hit an unexpected error.</h1><p style={{color:'#8993a5',lineHeight:1.7}}>Your idea is safe. Refresh the validator and try again.</p><button onClick={() => reset()} style={{background:'#b7ff4a',border:0,borderRadius:10,padding:'13px 18px',fontWeight:800,cursor:'pointer'}}>Try again</button></section></main>;
}
