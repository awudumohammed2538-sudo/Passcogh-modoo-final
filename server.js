
const express=require("express"),fs=require("fs"),path=require("path");
const app=express(),PORT=process.env.PORT||10000,DATA=path.join(__dirname,"data");
const R=JSON.parse(fs.readFileSync(path.join(DATA,"registry.json")));
const read=(f,d)=>{try{return JSON.parse(fs.readFileSync(path.join(DATA,f),"utf8"))}catch{return d}};
app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(__dirname,"public"),{maxAge:"1h"}));

app.get("/api/health",(q,s)=>s.json({ok:true,app:R.brand.name,version:"3.0.0"}));
app.get("/api/registry",(q,s)=>s.json(R));
app.get("/api/curriculum",(q,s)=>{
 let d=read("curriculum.json",{generated:false,documents:[]});
 let a=d.documents||[];
 if(q.query.level)a=a.filter(x=>x.level.toLowerCase()===q.query.level.toLowerCase());
 if(q.query.subject)a=a.filter(x=>x.subject.toLowerCase().includes(q.query.subject.toLowerCase()));
 s.json({generated:d.generated||false,count:a.length,documents:a});
});
app.get("/api/institutions",(q,s)=>s.json(read("institutions.json",{source:R.officialSources.gtecAccreditation,institutions:[],message:"Load/refresh verified GTEC data before publication."})));
app.get("/api/ad-config",(q,s)=>s.json({
 enabled:true,intervalMinutes:15,placement:"safe study breaks",
 suppressDuringQuiz:true,suppressDuringExam:true,
 note:"Replace the demo ad slot with a licensed ad provider before monetisation."
}));
app.post("/api/finder",(q,s)=>{
 const g=q.body.grades||{}, interests=q.body.interests||[];
 const points=v=>({A1:1,B2:2,B3:3,C4:4,C5:5,C6:6,D7:7,E8:8,F9:9}[v]||9);
 const vals=Object.values(g).filter(Boolean); const aggregate=vals.reduce((a,v)=>a+points(v),0);
 const out=[];
 const add=(name,programmes,why)=>out.push({name,programmes,why});
 if(interests.includes("Health")||["Biology","Chemistry"].some(x=>Object.keys(g).includes(x))) add("Health & Biomedical Sciences",["Medicine","Nursing","Pharmacy","Medical Laboratory Science","Biomedical Science"],"Strong science preparation is commonly relevant; verify each programme's current requirements.");
 if(interests.includes("Engineering")||["Physics","Chemistry","Additional Mathematics"].some(x=>Object.keys(g).includes(x))) add("Engineering & Technology",["Civil Engineering","Mechanical Engineering","Electrical/Electronic Engineering","Mechatronics","Chemical Engineering"],"Mathematics and science preparation are commonly relevant; verify exact requirements.");
 if(interests.includes("Computing")||Object.keys(g).includes("Computing")) add("Computing & Digital",["Computer Science","Information Technology","Software-related programmes","Data-related programmes"],"Check the exact Mathematics and programme requirements.");
 if(interests.includes("Business")) add("Business",["Accounting","Finance","Economics","Marketing","Management"],"Compare programme requirements and career outcomes.");
 if(interests.includes("Law & Governance")) add("Law & Governance",["Law","Political Science","Public Administration","International Relations"],"Check exact institutional entry requirements.");
 if(!out.length)add("Explore your strongest pathway",["Science","Technology","Business","Education","Humanities","Agriculture","Creative fields"],"Use your results, interests and verified requirements to narrow the choice.");
 s.json({aggregate,results:out,disclaimer:"Guidance only; not an admission guarantee. Verify current requirements, cut-offs, fees, deadlines and accreditation with the institution/GTEC."});
});
app.get("*",(q,s)=>s.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("PASSCOGH-MODOO FINAL MASTER running on "+PORT));
