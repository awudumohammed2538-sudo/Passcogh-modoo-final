
const fs=require("fs"),path=require("path"),axios=require("axios"),cheerio=require("cheerio"),pdfParse=require("pdf-parse");
const R=JSON.parse(fs.readFileSync(path.join(__dirname,"..","data","registry.json")));
const pages=[["SHS",R.officialSources.naccaSHS,R.shsSubjects],["JHS",R.officialSources.naccaCCP,R.jhsSubjects]];
const out=[],seen=new Set(),clean=x=>x.replace(/\s+/g," ").trim();
function heads(t){const lines=t.split(/\r?\n/).map(clean).filter(x=>x&&x.length<220);const rx=/^(STRAND|SUB-STRAND|CONTENT STANDARD|LEARNING INDICATOR|EXEMPLAR|UNIT|SECTION)\b/i;return [...new Set(lines.filter(x=>rx.test(x)||/^\d+(\.\d+){0,3}\s+[A-Z]/.test(x)))].slice(0,5000)}
(async()=>{
 for(const [level,page,subjects] of pages){
  const html=(await axios.get(page,{timeout:60000})).data,$=cheerio.load(html);
  const links=[];
  $("a").each((_,a)=>{const h=$(a).attr("href"),t=clean($(a).text());if(!h)return;const u=new URL(h,page).href;if(/\.pdf(\?|$)/i.test(u))links.push({u,t})});
  for(const l of links){if(seen.has(l.u))continue;seen.add(l.u);
   let subject=l.t||"Curriculum document";
   const hit=subjects.find(s=>l.u.toLowerCase().includes(s.toLowerCase().replace(/[^a-z0-9]+/g,"-")));
   if(hit)subject=hit;
   try{const b=(await axios.get(l.u,{responseType:"arraybuffer",timeout:120000})).data,p=await pdfParse(b);
     out.push({level,subject,source:l.u,pages:p.numpages,headings:heads(p.text),words:p.text.split(/\s+/).length});
   }catch(e){out.push({level,subject,source:l.u,error:e.message})}
  }
 }
 fs.writeFileSync(path.join(__dirname,"..","data","curriculum.json"),JSON.stringify({generated:true,generatedAt:new Date().toISOString(),documents:out},null,2));
 console.log("Curriculum documents indexed:",out.length);
})().catch(e=>{console.error(e);process.exit(1)});
