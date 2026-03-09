import { useState, useEffect, useCallback } from "react";

const FB_KEY  = "AIzaSyCHI8sZPwtnwNON65fFOJxzremsMp6hc88";
const FB_PROJ = "wannar-app";
const BASE    = `https://firestore.googleapis.com/v1/projects/${FB_PROJ}/databases/(default)/documents`;
const SESSION_UID  = Math.random().toString(36).slice(2,14);
const ADMIN_SECRET = "wannar2025";

function parseDoc(doc) {
  const id = doc.name.split("/").pop();
  const f  = doc.fields || {};
  return {
    id,
    text:        f.text?.stringValue         || "",
    likes:       parseInt(f.likes?.integerValue     || "0"),
    likedBy:     (f.likedBy?.arrayValue?.values || []).map(v => v.stringValue),
    timestamp:   parseInt(f.timestamp?.integerValue || "0"),
    displayName: f.displayName?.stringValue  || "",
    grade:       f.grade?.stringValue        || "",
    isDeleted:   f.isDeleted?.booleanValue   || false,
  };
}

async function dbFetch() {
  try {
    const r = await fetch(`${BASE}/capsules?key=${FB_KEY}&pageSize=100`);
    const d = await r.json();
    if (!d.documents) return [];
    return d.documents.map(parseDoc).filter(c => !c.isDeleted);
  } catch { return []; }
}

async function dbCreate({ text, displayName, grade }) {
  const r = await fetch(`${BASE}/capsules?key=${FB_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: {
      text:        { stringValue: text },
      likes:       { integerValue: "0" },
      likedBy:     { arrayValue: { values: [] } },
      timestamp:   { integerValue: Date.now().toString() },
      displayName: { stringValue: displayName || "" },
      grade:       { stringValue: grade },
      isDeleted:   { booleanValue: false },
    }}),
  });
  return parseDoc(await r.json());
}

async function dbLike(id, likes, likedBy) {
  await fetch(
    `${BASE}/capsules/${id}?updateMask.fieldPaths=likes&updateMask.fieldPaths=likedBy&key=${FB_KEY}`,
    { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ fields: {
        likes:   { integerValue: likes.toString() },
        likedBy: { arrayValue: { values: likedBy.map(u=>({stringValue:u})) } },
      }}),
    }
  );
}

async function dbDelete(id) {
  await fetch(
    `${BASE}/capsules/${id}?updateMask.fieldPaths=isDeleted&key=${FB_KEY}`,
    { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ fields: { isDeleted:{ booleanValue:true } } }),
    }
  );
}

const BANNED   = ["سبام","spam","xxx"];
const MAX_CHARS= 150;
const GRADES   = ["9","10","11","12"];
const GC       = {"9":"#007B7F","10":"#00838f","11":"#0097a7","12":"#00acc1"};

function hasBad(t){ return BANNED.some(w=>t.toLowerCase().includes(w.toLowerCase())); }

function tTheme(likes){
  if(likes>=200) return {c:"#00fff7",s:"0 0 30px #00fff7,0 0 60px #00fff788",lbl:"🏆 أسطوري"};
  if(likes>=100) return {c:"#00e5d4",s:"0 0 20px #00e5d4,0 0 40px #00e5d444",lbl:"⭐ متقدم"};
  if(likes>=50)  return {c:"#00bcd4",s:"0 0 12px #00bcd4aa",lbl:"🌿 نامٍ"};
  if(likes>=20)  return {c:"#007B7F",s:"0 0 6px #007B7F88",lbl:"🌱 ناشئ"};
  return               {c:"#005255",s:"none",lbl:"💡 بداية"};
}

function Burst({x,y,onDone}){
  const pts=Array.from({length:10},(_,i)=>({id:i,a:(i/10)*360,d:28+Math.random()*36,sz:3+Math.random()*4}));
  useEffect(()=>{const t=setTimeout(onDone,800);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",left:x,top:y,pointerEvents:"none",zIndex:9999}}>
      {pts.map(p=>(
        <div key={p.id} style={{position:"absolute",width:p.sz,height:p.sz,borderRadius:"50%",background:"radial-gradient(circle,#00fff7,#00bcd4)",boxShadow:"0 0 6px #00fff7",animation:"wBurst .8s ease-out forwards","--a":`${p.a}deg`,"--d":`${p.d}px`,transform:"translate(-50%,-50%)"}}/>
      ))}
    </div>
  );
}

function Tower({likes}){
  const{c,s,lbl}=tTheme(likes);
  const floors=Math.max(1,Math.min(10,1+Math.floor(likes/28)));
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <span style={{fontSize:11,color:c,letterSpacing:2,opacity:.8,fontFamily:"'The Year of the Camel',serif"}}>برج المعرفة</span>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{width:2,height:18,background:c,boxShadow:s,borderRadius:1}}/>
        <div style={{width:7,height:7,borderRadius:"50%",background:c,boxShadow:s,marginBottom:3}}/>
        {Array.from({length:floors},(_,i)=>{
          const w=28+(floors-i-1)*10;
          return(<div key={i} style={{width:w,height:18,marginBottom:2,background:`linear-gradient(180deg,${c}22,${c}66)`,border:`1px solid ${c}`,boxShadow:s,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
            {i<2&&<><div style={{width:4,height:8,background:c,opacity:.5,borderRadius:1}}/><div style={{width:3,height:6,background:c,opacity:.35,borderRadius:1}}/></>}
          </div>);
        })}
        <div style={{width:64,height:8,background:`linear-gradient(180deg,${c}44,${c}11)`,border:`1px solid ${c}33`,borderRadius:"0 0 4px 4px"}}/>
        <div style={{width:90,height:5,background:`radial-gradient(ellipse,${c}33,transparent)`,marginTop:2}}/>
      </div>
      <span style={{fontSize:22,fontWeight:900,color:c,textShadow:s,fontFamily:"'The Year of the Camel',serif"}}>{likes}</span>
      <span style={{fontSize:11,color:c,border:`1px solid ${c}55`,padding:"2px 10px",borderRadius:10,background:`${c}11`,fontFamily:"'Tajawal',sans-serif"}}>{lbl}</span>
    </div>
  );
}

function Card({cap,onLike,onDelete,isAdmin,idx}){
  const[hov,setHov]=useState(false);
  const liked=cap.likedBy.includes(SESSION_UID);
  const tier=cap.likes>=200?"leg":cap.likes>=100?"hot":cap.likes>=50?"warm":"base";
  const ts={
    leg:{br:"#00fff7",bg:"linear-gradient(135deg,#00fff711,#006064aa)",sh:"0 0 22px #00fff722"},
    hot:{br:"#00e5d4",bg:"linear-gradient(135deg,#00e5d411,#005f6488)",sh:"0 0 12px #00e5d411"},
    warm:{br:"#007B7F88",bg:"linear-gradient(135deg,#00121466,#001a1e88)",sh:"none"},
    base:{br:"#00606488",bg:"linear-gradient(135deg,#00121455,#001a1e77)",sh:"none"},
  }[tier];
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:hov?"linear-gradient(135deg,#00606422,#001a1eaa)":ts.bg,border:`1px solid ${hov?"#00e5d4":ts.br}`,borderRadius:16,padding:"18px 20px",direction:"rtl",boxShadow:hov?"0 8px 40px #00606444":ts.sh,transform:hov?"translateY(-4px)":"translateY(0)",transition:"all .35s ease",position:"relative",overflow:"hidden",animation:`wIn .5s ease ${idx*.08}s both`}}>
      {tier==="leg"&&<div style={{position:"absolute",top:0,left:"10%",right:"10%",height:1,background:"linear-gradient(90deg,transparent,#00fff7,transparent)"}}/>}
      {cap.grade&&<span style={{position:"absolute",top:12,left:14,fontSize:10,fontWeight:700,background:GC[cap.grade]||"#007B7F",color:"#fff",padding:"2px 8px",borderRadius:8,fontFamily:"'Tajawal',sans-serif"}}>ص {cap.grade}</span>}
      {cap.likes>=100&&<span style={{position:"absolute",top:10,right:12,fontSize:14}}>{cap.likes>=200?"🏆":"⭐"}</span>}
      <p style={{fontSize:14,color:"#b2dfdb",lineHeight:1.85,margin:"6px 0 14px",fontFamily:"'Tajawal',sans-serif",paddingLeft:cap.grade?36:0,paddingRight:22}}>{cap.text}</p>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={e=>onLike(cap.id,e)} style={{display:"flex",alignItems:"center",gap:5,background:liked?"linear-gradient(135deg,#006064,#00838f)":"transparent",border:`1px solid ${liked?"#00bcd4":"#006064"}`,borderRadius:20,padding:"5px 14px",cursor:"pointer",color:liked?"#00fff7":"#4db6ac",fontSize:13,fontFamily:"'Tajawal',sans-serif",transition:"all .2s",boxShadow:liked?"0 0 10px #00606444":"none"}}>
            <span style={{fontSize:15}}>{liked?"⚡":"🤍"}</span><span>{cap.likes}</span>
          </button>
          {isAdmin&&<button onClick={()=>onDelete(cap.id)} style={{background:"transparent",border:"1px solid #ef535055",borderRadius:20,padding:"5px 12px",cursor:"pointer",color:"#ef9a9a",fontSize:12,fontFamily:"'Tajawal',sans-serif",transition:"all .2s"}}>🗑 حذف</button>}
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
          {cap.displayName&&<span style={{fontSize:11,color:"#4db6ac",opacity:.7,fontFamily:"'Tajawal',sans-serif"}}>👤 {cap.displayName}</span>}
          <div style={{display:"flex",gap:3}}>{Array.from({length:Math.min(5,Math.floor(cap.likes/20))},(_,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#007B7F",boxShadow:"0 0 4px #00bcd4"}}/>)}</div>
        </div>
      </div>
    </div>
  );
}

function SubmitModal({onClose,onSubmit,lastSubmit}){
  const[text,setText]=useState("");
  const[name,setName]=useState("");
  const[showName,setShowName]=useState(false);
  const[grade,setGrade]=useState("");
  const[err,setErr]=useState("");
  const[done,setDone]=useState(false);
  const[busy,setBusy]=useState(false);
  const rem=MAX_CHARS-text.length;
  const canPost=!lastSubmit||Date.now()-lastSubmit>24*3600*1000;
  const submit=async()=>{
    if(!canPost)return setErr("يمكنك النشر مرة واحدة كل 24 ساعة.");
    if(text.trim().length<20)return setErr("الكبسولة قصيرة جداً، أضف المزيد.");
    if(!grade)return setErr("اختر صفك الدراسي أولاً.");
    if(hasBad(text))return setErr("يحتوي النص على كلمات غير مناسبة.");
    setBusy(true);
    try{await onSubmit({text:text.trim(),displayName:showName?name.trim():"",grade});setDone(true);setTimeout(onClose,1400);}
    catch{setErr("حدث خطأ أثناء النشر، حاول مجدداً.");}
    setBusy(false);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"#00030899",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"linear-gradient(135deg,#001a1e,#002428)",border:"1px solid #007B7F",borderRadius:24,padding:32,width:"92%",maxWidth:490,direction:"rtl",boxShadow:"0 30px 80px #00000088",animation:"wSlide .4s cubic-bezier(.34,1.56,.64,1)"}}>
        {!done?(
          <>
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{fontSize:34,marginBottom:6}}>🧬</div>
              <h2 style={{color:"#00bcd4",fontFamily:"'The Year of the Camel',serif",fontSize:20,margin:0}}>زكاة علمك في ساحة ونار</h2>
              <p style={{color:"#4db6ac",fontSize:13,margin:"7px 0 0",fontFamily:"'Tajawal',sans-serif"}}>شارك أفضل ما تعلمته — مجهول أو بالاسم، الخيار لك</p>
            </div>
            <p style={{color:"#4db6ac",fontSize:12,marginBottom:8,fontFamily:"'Tajawal',sans-serif"}}>الصف الدراسي *</p>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {GRADES.map(g=>(
                <button key={g} onClick={()=>setGrade(g)} style={{flex:1,padding:"9px 0",background:grade===g?GC[g]:"transparent",border:`1px solid ${grade===g?GC[g]:"#006064"}`,borderRadius:10,color:grade===g?"#fff":"#4db6ac",fontSize:14,fontFamily:"'Tajawal',sans-serif",cursor:"pointer",boxShadow:grade===g?`0 0 12px ${GC[g]}55`:"none",transition:"all .2s"}}>ص {g}</button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <button onClick={()=>setShowName(p=>!p)} style={{width:40,height:22,borderRadius:11,background:showName?"linear-gradient(90deg,#007B7F,#00838f)":"#001215",border:"1px solid #007B7F",cursor:"pointer",position:"relative",transition:"all .3s"}}>
                <div style={{position:"absolute",top:2,width:16,height:16,borderRadius:"50%",background:showName?"#fff":"#4db6ac",transition:"all .3s",left:showName?20:2}}/>
              </button>
              <span style={{color:"#4db6ac",fontSize:13,fontFamily:"'Tajawal',sans-serif"}}>{showName?"ظهور الاسم مفعّل":"مجهول الهوية (الافتراضي)"}</span>
            </div>
            {showName&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="اكتب اسمك (اختياري)" style={{width:"100%",background:"#001215",border:"1px solid #006064",borderRadius:10,padding:"10px 14px",color:"#b2dfdb",fontFamily:"'Tajawal',sans-serif",fontSize:13,outline:"none",marginBottom:10,boxSizing:"border-box"}}/>}
            <textarea value={text} onChange={e=>{setText(e.target.value.slice(0,MAX_CHARS));setErr("");}} placeholder="اكتب ملخصاً علمياً موجزاً... مثال: اكتشفت أن الذاكرة..." style={{width:"100%",minHeight:110,background:"#001215",border:`1px solid ${err?"#ef5350":"#006064"}`,borderRadius:12,padding:14,color:"#b2dfdb",fontFamily:"'Tajawal',sans-serif",fontSize:14,lineHeight:1.8,resize:"none",outline:"none",boxSizing:"border-box"}}/>
            <div style={{display:"flex",justifyContent:"space-between",margin:"6px 0 16px"}}>
              <span style={{color:"#ef9a9a",fontSize:12,fontFamily:"'Tajawal',sans-serif"}}>{err&&`⚠️ ${err}`}</span>
              <span style={{color:rem<20?"#ef5350":"#4db6ac",fontSize:12,fontFamily:"'Tajawal',sans-serif"}}>{rem} متبقٍ</span>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={submit} disabled={busy} style={{flex:1,padding:"12px 0",background:busy?"#003b3f":"linear-gradient(135deg,#007B7F,#00838f)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontFamily:"'The Year of the Camel',serif",cursor:busy?"not-allowed":"pointer",boxShadow:"0 4px 20px #007B7F44",transition:"transform .2s"}}>{busy?"⏳ جاري النشر...":"⚡ نشر في ساحة ونار"}</button>
              <button onClick={onClose} style={{padding:"12px 20px",background:"transparent",border:"1px solid #006064",borderRadius:12,color:"#4db6ac",fontSize:15,fontFamily:"'Tajawal',sans-serif",cursor:"pointer"}}>إلغاء</button>
            </div>
          </>
        ):(
          <div style={{textAlign:"center",padding:"28px 0"}}>
            <div style={{fontSize:52,animation:"wBounce .6s ease"}}>🚀</div>
            <h3 style={{color:"#00fff7",fontFamily:"'The Year of the Camel',serif",textShadow:"0 0 20px #00fff7"}}>تم نشر كبسولتك!</h3>
            <p style={{color:"#4db6ac",fontFamily:"'Tajawal',sans-serif",fontSize:13}}>ستظهر في ساحة ونار الآن ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminModal({onClose,onLogin}){
  const[pw,setPw]=useState(""); const[err,setErr]=useState("");
  return(
    <div style={{position:"fixed",inset:0,background:"#00030899",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"linear-gradient(135deg,#0d0000,#1a0008)",border:"1px solid #b7273355",borderRadius:20,padding:32,width:320,direction:"rtl",boxShadow:"0 20px 60px #00000099",animation:"wSlide .4s ease"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:34,marginBottom:6}}>🛡</div>
          <h2 style={{color:"#ef9a9a",fontFamily:"'The Year of the Camel',serif",fontSize:18,margin:0}}>لوحة المسؤول</h2>
          <p style={{color:"#ef9a9a88",fontSize:12,fontFamily:"'Tajawal',sans-serif",margin:"6px 0 0"}}>أدخل كلمة المرور للمتابعة</p>
        </div>
        <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder="كلمة المرور" style={{width:"100%",background:"#0d0000",border:`1px solid ${err?"#ef5350":"#b7273344"}`,borderRadius:10,padding:"11px 14px",color:"#ef9a9a",fontFamily:"'Tajawal',sans-serif",fontSize:14,outline:"none",marginBottom:10,boxSizing:"border-box"}}/>
        {err&&<p style={{color:"#ef9a9a",fontSize:12,margin:"0 0 10px",fontFamily:"'Tajawal',sans-serif"}}>⚠️ {err}</p>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>pw===ADMIN_SECRET?onLogin():setErr("كلمة المرور غير صحيحة.")} style={{flex:1,padding:"11px 0",background:"linear-gradient(135deg,#7f1d1d,#b91c1c)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontFamily:"'Tajawal',sans-serif",cursor:"pointer"}}>دخول 🔓</button>
          <button onClick={onClose} style={{padding:"11px 16px",background:"transparent",border:"1px solid #b7273344",borderRadius:10,color:"#ef9a9a",fontFamily:"'Tajawal',sans-serif",cursor:"pointer"}}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function WannarColony(){
  const[caps,setCaps]=useState([]);
  const[view,setView]=useState("colony");
  const[modal,setModal]=useState(null);
  const[isAdmin,setIsAdmin]=useState(false);
  const[bursts,setBursts]=useState([]);
  const[sort,setSort]=useState("top");
  const[gFilter,setGFilter]=useState("all");
  const[lastPost,setLastPost]=useState(null);
  const[loading,setLoading]=useState(true);

  const myLikes=caps.reduce((a,c)=>c.likedBy.includes(SESSION_UID)?a+c.likes:a,0);

  const load=useCallback(async()=>{
    const docs=await dbFetch();
    setCaps(docs);
    setLoading(false);
  },[]);

  useEffect(()=>{load();const t=setInterval(load,15000);return()=>clearInterval(t);},[load]);

  const displayed=caps
    .filter(c=>gFilter==="all"||c.grade===gFilter)
    .sort((a,b)=>sort==="top"?b.likes-a.likes:b.timestamp-a.timestamp);

  const handleLike=useCallback(async(id,e)=>{
    const r=e.currentTarget.getBoundingClientRect();
    const pid=Date.now();
    setBursts(p=>[...p,{id:pid,x:r.left+r.width/2,y:r.top+r.height/2}]);
    setCaps(prev=>prev.map(c=>{
      if(c.id!==id)return c;
      const already=c.likedBy.includes(SESSION_UID);
      const nLiked=already?c.likedBy.filter(u=>u!==SESSION_UID):[...c.likedBy,SESSION_UID];
      const nLikes=already?c.likes-1:c.likes+1;
      dbLike(c.id,nLikes,nLiked);
      return{...c,likes:nLikes,likedBy:nLiked};
    }));
  },[]);

  const handleDelete=useCallback(async(id)=>{
    if(!confirm("هل تريد حذف هذه الكبسولة؟"))return;
    await dbDelete(id);
    setCaps(p=>p.filter(c=>c.id!==id));
  },[]);

  const handleSubmit=useCallback(async(data)=>{
    const newC=await dbCreate(data);
    setCaps(p=>[newC,...p]);
    setLastPost(Date.now());
  },[]);

  const tt=tTheme(myLikes);

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#000d0f 0%,#001215 55%,#000d0f 100%)",fontFamily:"'Tajawal',sans-serif",position:"relative",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=The+Year+of+the+Camel&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#001215}::-webkit-scrollbar-thumb{background:#007B7F;border-radius:2px}
        @keyframes wIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wSlide{from{opacity:0;transform:translateY(28px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes wBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
        @keyframes wGrid{0%{transform:translateY(0)}100%{transform:translateY(44px)}}
        @keyframes wFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes wGlow{0%,100%{box-shadow:0 0 8px #007B7F44}50%{box-shadow:0 0 22px #00bcd466}}
        @keyframes wSpin{to{transform:rotate(360deg)}}
        @keyframes wBurst{0%{transform:translate(-50%,-50%) rotate(var(--a)) translateY(0);opacity:1}100%{transform:translate(-50%,-50%) rotate(var(--a)) translateY(calc(-1*var(--d)));opacity:0}}
        button:active{transform:scale(.97)!important}
      `}</style>

      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"linear-gradient(rgba(0,123,127,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,123,127,.06) 1px,transparent 1px)",backgroundSize:"44px 44px",animation:"wGrid 9s linear infinite"}}/>
      <div style={{position:"fixed",top:"8%",right:"3%",width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle,#007B7F1a,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",left:"3%",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,#00bcd40e,transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {bursts.map(b=><Burst key={b.id} x={b.x} y={b.y} onDone={()=>setBursts(p=>p.filter(x=>x.id!==b.id))}/>)}
      {modal==="submit"&&<SubmitModal onClose={()=>setModal(null)} onSubmit={handleSubmit} lastSubmit={lastPost}/>}
      {modal==="admin" &&<AdminModal  onClose={()=>setModal(null)} onLogin={()=>{setIsAdmin(true);setModal(null);}}/>}

      <header style={{position:"sticky",top:0,zIndex:100,background:"linear-gradient(180deg,#00080aee,#001215dd)",backdropFilter:"blur(24px)",borderBottom:"1px solid #007B7F44"}}>
        <div style={{maxWidth:940,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:66,padding:"0 20px",direction:"rtl"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:42,height:42,borderRadius:13,background:"linear-gradient(135deg,#007B7F,#005f64)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 18px #007B7F77",flexShrink:0}}>🔥</div>
            <div>
              <div style={{color:"#fff",fontSize:19,fontWeight:900,lineHeight:1,letterSpacing:1,fontFamily:"'The Year of the Camel',serif"}}>وَنَّار</div>
              <div style={{color:"#4db6ac",fontSize:10,opacity:.65,fontFamily:"'Tajawal',sans-serif"}}>نتعب اليوم لنضيء غداً</div>
            </div>
          </div>
          <div style={{display:"flex",gap:5}}>
            {[{id:"colony",l:"🌐 ساحة ونار"},{id:"profile",l:"🏗 برجي"}].map(t=>(
              <button key={t.id} onClick={()=>setView(t.id)} style={{padding:"7px 15px",borderRadius:20,border:view===t.id?"1px solid #00bcd4":"1px solid transparent",background:view===t.id?"#007B7F33":"transparent",color:view===t.id?"#00bcd4":"#4db6ac",fontSize:13,cursor:"pointer",fontFamily:"'Tajawal',sans-serif",boxShadow:view===t.id?"0 0 12px #007B7F33":"none",transition:"all .2s"}}>{t.l}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:7,background:"#001a1e",border:"1px solid #007B7F",borderRadius:20,padding:"5px 14px",animation:"wGlow 3s ease infinite"}}>
              <span style={{color:tt.c,fontSize:12,fontFamily:"'Tajawal',sans-serif",textShadow:tt.s}}>⚡ {myLikes}</span>
            </div>
            <button onClick={()=>isAdmin?setIsAdmin(false):setModal("admin")} style={{padding:"6px 12px",borderRadius:20,background:isAdmin?"linear-gradient(135deg,#7f1d1d,#991b1b)":"transparent",border:`1px solid ${isAdmin?"#ef535055":"#007B7F44"}`,color:isAdmin?"#ef9a9a":"#4db6ac",fontSize:12,cursor:"pointer",fontFamily:"'Tajawal',sans-serif",transition:"all .2s"}}>{isAdmin?"🛡 مسؤول":"🔑"}</button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:940,margin:"0 auto",padding:"24px 16px",position:"relative",zIndex:1}}>

        {view==="colony"&&(
          <div style={{direction:"rtl"}}>
            <div style={{background:"linear-gradient(135deg,#001a1e,#002428)",border:"1px solid #007B7F",borderRadius:20,padding:"26px 24px",marginBottom:22,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#00bcd4,transparent)"}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                <div>
                  <h1 style={{color:"#fff",fontSize:22,fontWeight:900,marginBottom:5,fontFamily:"'The Year of the Camel',serif",textShadow:"0 0 20px #007B7F88"}}>🌐 ساحة ونار</h1>
                  <p style={{color:"#4db6ac",fontSize:13,opacity:.8,fontFamily:"'Tajawal',sans-serif"}}>{caps.length} كبسولة معرفية · مجهولة أو بالاسم · تفاعل وانمُ</p>
                </div>
                <button onClick={()=>setModal("submit")} style={{padding:"11px 22px",background:"linear-gradient(135deg,#007B7F,#00838f)",border:"none",borderRadius:14,color:"#fff",fontSize:14,fontFamily:"'The Year of the Camel',serif",cursor:"pointer",boxShadow:"0 4px 20px #007B7F44",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>🧬 نشر كبسولة</button>
              </div>
              <div style={{display:"flex",gap:24,marginTop:18,paddingTop:14,borderTop:"1px solid #007B7F33",flexWrap:"wrap"}}>
                {[{l:"إجمالي التفاعلات",v:caps.reduce((a,c)=>a+c.likes,0)},{l:"كبسولات نشطة",v:caps.length},{l:"أعلى تفاعل",v:caps.length?Math.max(...caps.map(c=>c.likes)):0}].map(s=>(
                  <div key={s.l}>
                    <div style={{color:"#00bcd4",fontSize:20,fontWeight:700,fontFamily:"'The Year of the Camel',serif"}}>{s.v.toLocaleString()}</div>
                    <div style={{color:"#4db6ac",fontSize:11,opacity:.7,fontFamily:"'Tajawal',sans-serif"}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin&&(
              <div style={{background:"linear-gradient(135deg,#1a0000,#200008)",border:"1px solid #ef535066",borderRadius:12,padding:"11px 16px",marginBottom:16,direction:"rtl",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>🛡</span>
                <span style={{color:"#ef9a9a",fontFamily:"'Tajawal',sans-serif",fontSize:13}}>وضع المسؤول مفعّل — يمكنك حذف أي كبسولة غير لائقة</span>
              </div>
            )}

            <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
              {[{id:"top",l:"🔥 الأعلى"},{id:"new",l:"🆕 الأحدث"}].map(s=>(
                <button key={s.id} onClick={()=>setSort(s.id)} style={{padding:"7px 14px",borderRadius:20,border:sort===s.id?"1px solid #00bcd4":"1px solid #007B7F",background:sort===s.id?"#007B7F":"transparent",color:sort===s.id?"#fff":"#4db6ac",fontSize:12,cursor:"pointer",fontFamily:"'Tajawal',sans-serif",transition:"all .2s"}}>{s.l}</button>
              ))}
              <div style={{width:1,background:"#007B7F44",margin:"0 4px"}}/>
              {["all",...GRADES].map(g=>(
                <button key={g} onClick={()=>setGFilter(g)} style={{padding:"7px 14px",borderRadius:20,border:gFilter===g?`1px solid ${GC[g]||"#00bcd4"}`:"1px solid #007B7F44",background:gFilter===g?(GC[g]||"#007B7F"):"transparent",color:gFilter===g?"#fff":"#4db6ac",fontSize:12,cursor:"pointer",fontFamily:"'Tajawal',sans-serif",transition:"all .2s"}}>
                  {g==="all"?"الكل":`ص ${g}`}
                </button>
              ))}
            </div>

            {loading&&(
              <div style={{textAlign:"center",padding:60,color:"#4db6ac",fontFamily:"'Tajawal',sans-serif"}}>
                <div style={{width:36,height:36,border:"3px solid #007B7F44",borderTop:"3px solid #00bcd4",borderRadius:"50%",margin:"0 auto 14px",animation:"wSpin 1s linear infinite"}}/>
                <p>جاري تحميل الكبسولات...</p>
              </div>
            )}

            {!loading&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                {displayed.map((c,i)=><Card key={c.id} cap={c} idx={i} onLike={handleLike} onDelete={handleDelete} isAdmin={isAdmin}/>)}
              </div>
            )}

            {!loading&&displayed.length===0&&(
              <div style={{textAlign:"center",padding:60,color:"#4db6ac",fontFamily:"'Tajawal',sans-serif"}}>
                <div style={{fontSize:48,marginBottom:12}}>🌌</div>
                <p>لا توجد كبسولات بعد — كن أول من يُضيء الساحة!</p>
              </div>
            )}
          </div>
        )}

        {view==="profile"&&(
          <div style={{direction:"rtl"}}>
            <div style={{background:"linear-gradient(135deg,#001a1e,#002428)",border:"1px solid #007B7F",borderRadius:20,padding:"28px 24px",marginBottom:22,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#00bcd4,transparent)"}}/>
              <h1 style={{color:"#fff",fontSize:21,fontWeight:900,marginBottom:4,fontFamily:"'The Year of the Camel',serif"}}>🏗 برج معرفتك</h1>
              <p style={{color:"#4db6ac",fontSize:13,opacity:.7,marginBottom:26,fontFamily:"'Tajawal',sans-serif"}}>ينمو برجك مع كل إعجاب تحصل عليه في ساحة ونار</p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:60,padding:"28px 0",background:"linear-gradient(180deg,transparent,#000d0f33)",borderRadius:16,border:"1px solid #007B7F22",position:"relative",flexWrap:"wrap"}}>
                <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(0,123,127,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,123,127,.04) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none",borderRadius:16}}/>
                <div style={{animation:"wFloat 4s ease-in-out infinite"}}><Tower likes={myLikes}/></div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {[{th:20,l:"ناشئ",i:"🌱"},{th:50,l:"نامٍ",i:"🌿"},{th:100,l:"متقدم",i:"🌳"},{th:200,l:"أسطوري",i:"🏆"}].map(lv=>{
                    const ok=myLikes>=lv.th;
                    return(
                      <div key={lv.th} style={{display:"flex",alignItems:"center",gap:10,opacity:ok?1:.35,transition:"opacity .4s"}}>
                        <div style={{width:30,height:30,borderRadius:"50%",border:`2px solid ${ok?"#00bcd4":"#007B7F"}`,background:ok?"#007B7F":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:ok?"0 0 10px #007B7F55":"none",transition:"all .4s"}}>{lv.i}</div>
                        <div>
                          <div style={{color:ok?"#00bcd4":"#4db6ac",fontSize:13,fontFamily:"'Tajawal',sans-serif"}}>{lv.l}</div>
                          <div style={{color:"#4db6ac",fontSize:10,opacity:.6,fontFamily:"'Tajawal',sans-serif"}}>{lv.th} إعجاب</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {(()=>{
                const lvls=[20,50,100,200,300];
                const next=lvls.find(l=>l>myLikes)||300;
                const prev=lvls[lvls.indexOf(next)-1]||0;
                const pct=Math.min(((myLikes-prev)/(next-prev))*100,100);
                return(
                  <div style={{marginTop:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                      <span style={{color:"#4db6ac",fontSize:12,fontFamily:"'Tajawal',sans-serif"}}>{myLikes>=200?"🏆 المستوى الأسطوري!":`${next-myLikes} إعجاب للمستوى التالي`}</span>
                      <span style={{color:"#00bcd4",fontSize:12,fontFamily:"'Tajawal',sans-serif"}}>{Math.round(pct)}%</span>
                    </div>
                    <div style={{height:7,background:"#001215",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#007B7F,#00bcd4)",borderRadius:4,boxShadow:"0 0 10px #00bcd444",transition:"width .8s ease"}}/>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12}}>
              {[{i:"🧬",t:"انشر كبسولة",d:"شارك ما تعلمته لتكسب إعجابات وتنمي برجك"},{i:"⭐",t:"اهتم بالجودة",d:"الكبسولات المميزة تجذب أكثر التفاعلات"},{i:"⏰",t:"كبسولة يومياً",d:"يمكنك نشر كبسولة واحدة كل 24 ساعة"},{i:"🌐",t:"تفاعل مع الآخرين",d:"أعجب بكبسولات زملائك وادعم نمو الجميع"}].map(tip=>(
                <div key={tip.t} style={{background:"linear-gradient(135deg,#001215,#001a1e)",border:"1px solid #007B7F44",borderRadius:14,padding:"16px 18px",direction:"rtl"}}>
                  <div style={{fontSize:24,marginBottom:8}}>{tip.i}</div>
                  <div style={{color:"#00bcd4",fontSize:14,fontWeight:600,marginBottom:4,fontFamily:"'Tajawal',sans-serif"}}>{tip.t}</div>
                  <div style={{color:"#4db6ac",fontSize:12,opacity:.7,fontFamily:"'Tajawal',sans-serif",lineHeight:1.65}}>{tip.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{textAlign:"center",padding:"20px",color:"#4db6ac",fontSize:12,opacity:.35,fontFamily:"'Tajawal',sans-serif",borderTop:"1px solid #007B7F22",marginTop:40,position:"relative",zIndex:1}}>
        وَنَّار · نتعب اليوم لنضيء غداً 🔥 · الحقوق محفوظة 2026
      </footer>
    </div>
  );
}
