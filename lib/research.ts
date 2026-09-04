import type {Evidence} from './validation'

const env=(x:string)=>process.env[x]
const post=async(url:string,body:any,headers:Record<string,string>)=>{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body),cache:'no-store'});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json()}

type Lane={name:string;category:string;sourceType:string;query:(idea:string,customer:string,location:string)=>string;domains?:string[];fresh?:boolean;weight?:number}

const lanes:Lane[]=[
 {name:'Market demand',category:'demand',sourceType:'MARKET',query:(i,c,l)=>`"${i}" ${c} market demand adoption growth ${l}`},
 {name:'Customer intent',category:'demand',sourceType:'CUSTOMER INTENT',query:(i,c,l)=>`people actively looking for hiring requesting or paying for \"${i}\" ${c} ${l}`} ,
 {name:'Problem & workaround signals',category:'problem',sourceType:'PROBLEM SIGNAL',query:(i,c,l)=>`"${i}" complaints pain workaround frustrated need ${c} ${l}`},
 {name:'Reddit demand',category:'demand',sourceType:'REDDIT',domains:['reddit.com'],query:(i,c,l)=>`Reddit people asking for hiring recommending or looking to buy \"${i}\" ${c} ${l}`} ,
 {name:'Freelancer / marketplace demand',category:'acquisition',sourceType:'FREELANCE MARKET',domains:['upwork.com','fiverr.com','freelancer.com','contra.com'],query:(i,c,l)=>`clients hiring or buying \"${i}\" B2B lead generation cold calling appointment setting project budget ${c} ${l}`} ,
 {name:'Current news',category:'context',sourceType:'NEWS',query:(i,c,l)=>`"${i}" latest news market customers industry ${l} 2026`,fresh:true},
 {name:'Expert analysis & outlook',category:'context',sourceType:'EXPERT ANALYSIS',query:(i,c,l)=>`"${i}" expert analysis market outlook forecast industry expectations ${l} 2026`},
 {name:'Founder books & frameworks',category:'context',sourceType:'BOOK FRAMEWORK',query:(i,c,l)=>`"${i}" "The Mom Test" "The Lean Startup" "Obviously Awesome" "Traction" founder advice`},
 {name:'Competition & substitutes',category:'competition',sourceType:'COMPETITOR',query:(i,c,l)=>`"${i}" competitors alternatives substitutes companies pricing ${l}`},
 {name:'Pricing & willingness to pay',category:'monetization',sourceType:'PRICING',query:(i,c,l)=>`"${i}" pricing customers pay subscription cost willingness to pay ${c} ${l}`},
 {name:'Risks & regulation',category:'risk',sourceType:'RISK',query:(i,c,l)=>`"${i}" risks regulation privacy security fraud barriers ${l}`},
]

const clean=(s:string)=>s.replace(/\s+/g,' ').trim()
const validUrl=(u:any)=>typeof u==='string'&&/^https?:\/\//i.test(u)
const polarity=(lane:Lane,text:string):'positive'|'negative'|'neutral'|'mixed'=>{const t=text.toLowerCase();if(lane.category==='competition')return'negative';if(lane.category==='risk')return'negative';if(lane.category==='demand'||lane.category==='problem'||lane.category==='acquisition')return'positive';if(lane.category==='monetization')return /pay|paid|price|pricing|cost|revenue|subscription|orders|sales/.test(t)?'positive':'neutral';return'neutral'}
const freshness=(date?:string):Evidence['freshness']=>{if(!date)return'unknown';const t=new Date(date).getTime();if(!Number.isFinite(t))return'unknown';const age=(Date.now()-t)/86400000;return age<=30?'fresh':age<=180?'recent':age<=730?'stale':'stale'}

export async function researchIdea(idea:string,customer:string,location:string){
 const out:Evidence[]=[]
 const run=async(l:Lane)=>{
  const q=l.query(idea,customer,location)
  if(env('EXA_API_KEY'))try{
   const body:any={query:q,numResults:6,contents:{highlights:{maxCharacters:1400}}}
   if(l.domains)body.includeDomains=l.domains
   if(l.fresh)body.startPublishedDate=new Date(Date.now()-90*86400000).toISOString()
   const x=await post('https://api.exa.ai/search',body,{'x-api-key':env('EXA_API_KEY')!})
   for(const r of x.results||[])out.push({category:l.category,lane:l.name,claim:clean(r.highlights?.[0]||r.title||'').slice(0,500),sourceUrl:validUrl(r.url)?r.url:undefined,sourceName:r.title,sourceType:l.sourceType,polarity:polarity(l,`${r.title} ${(r.highlights||[]).join(' ')}`),strength:Math.round(Math.max(.35,Math.min(1,r.score||.55))*100)*(l.weight||1),excerpt:clean((r.highlights||[]).join(' ')).slice(0,1100),publishedAt:r.publishedDate,retrievedAt:new Date().toISOString(),freshness:freshness(r.publishedDate),sourcePublisher:r.author||undefined})
  }catch(err){console.error(`VentureProof Exa ${l.name} failed:`,err instanceof Error?err.message:'unknown')}
  if(env('TAVILY_API_KEY'))try{
   const body:any={query:q,max_results:6,search_depth:'advanced',include_raw_content:false}
   if(l.domains)body.include_domains=l.domains
   const x=await post('https://api.tavily.com/search',body,{authorization:`Bearer ${env('TAVILY_API_KEY')!}`})
   for(const r of x.results||[])out.push({category:l.category,lane:l.name,claim:clean(r.content||r.title||'').slice(0,500),sourceUrl:validUrl(r.url)?r.url:undefined,sourceName:r.title,sourceType:l.sourceType,polarity:polarity(l,`${r.title} ${(r.highlights||[]).join(' ')}`),strength:Math.round(Math.max(.35,Math.min(1,r.score||.55))*100)*(l.weight||1),excerpt:clean(r.content||'').slice(0,1100),publishedAt:r.published_date,retrievedAt:new Date().toISOString(),freshness:freshness(r.published_date)})
  }catch(err){console.error(`VentureProof Tavily ${l.name} failed:`,err instanceof Error?err.message:'unknown')}
 }
 await Promise.all(lanes.map(run))
 const seen=new Set<string>();
 return out.filter(e=>validUrl(e.sourceUrl)&&!seen.has(e.sourceUrl)&&(seen.add(e.sourceUrl),true)).slice(0,90)
}
