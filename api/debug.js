import { kv } from '@vercel/kv'
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*')
  try {
    const keys = await kv.keys('vx_*')
    const sample=[]
    for(let k of keys.slice(0,10)){const v=await kv.get(k);sample.push({key:k,length:typeof v==='string'?v.length:0,preview:(typeof v==='string'?v:String(v)).slice(0,80)})}
    return res.status(200).json({total:keys.length,keys:keys.slice(0,50),sample})
  }catch(e){return res.status(500).json({error:e.message})}
}
