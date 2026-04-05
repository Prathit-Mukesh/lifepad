import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================
// LIFEPAD v3 — Complete Personal Life Dashboard
// ============================================================
const uid = () => Math.random().toString(36).substr(2,9)+Date.now().toString(36);
const td = () => new Date().toISOString().split("T")[0];
const nw = () => new Date().toISOString();
const fmt = d => { if(!d) return ""; return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}); };
const fmtF = d => { if(!d) return ""; return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); };
const cur = n => "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0});
const greet = () => { const h=new Date().getHours(); return h<5?"Good Night":h<12?"Good Morning":h<17?"Good Afternoon":h<21?"Good Evening":"Good Night"; };
const dayN = () => new Date().toLocaleDateString("en-IN",{weekday:"long"});
const dUntil = d => { if(!d) return Infinity; return Math.ceil((new Date(d).setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/864e5); };
const cl = (v,a,b) => Math.max(a,Math.min(b,v));

const SK="lifepad_v3";
const ld=()=>{try{return JSON.parse(localStorage.getItem(SK))}catch{return null}};
const sv=d=>{try{localStorage.setItem(SK,JSON.stringify(d))}catch{}};

// Fonts loaded via _document.js

// THEME
const C={
  dark:{bg:"#07080D",bg2:"#0E1018",bg3:"#151720",bg4:"#1C1F2E",bh:"#242840",bd:"#242840",tx:"#EAEAF2",t2:"#8888A8",t3:"#555570",
    ac:"#7C6AFF",acL:"#9B8AFF",acG:"rgba(124,106,255,0.12)",gr:"linear-gradient(135deg,#7C6AFF,#5B4AD0,#8B5CF6)",
    gS:"linear-gradient(135deg,rgba(124,106,255,0.08),rgba(91,74,208,0.04))",ok:"#10B981",wn:"#F59E0B",er:"#EF4444",inf:"#3B82F6",
    sh:"0 4px 24px rgba(0,0,0,.5)"},
  light:{bg:"#F3F3FA",bg2:"#FFFFFF",bg3:"#EDEDF6",bg4:"#E2E2EE",bh:"#D8D8E6",bd:"#D8D8E6",tx:"#1A1A30",t2:"#666688",t3:"#9999AA",
    ac:"#7C6AFF",acL:"#9B8AFF",acG:"rgba(124,106,255,0.08)",gr:"linear-gradient(135deg,#7C6AFF,#5B4AD0,#8B5CF6)",
    gS:"linear-gradient(135deg,rgba(124,106,255,0.06),rgba(91,74,208,0.02))",ok:"#059669",wn:"#D97706",er:"#DC2626",inf:"#2563EB",
    sh:"0 2px 12px rgba(0,0,0,.06)"}
};

// CONSTANTS
const TCATS=[
  {id:"shopping",name:"Shopping",icon:"🛒",color:"#F59E0B"},{id:"family",name:"Family",icon:"👨‍👩‍👧‍👦",color:"#EC4899"},
  {id:"home",name:"Home",icon:"🏠",color:"#8B5CF6"},{id:"office",name:"Office",icon:"💼",color:"#3B82F6"},
  {id:"career",name:"Career",icon:"📈",color:"#10B981"},{id:"personality",name:"Self Dev",icon:"🧠",color:"#F97316"},
  {id:"health",name:"Health",icon:"💪",color:"#EF4444"},{id:"finance",name:"Finance",icon:"💰",color:"#6366F1"},
  {id:"social",name:"Social",icon:"🤝",color:"#14B8A6"},{id:"learning",name:"Learning",icon:"📚",color:"#A855F7"},
  {id:"travel",name:"Travel",icon:"✈️",color:"#0EA5E9"},{id:"errands",name:"Errands",icon:"📋",color:"#78716C"},
];
const ECATS=[
  {id:"food",name:"Food",icon:"🍽️",color:"#F59E0B"},{id:"travel",name:"Travel",icon:"🚗",color:"#3B82F6"},
  {id:"shopping",name:"Shopping",icon:"🛍️",color:"#EC4899"},{id:"bills",name:"Bills",icon:"📃",color:"#EF4444"},
  {id:"health",name:"Health",icon:"🏥",color:"#10B981"},{id:"family",name:"Family",icon:"👨‍👩‍👧",color:"#8B5CF6"},
  {id:"fun",name:"Fun",icon:"🎬",color:"#F97316"},{id:"education",name:"Education",icon:"📖",color:"#6366F1"},
  {id:"other",name:"Other",icon:"📌",color:"#78716C"},
];
const PRIS=[{id:"urgent",l:"Urgent",c:"#EF4444",i:"🔴"},{id:"high",l:"High",c:"#F59E0B",i:"🟠"},{id:"medium",l:"Medium",c:"#3B82F6",i:"🔵"},{id:"low",l:"Low",c:"#10B981",i:"🟢"}];
const ENERGY=["⚡ High","💡 Medium","🌙 Low"];
const CTXS=["🏠 Home","💼 Office","🛒 Market","✈️ Travel","💻 Online","📞 Phone"];
const STL={todo:"To Do",inprogress:"In Progress",done:"Done",skipped:"Skipped",postponed:"Postponed"};
const STC={todo:"#6B7280",inprogress:"#3B82F6",done:"#10B981",skipped:"#F59E0B",postponed:"#EF4444"};

// Collection icons with proper names (FIXED - like expense section)
const COLL_ICONS=[
  {icon:"📋",name:"Checklist"},{icon:"🎬",name:"Movies"},{icon:"📚",name:"Books"},
  {icon:"✈️",name:"Travel Plans"},{icon:"🎁",name:"Gift Ideas"},{icon:"🛍️",name:"Wishlist"},
  {icon:"🍽️",name:"Restaurants"},{icon:"💡",name:"Ideas"},{icon:"🏥",name:"Health Records"},
  {icon:"🔑",name:"Passwords"},{icon:"🎯",name:"Goals"},{icon:"💪",name:"Fitness"},
  {icon:"🏠",name:"Home Tasks"},{icon:"📝",name:"Notes"},{icon:"🎵",name:"Music"},
  {icon:"🧳",name:"Bucket List"},{icon:"🎓",name:"Courses"},{icon:"👥",name:"Contacts"},
  {icon:"🎮",name:"Games"},{icon:"🌱",name:"Habits"},
];
const MOODS=[{id:"great",e:"😄",l:"Great",c:"#10B981"},{id:"good",e:"🙂",l:"Good",c:"#3B82F6"},{id:"okay",e:"😐",l:"Okay",c:"#F59E0B"},{id:"bad",e:"😔",l:"Low",c:"#F97316"},{id:"awful",e:"😢",l:"Awful",c:"#EF4444"}];

// 2026 Central Govt Gazetted Holidays (India)
const GOV_HOLIDAYS_2026=[
  {name:"Republic Day",date:"2026-01-26",type:"gazetted"},
  {name:"Holi",date:"2026-03-04",type:"gazetted"},
  {name:"Id-ul-Fitr",date:"2026-03-21",type:"gazetted"},
  {name:"Ram Navami",date:"2026-03-26",type:"gazetted"},
  {name:"Mahavir Jayanti",date:"2026-03-31",type:"gazetted"},
  {name:"Good Friday",date:"2026-04-03",type:"gazetted"},
  {name:"Buddha Purnima",date:"2026-05-01",type:"gazetted"},
  {name:"Id-ul-Zuha (Bakrid)",date:"2026-05-27",type:"gazetted"},
  {name:"Muharram",date:"2026-06-26",type:"gazetted"},
  {name:"Independence Day",date:"2026-08-15",type:"gazetted"},
  {name:"Milad-un-Nabi",date:"2026-08-26",type:"gazetted"},
  {name:"Mahatma Gandhi Jayanti",date:"2026-10-02",type:"gazetted"},
  {name:"Dussehra",date:"2026-10-20",type:"gazetted"},
  {name:"Diwali",date:"2026-11-08",type:"gazetted"},
  {name:"Guru Nanak Jayanti",date:"2026-11-24",type:"gazetted"},
  {name:"Christmas",date:"2026-12-25",type:"gazetted"},
];

const INIT={
  onboarded:false,introSeen:false,theme:"dark",userName:"",mode:"guest",email:"",
  tasks:[],expenses:[],notes:[],reminders:[],collections:[],misc:[],
  holidays:[],customDayOverrides:{},habits:[],moodLog:[],gratitude:[],
  categories:TCATS,settings:{},govHolidaysLoaded:false,
};

// ============================================================
// UI PRIMITIVES
// ============================================================
const tc=()=>C[document.body.dataset.t||"dark"];

function Btn({children,onClick,v="primary",sz="md",style,disabled,...p}){
  const c=tc();
  const b={display:"inline-flex",alignItems:"center",gap:"6px",border:"none",borderRadius:"12px",
    cursor:disabled?"default":"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:500,
    transition:"all .2s",opacity:disabled?.4:1,
    fontSize:sz==="sm"?"12px":sz==="lg"?"15px":"13px",
    padding:sz==="sm"?"6px 12px":sz==="lg"?"14px 24px":"9px 16px"};
  const vs={primary:{background:c.gr,color:"#fff",boxShadow:"0 2px 12px rgba(124,106,255,.3)"},
    secondary:{background:c.bg3,color:c.tx,border:`1px solid ${c.bd}`},
    ghost:{background:"transparent",color:c.t2},danger:{background:"rgba(239,68,68,.1)",color:c.er}};
  return <button onClick={disabled?undefined:onClick} style={{...b,...vs[v],...style}} {...p}>{children}</button>;
}

function Inp({label,value,onChange,type="text",ph,style,multi,...p}){
  const c=tc();
  const s={width:"100%",padding:multi?"12px 14px":"10px 14px",background:c.bg3,
    border:`1px solid ${c.bd}`,borderRadius:"12px",color:c.tx,fontFamily:"'Outfit',sans-serif",
    fontSize:"14px",outline:"none",transition:"border-color .2s",resize:multi?"vertical":"none",
    minHeight:multi?"80px":"auto",...style};
  return(<div style={{marginBottom:"12px"}}>
    {label&&<label style={{display:"block",marginBottom:"5px",fontSize:"12px",color:c.t2,fontWeight:500,letterSpacing:".3px"}}>{label}</label>}
    {multi?<textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={ph} style={s} {...p}/>
    :<input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={ph} style={s} {...p}/>}
  </div>);
}

function Sel({label,value,onChange,opts,style}){
  const c=tc();
  return(<div style={{marginBottom:"12px"}}>
    {label&&<label style={{display:"block",marginBottom:"5px",fontSize:"12px",color:c.t2,fontWeight:500}}>{label}</label>}
    <select value={value||""} onChange={e=>onChange(e.target.value)} style={{
      width:"100%",padding:"10px 14px",background:c.bg3,border:`1px solid ${c.bd}`,
      borderRadius:"12px",color:c.tx,fontFamily:"'Outfit',sans-serif",fontSize:"14px",
      outline:"none",appearance:"none",cursor:"pointer",...style}}>
      {opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>);
}

function Modal({open,onClose,title,children}){
  const c=tc();
  if(!open) return null;
  return(<div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)"}}/>
    <div onClick={e=>e.stopPropagation()} style={{position:"relative",width:"100%",maxWidth:"500px",maxHeight:"92vh",
      background:c.bg2,borderRadius:"24px 24px 0 0",boxShadow:c.sh,display:"flex",flexDirection:"column",animation:"su .3s ease"}}>
      <div style={{width:"36px",height:"4px",background:c.bd,borderRadius:"2px",margin:"8px auto 0",flexShrink:0}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px 10px",borderBottom:`1px solid ${c.bd}`}}>
        <h3 style={{margin:0,fontSize:"17px",fontWeight:600,color:c.tx}}>{title}</h3>
        <button onClick={onClose} style={{background:c.bg3,border:"none",borderRadius:"10px",width:"32px",height:"32px",cursor:"pointer",color:c.t2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>✕</button>
      </div>
      <div style={{padding:"16px 20px 24px",overflowY:"auto",flex:1}}>{children}</div>
    </div>
    <style>{`@keyframes su{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
  </div>);
}

function Ring({pct,size=52,stroke=4,color,children}){
  const c=tc(),r=(size-stroke)/2,ci=2*Math.PI*r;
  return(<div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c.bd} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color||c.ac} strokeWidth={stroke}
        strokeDasharray={ci} strokeDashoffset={ci-(cl(pct,0,100)/100)*ci} strokeLinecap="round" style={{transition:"stroke-dashoffset .5s"}}/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:600,color:c.tx}}>{children||`${Math.round(pct)}%`}</div>
  </div>);
}

function Chip({label,color,sel,onClick,sz="md"}){
  const c=tc();
  return <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:"3px",
    padding:sz==="sm"?"3px 9px":"5px 12px",fontSize:sz==="sm"?"11px":"12px",fontWeight:500,borderRadius:"20px",
    border:`1px solid ${sel?(color||c.ac):c.bd}`,background:sel?(color||c.ac)+"18":"transparent",
    color:sel?(color||c.ac):c.t2,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .2s",whiteSpace:"nowrap"}}>{label}</button>;
}

function Empty({icon,title,sub}){
  const c=tc();
  return <div style={{textAlign:"center",padding:"40px 20px",color:c.t3}}>
    <div style={{fontSize:"44px",marginBottom:"10px",opacity:.5}}>{icon}</div>
    <div style={{fontSize:"15px",fontWeight:600,color:c.t2,marginBottom:"3px"}}>{title}</div>
    <div style={{fontSize:"12px"}}>{sub}</div></div>;
}

function Tabs({tabs,active,onChange}){
  const c=tc();
  return <div style={{display:"flex",gap:"3px",padding:"3px",background:c.bg3,borderRadius:"14px",marginBottom:"14px",overflowX:"auto"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:"0 0 auto",padding:"8px 14px",fontSize:"12px",fontWeight:active===t.id?600:400,
      borderRadius:"11px",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",
      background:active===t.id?c.ac:"transparent",color:active===t.id?"#fff":c.t2,transition:"all .2s",whiteSpace:"nowrap"}}>{t.label}</button>)}
  </div>;
}

function FAB({onClick}){const c=tc();return <button onClick={onClick} style={{position:"fixed",bottom:"84px",right:"20px",width:"54px",height:"54px",borderRadius:"16px",background:c.gr,border:"none",color:"#fff",fontSize:"24px",cursor:"pointer",boxShadow:"0 4px 20px rgba(124,106,255,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>+</button>;}

// ============================================================
// ONBOARDING WITH INTRO WALKTHROUGH
// ============================================================
function Onboarding({onDone}){
  const [step,setStep]=useState(0);
  const [name,setName]=useState("");
  const [theme,setTheme]=useState("dark");
  const c=C[theme];

  const introSlides=[
    {icon:"✅",title:"Smart Task Management",desc:"Plan by day, week, month. 12 life categories. Max 15 tasks per category to keep you focused. Carry forward, prioritize, and track progress."},
    {icon:"💰",title:"Expense Tracking",desc:"Quick expense entry with UPI, cash, card modes. Daily, weekly, monthly views with category breakdown and ₹ formatting."},
    {icon:"💡",title:"Ideas & Notes",desc:"Capture thoughts instantly. Tag, pin, and organize with status pipeline: Raw → Developed → Actionable → Archived."},
    {icon:"🔔",title:"Reminders",desc:"Never miss birthdays, bills, deadlines. One-time or recurring reminders with snooze and priority options."},
    {icon:"📋",title:"Smart Collections",desc:"Unlimited lists for movies, books, restaurants, bucket list, anything. Add completion dates and personal thoughts to each item."},
    {icon:"🌴",title:"Holiday & Trip Planner",desc:"Auto-loaded Indian govt holidays. Detect long weekends. Plan trips with budget, packing list, and destination tracking."},
    {icon:"😊",title:"Wellness Hub",desc:"Daily mood tracking with pixel map. Habit streaks. Gratitude journal. All in one place for your wellbeing."},
    {icon:"📎",title:"Quick Inbox",desc:"Dump anything fast. Move items to tasks, notes, or reminders later. Zero friction capture."},
  ];

  // Intro walkthrough
  if(step>=0 && step<introSlides.length){
    const s=introSlides[step];
    return(<div style={{minHeight:"100vh",background:c.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",padding:"20px",textAlign:"center"}}>
      <div style={{fontSize:"72px",marginBottom:"20px",animation:"bounce 1s ease infinite alternate"}}>{s.icon}</div>
      <h2 style={{color:c.text||c.tx,fontSize:"22px",fontWeight:700,margin:"0 0 10px"}}>{s.title}</h2>
      <p style={{color:c.t2,fontSize:"14px",lineHeight:1.7,maxWidth:"300px",margin:"0 0 32px"}}>{s.desc}</p>
      {/* Dots */}
      <div style={{display:"flex",gap:"6px",marginBottom:"24px"}}>
        {introSlides.map((_,i)=><div key={i} style={{width:i===step?"20px":"6px",height:"6px",borderRadius:"3px",background:i===step?c.ac:c.bd,transition:"all .3s"}}/>)}
      </div>
      <div style={{display:"flex",gap:"10px",width:"100%",maxWidth:"300px"}}>
        <button onClick={()=>setStep(introSlides.length)} style={{flex:1,padding:"12px",background:"transparent",border:`1px solid ${c.bd}`,borderRadius:"14px",color:c.t2,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:"14px"}}>Skip</button>
        <button onClick={()=>setStep(step+1)} style={{flex:2,padding:"12px",background:c.gr,border:"none",borderRadius:"14px",color:"#fff",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:"14px",fontWeight:600,boxShadow:"0 4px 16px rgba(124,106,255,.3)"}}>
          {step===introSlides.length-1?"Get Started":"Next"}
        </button>
      </div>
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-8px)}}`}</style>
    </div>);
  }

  // Name + Theme step
  return(<div style={{minHeight:"100vh",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",padding:"20px"}}>
    <div style={{maxWidth:"340px",width:"100%"}}>
      <div style={{width:"64px",height:"64px",borderRadius:"20px",background:c.gr,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:"30px",boxShadow:"0 6px 24px rgba(124,106,255,.3)"}}>✨</div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:c.tx,margin:"0 0 4px",textAlign:"center"}}>LifePad</h1>
      <p style={{color:c.t2,fontSize:"13px",textAlign:"center",margin:"0 0 24px"}}>Your personal life dashboard</p>
      <Inp value={name} onChange={setName} ph="Your name" style={{fontSize:"16px",padding:"14px 18px"}}/>
      <div style={{marginBottom:"16px"}}>
        <label style={{display:"block",marginBottom:"6px",fontSize:"12px",color:c.t2,fontWeight:500}}>Appearance</label>
        <div style={{display:"flex",gap:"8px"}}>
          {["dark","light"].map(t=><button key={t} onClick={()=>setTheme(t)} style={{
            flex:1,padding:"12px",borderRadius:"14px",border:`2px solid ${theme===t?c.ac:c.bd}`,
            background:t==="dark"?"#0E1018":"#F3F3FA",cursor:"pointer",color:t==="dark"?"#EAEAF2":"#1A1A30",
            fontSize:"13px",fontWeight:500,fontFamily:"'Outfit',sans-serif"}}>{t==="dark"?"🌙 Dark":"☀️ Light"}</button>)}
        </div>
      </div>
      <Btn onClick={()=>onDone({name,theme})} sz="lg" style={{width:"100%",justifyContent:"center",borderRadius:"14px"}}>Launch LifePad 🚀</Btn>
    </div>
  </div>);
}

// ============================================================
// TASK COMPONENTS
// ============================================================
function TaskItem({task,cats,onUp,onDel,c}){
  const cat=cats.find(x=>x.id===task.category);
  const pri=PRIS.find(x=>x.id===task.priority);
  const[ex,setEx]=useState(false);
  const cyc=()=>{const o=["todo","inprogress","done"];const i=o.indexOf(task.status);onUp({...task,status:o[(i+1)%o.length],completedAt:o[(i+1)%o.length]==="done"?nw():null});};
  return(<div style={{background:c.bg3,borderRadius:"14px",padding:"12px 14px",marginBottom:"6px",borderLeft:`3px solid ${pri?.c||c.bd}`,opacity:task.status==="done"?.6:1}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
      <button onClick={cyc} style={{width:"22px",height:"22px",borderRadius:"7px",flexShrink:0,marginTop:"1px",
        border:`2px solid ${task.status==="done"?c.ok:task.status==="inprogress"?c.inf:c.bd}`,
        background:task.status==="done"?c.ok:task.status==="inprogress"?c.inf+"30":"transparent",
        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"11px"}}>{task.status==="done"&&"✓"}</button>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setEx(!ex)}>
        <div style={{fontSize:"14px",fontWeight:500,color:c.tx,textDecoration:task.status==="done"?"line-through":"none",marginBottom:"3px"}}>{task.name}</div>
        <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
          {cat&&<span style={{fontSize:"10px",padding:"1px 6px",borderRadius:"4px",background:cat.color+"18",color:cat.color}}>{cat.icon}</span>}
          {task.dueTime&&<span style={{fontSize:"10px",color:c.t3}}>🕐{task.dueTime}</span>}
          {task.estimatedMinutes&&<span style={{fontSize:"10px",color:c.t3}}>{task.estimatedMinutes}m</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:"2px",flexShrink:0}}>
        {task.status!=="done"&&<button onClick={()=>onUp({...task,status:"postponed",dueDate:new Date(new Date(task.dueDate||Date.now()).getTime()+864e5).toISOString().split("T")[0]})}
          style={{background:"none",border:"none",cursor:"pointer",color:c.t3,fontSize:"13px",padding:"4px"}}>⏩</button>}
        <button onClick={()=>onDel(task.id)} style={{background:"none",border:"none",cursor:"pointer",color:c.t3,fontSize:"13px",padding:"4px"}}>🗑</button>
      </div>
    </div>
    {ex&&<div style={{marginTop:"10px",paddingTop:"10px",borderTop:`1px solid ${c.bd}`}}>
      {task.note&&<p style={{fontSize:"12px",color:c.t2,margin:"0 0 8px",lineHeight:1.5}}>{task.note}</p>}
      {task.subtasks?.map((st,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}}>
        <button onClick={()=>{const s=[...task.subtasks];s[i]={...s[i],done:!s[i].done};onUp({...task,subtasks:s});}}
          style={{width:"16px",height:"16px",borderRadius:"4px",border:`1.5px solid ${st.done?c.ok:c.bd}`,background:st.done?c.ok:"transparent",cursor:"pointer",flexShrink:0,color:"#fff",fontSize:"9px",display:"flex",alignItems:"center",justifyContent:"center"}}>{st.done&&"✓"}</button>
        <span style={{fontSize:"12px",color:st.done?c.t3:c.t2,textDecoration:st.done?"line-through":"none"}}>{st.name}</span>
      </div>)}
      <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"6px"}}>
        {task.energy&&<span style={{fontSize:"9px",padding:"2px 6px",borderRadius:"4px",background:c.bg4,color:c.t2}}>{task.energy}</span>}
        {task.context&&<span style={{fontSize:"9px",padding:"2px 6px",borderRadius:"4px",background:c.bg4,color:c.t2}}>{task.context}</span>}
        <span style={{fontSize:"9px",padding:"2px 6px",borderRadius:"4px",background:STC[task.status]+"18",color:STC[task.status]}}>{STL[task.status]}</span>
      </div>
    </div>}
  </div>);
}

function TaskForm({cats,onSave,onClose}){
  const c=tc();
  const[f,sf]=useState({id:uid(),name:"",note:"",dueDate:td(),dueTime:"",category:cats[0]?.id||"office",
    priority:"medium",estimatedMinutes:30,repeat:"none",subtasks:[],status:"todo",energy:"",context:"",goalType:"daily",createdAt:nw()});
  const set=(k,v)=>sf(p=>({...p,[k]:v}));
  return(<div>
    <Inp label="Task Name" value={f.name} onChange={v=>set("name",v)} ph="What needs to be done?"/>
    <Inp label="Note" value={f.note} onChange={v=>set("note",v)} ph="Details..." multi/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
      <Inp label="Due Date" type="date" value={f.dueDate} onChange={v=>set("dueDate",v)}/>
      <Inp label="Time" type="time" value={f.dueTime} onChange={v=>set("dueTime",v)}/>
    </div>
    <Sel label="Category" value={f.category} onChange={v=>set("category",v)} opts={cats.map(c=>({value:c.id,label:`${c.icon} ${c.name}`}))}/>
    <div style={{marginBottom:"12px"}}>
      <label style={{display:"block",marginBottom:"5px",fontSize:"12px",color:c.t2,fontWeight:500}}>Priority</label>
      <div style={{display:"flex",gap:"5px"}}>{PRIS.map(p=><Chip key={p.id} label={`${p.i} ${p.l}`} color={p.c} sel={f.priority===p.id} onClick={()=>set("priority",p.id)} sz="sm"/>)}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
      <Sel label="Duration" value={String(f.estimatedMinutes)} onChange={v=>set("estimatedMinutes",Number(v))} opts={[5,10,15,30,45,60,90,120].map(m=>({value:String(m),label:m<60?`${m} min`:`${m/60}h`}))}/>
      <Sel label="Repeat" value={f.repeat} onChange={v=>set("repeat",v)} opts={[{value:"none",label:"None"},{value:"daily",label:"Daily"},{value:"weekdays",label:"Weekdays"},{value:"weekly",label:"Weekly"},{value:"monthly",label:"Monthly"}]}/>
    </div>
    <div style={{marginBottom:"12px"}}>
      <label style={{display:"block",marginBottom:"5px",fontSize:"12px",color:c.t2,fontWeight:500}}>Subtasks</label>
      {(f.subtasks||[]).map((st,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}}>
        <span style={{fontSize:"12px",color:c.tx,flex:1}}>• {st.name}</span>
        <button onClick={()=>set("subtasks",f.subtasks.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:c.t3,fontSize:"12px"}}>✕</button>
      </div>)}
      <input placeholder="Add subtask + Enter" onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){set("subtasks",[...(f.subtasks||[]),{name:e.target.value.trim(),done:false}]);e.target.value="";}}}
        style={{width:"100%",padding:"8px 12px",background:c.bg4,border:`1px solid ${c.bd}`,borderRadius:"10px",color:c.tx,fontSize:"12px",fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
    </div>
    <div style={{display:"flex",gap:"8px"}}>
      <Btn v="secondary" onClick={onClose} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
      <Btn onClick={()=>{if(f.name.trim())onSave(f)}} disabled={!f.name.trim()} style={{flex:2,justifyContent:"center"}}>Add Task</Btn>
    </div>
  </div>);
}

// ============================================================
// ALL MODULES (Compact but complete)
// ============================================================
function TasksMod({data,setData}){const c=C[data.theme];const[view,setView]=useState("today");const[show,setShow]=useState(false);const[fCat,setFCat]=useState("all");const[q,setQ]=useState("");const t=td();
  const fil=useMemo(()=>{let ts=data.tasks||[];if(view==="today")ts=ts.filter(x=>x.dueDate===t||(x.status!=="done"&&x.dueDate&&x.dueDate<t));else if(view==="week"){const we=new Date(Date.now()+6*864e5).toISOString().split("T")[0];ts=ts.filter(x=>x.dueDate>=t&&x.dueDate<=we);}else if(view==="missed")ts=ts.filter(x=>x.status!=="done"&&x.dueDate&&x.dueDate<t);if(fCat!=="all")ts=ts.filter(x=>x.category===fCat);if(q)ts=ts.filter(x=>x.name.toLowerCase().includes(q.toLowerCase()));return ts.sort((a,b)=>({urgent:0,high:1,medium:2,low:3}[a.priority]||2)-({urgent:0,high:1,medium:2,low:3}[b.priority]||2))},[data.tasks,view,fCat,q,t]);
  const tT=(data.tasks||[]).filter(x=>x.dueDate===t);const dC=tT.filter(x=>x.status==="done").length;const pct=tT.length?(dC/tT.length)*100:0;const missC=(data.tasks||[]).filter(x=>x.status!=="done"&&x.dueDate&&x.dueDate<t).length;
  const saveT=task=>{setData(p=>{const ex=p.tasks.find(x=>x.id===task.id);if(!ex){const cc=p.tasks.filter(x=>x.category===task.category&&x.dueDate===task.dueDate).length;if(cc>=15){alert("Max 15 tasks per category per day!");return p;}}return{...p,tasks:ex?p.tasks.map(x=>x.id===task.id?task:x):[...p.tasks,task]}});setShow(false);};
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"14px",padding:"14px 16px",background:c.gS,borderRadius:"16px",border:`1px solid ${c.bd}`}}>
      <Ring pct={pct} color={pct===100?c.ok:c.ac}/><div style={{flex:1}}><div style={{fontSize:"14px",fontWeight:600,color:c.tx}}>{dC}/{tT.length} done</div><div style={{fontSize:"11px",color:c.t2}}>{missC>0?`⚠️ ${missC} missed`:pct===100?"🎉 All clear!":""}</div></div>
      {missC>0&&<Btn sz="sm" v="secondary" onClick={()=>setData(p=>({...p,tasks:p.tasks.map(x=>x.status!=="done"&&x.dueDate&&x.dueDate<t?{...x,dueDate:t}:x)}))} style={{fontSize:"10px"}}>Carry →</Btn>}
    </div>
    <Tabs tabs={[{id:"today",label:"Today"},{id:"week",label:"Week"},{id:"all",label:"All"},{id:"missed",label:`Missed${missC?` (${missC})`:""}`}]} active={view} onChange={setView}/>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Search tasks..." style={{width:"100%",padding:"9px 14px",background:c.bg3,border:`1px solid ${c.bd}`,borderRadius:"12px",color:c.tx,fontSize:"13px",fontFamily:"'Outfit',sans-serif",outline:"none",marginBottom:"10px"}}/>
    <div style={{display:"flex",gap:"4px",marginBottom:"12px",overflowX:"auto",paddingBottom:"2px"}}>
      <Chip label="All" sel={fCat==="all"} onClick={()=>setFCat("all")} sz="sm"/>
      {data.categories.map(cat=><Chip key={cat.id} label={cat.icon} color={cat.color} sel={fCat===cat.id} onClick={()=>setFCat(cat.id)} sz="sm"/>)}
    </div>
    {fil.length===0?<Empty icon="✅" title="No tasks" sub="Tap + to add"/>:fil.map(t=><TaskItem key={t.id} task={t} cats={data.categories} c={c} onUp={task=>setData(p=>({...p,tasks:p.tasks.map(x=>x.id===task.id?task:x)}))} onDel={id=>setData(p=>({...p,tasks:p.tasks.filter(x=>x.id!==id)}))}/>)}
    <FAB onClick={()=>setShow(true)}/><Modal open={show} onClose={()=>setShow(false)} title="New Task"><TaskForm cats={data.categories} onSave={saveT} onClose={()=>setShow(false)}/></Modal>
  </div>);
}

function ExpMod({data,setData}){const c=C[data.theme];const[show,setShow]=useState(false);const[f,sf]=useState({amount:"",category:"food",note:"",pay:"upi"});const[period,setPeriod]=useState("today");const t=td();
  const exps=useMemo(()=>{let e=data.expenses||[];if(period==="today")e=e.filter(x=>x.date===t);else if(period==="week"){const ws=new Date(Date.now()-6*864e5).toISOString().split("T")[0];e=e.filter(x=>x.date>=ws);}else if(period==="month"){const ms=new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split("T")[0];e=e.filter(x=>x.date>=ms);}return e},[data.expenses,period,t]);
  const total=exps.reduce((s,e)=>s+Number(e.amount),0);const byCat=ECATS.map(cat=>({...cat,total:exps.filter(e=>e.category===cat.id).reduce((s,e)=>s+Number(e.amount),0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  return(<div>
    <div style={{padding:"18px",background:c.gS,borderRadius:"16px",border:`1px solid ${c.bd}`,marginBottom:"14px",textAlign:"center"}}>
      <div style={{fontSize:"11px",color:c.t2,marginBottom:"4px",textTransform:"uppercase",letterSpacing:"1px"}}>{period==="today"?"Today":period==="week"?"This Week":"This Month"}</div>
      <div style={{fontSize:"34px",fontWeight:700,color:c.tx,fontFamily:"'JetBrains Mono',monospace"}}>{cur(total)}</div>
    </div>
    <Tabs tabs={[{id:"today",label:"Today"},{id:"week",label:"Week"},{id:"month",label:"Month"}]} active={period} onChange={setPeriod}/>
    {byCat.map(cat=><div key={cat.id} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
      <span style={{fontSize:"18px"}}>{cat.icon}</span><div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}><span style={{fontSize:"12px",color:c.tx}}>{cat.name}</span><span style={{fontSize:"12px",fontWeight:600,color:c.tx,fontFamily:"'JetBrains Mono',monospace"}}>{cur(cat.total)}</span></div>
        <div style={{height:"3px",background:c.bg4,borderRadius:"2px"}}><div style={{height:"100%",width:`${total?(cat.total/total)*100:0}%`,background:cat.color,borderRadius:"2px",transition:"width .3s"}}/></div>
      </div></div>)}
    {exps.length===0&&<Empty icon="💰" title="No expenses" sub="Tap + to add"/>}
    <FAB onClick={()=>setShow(true)}/>
    <Modal open={show} onClose={()=>setShow(false)} title="Add Expense">
      <Inp label="Amount (₹)" type="number" value={f.amount} onChange={v=>sf(p=>({...p,amount:v}))} ph="0" style={{fontSize:"28px",fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}/>
      <div style={{marginBottom:"12px"}}>
        <label style={{display:"block",marginBottom:"5px",fontSize:"12px",color:c.t2,fontWeight:500}}>Category</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px"}}>
          {ECATS.map(cat=><button key={cat.id} onClick={()=>sf(p=>({...p,category:cat.id}))} style={{
            padding:"12px 4px",borderRadius:"14px",border:`2px solid ${f.category===cat.id?cat.color:c.bd}`,
            background:f.category===cat.id?cat.color+"12":c.bg3,cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:"24px",marginBottom:"4px"}}>{cat.icon}</div>
            <div style={{fontSize:"11px",color:c.tx,fontWeight:500}}>{cat.name}</div>
          </button>)}
        </div>
      </div>
      <Inp label="Note" value={f.note} onChange={v=>sf(p=>({...p,note:v}))} ph="What was this for?"/>
      <Sel label="Payment" value={f.pay} onChange={v=>sf(p=>({...p,pay:v}))} opts={[{value:"upi",label:"UPI"},{value:"cash",label:"Cash"},{value:"card",label:"Card"},{value:"netbanking",label:"Net Banking"}]}/>
      <Btn onClick={()=>{if(!f.amount||Number(f.amount)<=0)return;setData(p=>({...p,expenses:[...p.expenses,{id:uid(),...f,amount:Number(f.amount),date:t,createdAt:nw()}]}));sf({amount:"",category:"food",note:"",pay:"upi"});setShow(false);}} disabled={!f.amount} sz="lg" style={{width:"100%",justifyContent:"center"}}>Add Expense</Btn>
    </Modal>
  </div>);
}

function NotesMod({data,setData}){const c=C[data.theme];const[show,setShow]=useState(false);const[edit,setEdit]=useState(null);const[f,sf]=useState({title:"",content:"",tags:"",status:"raw",pinned:false});
  const notes=useMemo(()=>(data.notes||[]).sort((a,b)=>(a.pinned!==b.pinned)?(a.pinned?-1:1):(b.createdAt||"").localeCompare(a.createdAt||"")),[data.notes]);
  const saveN=()=>{if(!f.title.trim()&&!f.content.trim())return;const n={id:edit?.id||uid(),...f,tags:f.tags?f.tags.split(",").map(t=>t.trim()).filter(Boolean):[],createdAt:edit?.createdAt||nw(),updatedAt:nw()};setData(p=>({...p,notes:edit?p.notes.map(x=>x.id===n.id?n:x):[...p.notes,n]}));sf({title:"",content:"",tags:"",status:"raw",pinned:false});setShow(false);setEdit(null);};
  return(<div>
    {notes.length===0?<Empty icon="💡" title="No notes" sub="Capture ideas"/>:
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>{notes.map(n=><div key={n.id} onClick={()=>{setEdit(n);sf({...n,tags:(n.tags||[]).join(", ")});setShow(true);}}
      style={{padding:"14px",background:c.bg3,borderRadius:"14px",border:`1px solid ${n.pinned?c.ac+"40":c.bd}`,cursor:"pointer",position:"relative"}}>
      {n.pinned&&<span style={{position:"absolute",top:"8px",right:"8px",fontSize:"11px"}}>📌</span>}
      <div style={{fontSize:"13px",fontWeight:600,color:c.tx,marginBottom:"4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title||"Untitled"}</div>
      <div style={{fontSize:"11px",color:c.t3,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.content}</div>
      <div style={{fontSize:"9px",color:c.t3,marginTop:"6px"}}>{fmt(n.createdAt)}</div>
    </div>)}</div>}
    <FAB onClick={()=>{setEdit(null);sf({title:"",content:"",tags:"",status:"raw",pinned:false});setShow(true);}}/>
    <Modal open={show} onClose={()=>{setShow(false);setEdit(null)}} title={edit?"Edit Note":"New Note"}>
      <Inp label="Title" value={f.title} onChange={v=>sf(p=>({...p,title:v}))} ph="Note title"/>
      <Inp label="Content" value={f.content} onChange={v=>sf(p=>({...p,content:v}))} ph="Write your thoughts..." multi style={{minHeight:"120px"}}/>
      <Inp label="Tags (comma separated)" value={f.tags} onChange={v=>sf(p=>({...p,tags:v}))} ph="idea, project"/>
      <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
        {edit&&<Btn v="danger" onClick={()=>{setData(p=>({...p,notes:p.notes.filter(n=>n.id!==edit.id)}));setShow(false);setEdit(null);}}>Delete</Btn>}
        <Btn v="secondary" onClick={()=>sf(p=>({...p,pinned:!p.pinned}))}>{f.pinned?"📌":"Pin"}</Btn>
        <Btn onClick={saveN} style={{flex:1,justifyContent:"center"}}>Save</Btn>
      </div>
    </Modal>
  </div>);
}

function RemMod({data,setData}){const c=C[data.theme];const[show,setShow]=useState(false);const[f,sf]=useState({title:"",date:td(),time:"",repeat:"none",type:"general"});const t=td();
  const rems=(data.reminders||[]).sort((a,b)=>(a.date+(a.time||"")).localeCompare(b.date+(b.time||"")));const overdue=rems.filter(r=>!r.done&&r.date<t);const upcoming=rems.filter(r=>!r.done&&r.date>=t);
  const icons={general:"🔔",birthday:"🎂",bill:"📃",subscription:"🔄",deadline:"⏰"};
  const RI=({r})=><div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",background:c.bg3,borderRadius:"12px",marginBottom:"5px",borderLeft:`3px solid ${r.date<t&&!r.done?c.er:c.bd}`}}>
    <button onClick={()=>setData(p=>({...p,reminders:p.reminders.map(x=>x.id===r.id?{...x,done:!x.done}:x)}))} style={{width:"20px",height:"20px",borderRadius:"6px",border:`2px solid ${r.done?c.ok:c.bd}`,background:r.done?c.ok:"transparent",cursor:"pointer",color:"#fff",fontSize:"10px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{r.done&&"✓"}</button>
    <div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:500,color:r.done?c.t3:c.tx,textDecoration:r.done?"line-through":"none"}}>{icons[r.type]||"🔔"} {r.title}</div><div style={{fontSize:"10px",color:c.t3}}>{fmtF(r.date)}</div></div>
    <button onClick={()=>setData(p=>({...p,reminders:p.reminders.filter(x=>x.id!==r.id)}))} style={{background:"none",border:"none",cursor:"pointer",color:c.t3,fontSize:"12px"}}>🗑</button></div>;
  return(<div>
    {overdue.length>0&&<><div style={{fontSize:"11px",fontWeight:600,color:c.er,marginBottom:"6px"}}>⚠️ Overdue ({overdue.length})</div>{overdue.map(r=><RI key={r.id} r={r}/>)}<div style={{height:"12px"}}/></>}
    {upcoming.length>0&&<><div style={{fontSize:"11px",fontWeight:600,color:c.t2,marginBottom:"6px"}}>Upcoming ({upcoming.length})</div>{upcoming.map(r=><RI key={r.id} r={r}/>)}</>}
    {upcoming.length===0&&overdue.length===0&&<Empty icon="🔔" title="No reminders" sub="Set one"/>}
    <FAB onClick={()=>setShow(true)}/>
    <Modal open={show} onClose={()=>setShow(false)} title="New Reminder">
      <Inp label="What?" value={f.title} onChange={v=>sf(p=>({...p,title:v}))} ph="Pay electricity bill..."/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}><Inp label="Date" type="date" value={f.date} onChange={v=>sf(p=>({...p,date:v}))}/><Inp label="Time" type="time" value={f.time} onChange={v=>sf(p=>({...p,time:v}))}/></div>
      <Sel label="Type" value={f.type} onChange={v=>sf(p=>({...p,type:v}))} opts={Object.entries(icons).map(([v,i])=>({value:v,label:`${i} ${v.charAt(0).toUpperCase()+v.slice(1)}`}))}/>
      <Sel label="Repeat" value={f.repeat} onChange={v=>sf(p=>({...p,repeat:v}))} opts={[{value:"none",label:"None"},{value:"daily",label:"Daily"},{value:"weekly",label:"Weekly"},{value:"monthly",label:"Monthly"},{value:"yearly",label:"Yearly"}]}/>
      <Btn onClick={()=>{if(!f.title.trim())return;setData(p=>({...p,reminders:[...p.reminders,{id:uid(),...f,done:false,createdAt:nw()}]}));sf({title:"",date:td(),time:"",repeat:"none",type:"general"});setShow(false);}} disabled={!f.title.trim()} sz="lg" style={{width:"100%",justifyContent:"center"}}>Set Reminder</Btn>
    </Modal>
  </div>);
}

// COLLECTIONS - FIXED: Icons show emoji + name like expense grid
function CollMod({data,setData}){const c=C[data.theme];const[show,setShow]=useState(false);const[active,setActive]=useState(null);
  const[f,sf]=useState({name:"",icon:"📋"});const[itemText,setItemText]=useState("");const[itemMod,setItemMod]=useState(null);const[itemF,setItemF]=useState({targetDate:"",thoughts:""});
  const selectIcon=ic=>sf(p=>({...p,icon:ic.icon,name:ic.name}));
  const addC=()=>{if(!f.name.trim())return;setData(p=>({...p,collections:[...p.collections,{id:uid(),...f,items:[],createdAt:nw()}]}));sf({name:"",icon:"📋"});setShow(false);};
  const addI=(colId)=>{if(!itemText.trim())return;setData(p=>({...p,collections:p.collections.map(col=>col.id===colId?{...col,items:[...col.items,{id:uid(),text:itemText.trim(),done:false,thoughts:"",targetDate:"",createdAt:nw()}]}:col)}));setItemText("");};
  const togI=(colId,iId)=>setData(p=>({...p,collections:p.collections.map(col=>col.id===colId?{...col,items:col.items.map(i=>i.id===iId?{...i,done:!i.done,completedAt:!i.done?nw():null}:i)}:col)}));
  const delI=(colId,iId)=>setData(p=>({...p,collections:p.collections.map(col=>col.id===colId?{...col,items:col.items.filter(i=>i.id!==iId)}:col)}));
  const updI=(colId,iId,u)=>setData(p=>({...p,collections:p.collections.map(col=>col.id===colId?{...col,items:col.items.map(i=>i.id===iId?{...i,...u}:i)}:col)}));

  if(active){const col=(data.collections||[]).find(x=>x.id===active);if(!col){setActive(null);return null;}const dC=col.items.filter(i=>i.done).length;
    return(<div>
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
        <button onClick={()=>setActive(null)} style={{background:"none",border:"none",cursor:"pointer",color:c.t2,fontSize:"18px"}}>←</button>
        <span style={{fontSize:"28px"}}>{col.icon}</span><div style={{flex:1}}><div style={{fontSize:"17px",fontWeight:600,color:c.tx}}>{col.name}</div><div style={{fontSize:"11px",color:c.t3}}>{dC}/{col.items.length} done</div></div>
        <Btn v="danger" sz="sm" onClick={()=>{setData(p=>({...p,collections:p.collections.filter(x=>x.id!==col.id)}));setActive(null);}}>Delete</Btn>
      </div>
      {col.items.length>0&&<div style={{height:"4px",background:c.bg4,borderRadius:"2px",marginBottom:"14px"}}><div style={{height:"100%",width:`${col.items.length?(dC/col.items.length)*100:0}%`,background:c.ok,borderRadius:"2px",transition:"width .3s"}}/></div>}
      {col.items.map(item=><div key={item.id} style={{background:c.bg3,borderRadius:"12px",marginBottom:"5px",border:`1px solid ${c.bd}`}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px"}}>
          <button onClick={()=>togI(col.id,item.id)} style={{width:"20px",height:"20px",borderRadius:"6px",border:`1.5px solid ${item.done?c.ok:c.bd}`,background:item.done?c.ok:"transparent",cursor:"pointer",color:"#fff",fontSize:"10px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{item.done&&"✓"}</button>
          <div style={{flex:1,cursor:"pointer"}} onClick={()=>{setItemMod(item);setItemF({targetDate:item.targetDate||"",thoughts:item.thoughts||""});}}>
            <span style={{fontSize:"13px",color:item.done?c.t3:c.tx,textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
            <div style={{display:"flex",gap:"6px",marginTop:"2px"}}>
              {item.targetDate&&<span style={{fontSize:"9px",color:dUntil(item.targetDate)<0?c.er:c.t3}}>📅 {fmt(item.targetDate)}</span>}
              {item.thoughts&&<span style={{fontSize:"9px",color:c.ac}}>💭</span>}
            </div>
          </div>
          <button onClick={()=>delI(col.id,item.id)} style={{background:"none",border:"none",cursor:"pointer",color:c.t3,fontSize:"12px"}}>✕</button>
        </div>
      </div>)}
      <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
        <input value={itemText} onChange={e=>setItemText(e.target.value)} placeholder="Add item..." onKeyDown={e=>e.key==="Enter"&&addI(col.id)}
          style={{flex:1,padding:"10px 14px",background:c.bg3,border:`1px solid ${c.bd}`,borderRadius:"12px",color:c.tx,fontSize:"13px",fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
        <Btn onClick={()=>addI(col.id)}>Add</Btn>
      </div>
      <Modal open={!!itemMod} onClose={()=>setItemMod(null)} title="Item Details">
        {itemMod&&<div><div style={{fontSize:"16px",fontWeight:600,color:c.tx,marginBottom:"14px"}}>{itemMod.text}</div>
          <Inp label="📅 Target / Completion Date" type="date" value={itemF.targetDate} onChange={v=>setItemF(p=>({...p,targetDate:v}))}/>
          <Inp label="💭 Thoughts / Comments" value={itemF.thoughts} onChange={v=>setItemF(p=>({...p,thoughts:v}))} ph="Your thoughts..." multi/>
          <Btn onClick={()=>{updI(col.id,itemMod.id,itemF);setItemMod(null);}} sz="lg" style={{width:"100%",justifyContent:"center"}}>Save</Btn>
        </div>}
      </Modal>
    </div>);
  }

  return(<div>
    {(data.collections||[]).length===0?<Empty icon="📋" title="No collections" sub="Create lists for anything"/>:
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>{(data.collections||[]).map(col=><button key={col.id} onClick={()=>setActive(col.id)} style={{padding:"18px 14px",borderRadius:"16px",border:`1px solid ${c.bd}`,background:c.bg3,cursor:"pointer",textAlign:"left"}}>
      <div style={{fontSize:"30px",marginBottom:"8px"}}>{col.icon}</div>
      <div style={{fontSize:"14px",fontWeight:600,color:c.tx,marginBottom:"2px"}}>{col.name}</div>
      <div style={{fontSize:"10px",color:c.t3}}>{col.items?.length||0} items</div>
    </button>)}</div>}
    <FAB onClick={()=>setShow(true)}/>
    <Modal open={show} onClose={()=>setShow(false)} title="New Collection">
      <Inp label="Collection Name" value={f.name} onChange={v=>sf(p=>({...p,name:v}))} ph="e.g. Movies to watch"/>
      <div style={{marginBottom:"12px"}}>
        <label style={{display:"block",marginBottom:"6px",fontSize:"12px",color:c.t2,fontWeight:500}}>Icon (tap to auto-name)</label>
        {/* FIXED: Grid with emoji + name like expense category cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px"}}>
          {COLL_ICONS.map(ic=><button key={ic.icon+ic.name} onClick={()=>selectIcon(ic)} style={{
            padding:"10px 4px",borderRadius:"12px",border:`2px solid ${f.icon===ic.icon?c.ac:c.bd}`,
            background:f.icon===ic.icon?c.acG:c.bg3,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
            <div style={{fontSize:"22px",marginBottom:"2px"}}>{ic.icon}</div>
            <div style={{fontSize:"9px",color:f.icon===ic.icon?c.ac:c.t3,fontWeight:500}}>{ic.name}</div>
          </button>)}
        </div>
      </div>
      <Btn onClick={addC} disabled={!f.name.trim()} sz="lg" style={{width:"100%",justifyContent:"center"}}>Create Collection</Btn>
    </Modal>
  </div>);
}

// HOLIDAYS - with govt auto-load, clickable calendar days, working/holiday toggle
function HolMod({data,setData}){const c=C[data.theme];const[show,setShow]=useState(false);const[view,setView]=useState("calendar");
  const[f,sf]=useState({name:"",date:"",type:"holiday",activities:""});const[tripShow,setTripShow]=useState(false);
  const[tripF,setTripF]=useState({name:"",startDate:"",endDate:"",destination:"",budget:"",notes:"",packingList:""});
  const[dayModal,setDayModal]=useState(null);
  const t=td();
  // Auto-load govt holidays on first visit
  useEffect(()=>{if(!data.govHolidaysLoaded){setData(p=>{const existing=new Set((p.holidays||[]).map(h=>h.date));const newH=GOV_HOLIDAYS_2026.filter(h=>!existing.has(h.date)).map(h=>({id:uid(),...h,activities:"",createdAt:nw()}));return{...p,holidays:[...(p.holidays||[]),...newH],govHolidaysLoaded:true};});}},[data.govHolidaysLoaded]);

  const holidays=data.holidays||[];const overrides=data.customDayOverrides||{};
  const[cm,setCm]=useState(new Date().getMonth());const[cy,setCy]=useState(new Date().getFullYear());
  const dim=new Date(cy,cm+1,0).getDate();const fd=new Date(cy,cm,1).getDay();
  const mn=new Date(cy,cm).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  const calDays=[];for(let i=0;i<fd;i++)calDays.push(null);for(let i=1;i<=dim;i++)calDays.push(i);

  const getH=day=>{if(!day)return null;const ds=`${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;return holidays.find(h=>h.date===ds);};
  const isDayOff=(day)=>{if(!day)return false;const ds=`${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;if(overrides[ds]==="working")return false;if(overrides[ds]==="holiday")return true;if(holidays.find(h=>h.date===ds))return true;const dow=new Date(cy,cm,day).getDay();return dow===0||dow===6;};
  const tColors={gazetted:"#10B981",restricted:"#F59E0B",personal:"#3B82F6",trip:"#EC4899",holiday:"#8B5CF6"};

  // Long weekends
  const longWk=useMemo(()=>{const lw=[];holidays.forEach(h=>{if(!h.date||h.date<t)return;const d=new Date(h.date).getDay();
    if(d===5)lw.push({...h,span:"3-day (Fri–Sun)",days:3});else if(d===1)lw.push({...h,span:"3-day (Sat–Mon)",days:3});
    else if(d===4)lw.push({...h,span:"4-day (take Fri off)",days:4});else if(d===2)lw.push({...h,span:"4-day (take Mon off)",days:4});});return lw;},[holidays,t]);

  const handleDayClick=(day)=>{if(!day)return;const ds=`${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;setDayModal({date:ds,day,isOff:isDayOff(day),holiday:getH(day)});};

  return(<div>
    <Tabs tabs={[{id:"calendar",label:"📅 Calendar"},{id:"list",label:"📋 Holidays"},{id:"weekends",label:"🌴 Long Weekends"},{id:"trips",label:"✈️ Trips"}]} active={view} onChange={setView}/>

    {view==="calendar"&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
        <button onClick={()=>{if(cm===0){setCm(11);setCy(cy-1)}else setCm(cm-1)}} style={{background:c.bg3,border:`1px solid ${c.bd}`,borderRadius:"10px",padding:"6px 12px",cursor:"pointer",color:c.tx,fontSize:"16px"}}>‹</button>
        <span style={{fontSize:"15px",fontWeight:600,color:c.tx}}>{mn}</span>
        <button onClick={()=>{if(cm===11){setCm(0);setCy(cy+1)}else setCm(cm+1)}} style={{background:c.bg3,border:`1px solid ${c.bd}`,borderRadius:"10px",padding:"6px 12px",cursor:"pointer",color:c.tx,fontSize:"16px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>
        {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:"10px",fontWeight:600,color:c.t3,padding:"4px"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>
        {calDays.map((day,i)=>{const h=getH(day);const ds=day?`${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`:"";const isT=ds===t;const off=isDayOff(day);
          return <button key={i} onClick={()=>handleDayClick(day)} style={{textAlign:"center",padding:"8px 2px",borderRadius:"10px",fontSize:"12px",
            background:isT?c.ac:h?tColors[h.type]+"18":off&&!h?c.ac+"08":"transparent",
            color:isT?"#fff":h?tColors[h.type]:off?c.ac:c.tx,fontWeight:isT||h?600:400,cursor:day?"pointer":"default",
            border:"none",fontFamily:"'Outfit',sans-serif",position:"relative"}}>
            {day||""}{h&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:tColors[h.type],margin:"2px auto 0"}}/>}
            {day&&overrides[ds]==="working"&&<div style={{position:"absolute",top:"2px",right:"2px",width:"4px",height:"4px",borderRadius:"50%",background:c.wn}}/>}
          </button>;})}
      </div>
      <div style={{display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap"}}>
        <span style={{fontSize:"9px",color:c.t2,display:"flex",alignItems:"center",gap:"2px"}}><span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#10B981"}}/>Gazetted</span>
        <span style={{fontSize:"9px",color:c.t2,display:"flex",alignItems:"center",gap:"2px"}}><span style={{width:"6px",height:"6px",borderRadius:"50%",background:c.ac}}/>Weekend</span>
        <span style={{fontSize:"9px",color:c.t2,display:"flex",alignItems:"center",gap:"2px"}}><span style={{width:"6px",height:"6px",borderRadius:"50%",background:c.wn}}/>Modified</span>
      </div>
    </div>}

    {view==="list"&&<div>
      {holidays.filter(h=>h.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).map(h=><div key={h.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 14px",background:c.bg3,borderRadius:"12px",marginBottom:"5px",borderLeft:`3px solid ${tColors[h.type]||c.bd}`}}>
        <div style={{flex:1}}><div style={{fontSize:"14px",fontWeight:500,color:c.tx}}>{h.name}</div>
          <div style={{fontSize:"11px",color:c.t3}}>{fmtF(h.date)} • {dUntil(h.date)===0?"Today!":dUntil(h.date)===1?"Tomorrow":`in ${dUntil(h.date)} days`}</div>
          {h.type&&<span style={{fontSize:"9px",padding:"1px 5px",borderRadius:"4px",background:tColors[h.type]+"18",color:tColors[h.type],marginTop:"2px",display:"inline-block"}}>{h.type}</span>}
        </div>
        <button onClick={()=>setData(p=>({...p,holidays:p.holidays.filter(x=>x.id!==h.id)}))} style={{background:"none",border:"none",cursor:"pointer",color:c.t3,fontSize:"12px"}}>🗑</button>
      </div>)}
      {holidays.filter(h=>h.date>=t).length===0&&<Empty icon="🎉" title="No upcoming holidays" sub="Add your holidays"/>}
    </div>}

    {view==="weekends"&&<div>
      {longWk.length===0?<Empty icon="🌴" title="No long weekends" sub="Holidays near weekends create these"/>:
      longWk.map((lw,i)=><div key={i} style={{padding:"14px",background:c.gS,borderRadius:"14px",border:`1px solid ${c.bd}`,marginBottom:"8px"}}>
        <div style={{fontSize:"14px",fontWeight:600,color:c.tx}}>{lw.name}</div>
        <div style={{fontSize:"11px",color:c.ac}}>{lw.span}</div>
        <div style={{fontSize:"12px",color:c.t2,marginTop:"4px"}}>{fmtF(lw.date)} • {lw.days} days</div>
        <Btn sz="sm" v="secondary" onClick={()=>{setTripF(p=>({...p,name:`${lw.name} Trip`,startDate:lw.date}));setTripShow(true);}} style={{marginTop:"8px"}}>✈️ Plan trip</Btn>
      </div>)}
    </div>}

    {view==="trips"&&<div>
      {holidays.filter(h=>h.type==="trip").length===0?<Empty icon="✈️" title="No trips" sub="Plan from long weekends!"/>:
      holidays.filter(h=>h.type==="trip").map(t=><div key={t.id} style={{padding:"14px",background:c.bg3,borderRadius:"14px",border:`1px solid ${c.bd}`,marginBottom:"8px"}}>
        <div style={{fontSize:"15px",fontWeight:600,color:c.tx}}>✈️ {t.name}</div>
        <div style={{fontSize:"12px",color:c.t2}}>{fmtF(t.date)}{t.endDate&&` → ${fmtF(t.endDate)}`}</div>
        {t.destination&&<div style={{fontSize:"12px",color:c.ac,marginTop:"2px"}}>📍 {t.destination}</div>}
        {t.budget&&<div style={{fontSize:"12px",color:c.t2}}>💰 {cur(t.budget)}</div>}
      </div>)}
      <Btn v="secondary" onClick={()=>setTripShow(true)} style={{width:"100%",justifyContent:"center",marginTop:"12px"}}>✈️ Plan Trip</Btn>
    </div>}

    <FAB onClick={()=>setShow(true)}/>

    {/* Day click modal */}
    <Modal open={!!dayModal} onClose={()=>setDayModal(null)} title={dayModal?`${fmtF(dayModal.date)}`:"Day"}>
      {dayModal&&<div>
        {dayModal.holiday&&<div style={{padding:"12px",background:tColors[dayModal.holiday.type]+"12",borderRadius:"12px",marginBottom:"12px"}}>
          <div style={{fontSize:"14px",fontWeight:600,color:c.tx}}>{dayModal.holiday.name}</div>
          <span style={{fontSize:"10px",padding:"2px 6px",borderRadius:"4px",background:tColors[dayModal.holiday.type]+"18",color:tColors[dayModal.holiday.type]}}>{dayModal.holiday.type}</span>
        </div>}
        <div style={{fontSize:"13px",color:c.t2,marginBottom:"12px"}}>This day is currently: <strong style={{color:c.tx}}>{dayModal.isOff?"Holiday / Day Off":"Working Day"}</strong></div>
        <div style={{display:"flex",gap:"8px"}}>
          <Btn v={dayModal.isOff?"primary":"secondary"} onClick={()=>{setData(p=>({...p,customDayOverrides:{...p.customDayOverrides,[dayModal.date]:"working"}}));setDayModal(null);}} style={{flex:1,justifyContent:"center"}}>Mark Working</Btn>
          <Btn v={!dayModal.isOff?"primary":"secondary"} onClick={()=>{setData(p=>({...p,customDayOverrides:{...p.customDayOverrides,[dayModal.date]:"holiday"}}));setDayModal(null);}} style={{flex:1,justifyContent:"center"}}>Mark Holiday</Btn>
        </div>
        {overrides[dayModal.date]&&<button onClick={()=>{const o={...overrides};delete o[dayModal.date];setData(p=>({...p,customDayOverrides:o}));setDayModal(null);}}
          style={{display:"block",margin:"10px auto 0",background:"none",border:"none",color:c.t3,fontSize:"12px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Reset to default</button>}
      </div>}
    </Modal>

    {/* Add Holiday */}
    <Modal open={show} onClose={()=>setShow(false)} title="Add Holiday">
      <Inp label="Name" value={f.name} onChange={v=>sf(p=>({...p,name:v}))} ph="e.g. Diwali, Personal Leave"/>
      <Inp label="Date" type="date" value={f.date} onChange={v=>sf(p=>({...p,date:v}))}/>
      <Sel label="Type" value={f.type} onChange={v=>sf(p=>({...p,type:v}))} opts={[{value:"holiday",label:"🎉 Public Holiday"},{value:"restricted",label:"🟡 Restricted"},{value:"personal",label:"🏖️ Personal"},{value:"trip",label:"✈️ Trip"}]}/>
      <Inp label="Activities" value={f.activities} onChange={v=>sf(p=>({...p,activities:v}))} ph="What to do?" multi/>
      <Btn onClick={()=>{if(!f.name.trim()||!f.date)return;setData(p=>({...p,holidays:[...p.holidays,{id:uid(),...f,createdAt:nw()}]}));sf({name:"",date:"",type:"holiday",activities:""});setShow(false);}} disabled={!f.name.trim()||!f.date} sz="lg" style={{width:"100%",justifyContent:"center"}}>Add</Btn>
    </Modal>

    {/* Trip Modal */}
    <Modal open={tripShow} onClose={()=>setTripShow(false)} title="Plan Trip">
      <Inp label="Trip Name" value={tripF.name} onChange={v=>setTripF(p=>({...p,name:v}))} ph="Weekend Getaway"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}><Inp label="Start" type="date" value={tripF.startDate} onChange={v=>setTripF(p=>({...p,startDate:v}))}/><Inp label="End" type="date" value={tripF.endDate} onChange={v=>setTripF(p=>({...p,endDate:v}))}/></div>
      <Inp label="Destination" value={tripF.destination} onChange={v=>setTripF(p=>({...p,destination:v}))} ph="Where?"/>
      <Inp label="Budget (₹)" type="number" value={tripF.budget} onChange={v=>setTripF(p=>({...p,budget:v}))} ph="Estimate"/>
      <Inp label="Packing" value={tripF.packingList} onChange={v=>setTripF(p=>({...p,packingList:v}))} ph="Clothes, charger..." multi/>
      <Btn onClick={()=>{if(!tripF.name.trim())return;setData(p=>({...p,holidays:[...p.holidays,{id:uid(),name:tripF.name,date:tripF.startDate,endDate:tripF.endDate,type:"trip",destination:tripF.destination,budget:tripF.budget,note:tripF.notes,packingList:tripF.packingList,activities:"",createdAt:nw()}]}));setTripF({name:"",startDate:"",endDate:"",destination:"",budget:"",notes:"",packingList:""});setTripShow(false);}} disabled={!tripF.name.trim()} sz="lg" style={{width:"100%",justifyContent:"center"}}>Save Trip</Btn>
    </Modal>
  </div>);
}

// WELLNESS
function WellMod({data,setData}){const c=C[data.theme];const[view,setView]=useState("mood");const t=td();
  const todayM=(data.moodLog||[]).find(m=>m.date===t);const[gratT,setGratT]=useState((data.gratitude||[]).find(g=>g.date===t)?.text||"");
  const[hShow,setHShow]=useState(false);const[hF,setHF]=useState({name:"",icon:"💪",frequency:"daily"});
  const last30=useMemo(()=>{const d=[];for(let i=29;i>=0;i--){const dt=new Date(Date.now()-i*864e5).toISOString().split("T")[0];d.push({date:dt,mood:(data.moodLog||[]).find(x=>x.date===dt)?.mood||null});}return d},[data.moodLog]);
  const logM=id=>setData(p=>{const ex=(p.moodLog||[]).find(m=>m.date===t);return ex?{...p,moodLog:p.moodLog.map(m=>m.date===t?{...m,mood:id}:m)}:{...p,moodLog:[...(p.moodLog||[]),{date:t,mood:id,createdAt:nw()}]};});
  const habits=data.habits||[];const hDone=habits.filter(h=>(h.completions||[]).includes(t));
  const togH=id=>setData(p=>({...p,habits:p.habits.map(h=>h.id!==id?h:{...h,completions:(h.completions||[]).includes(t)?(h.completions||[]).filter(d=>d!==t):[...(h.completions||[]),t]})}));
  const getStr=h=>{let s=0;const cs=new Set(h.completions||[]);for(let i=0;;i++){const d=new Date(Date.now()-i*864e5).toISOString().split("T")[0];if(cs.has(d))s++;else{if(i===0)continue;break;}}return s;};

  return(<div>
    <Tabs tabs={[{id:"mood",label:"😊 Mood"},{id:"habits",label:"🔥 Habits"},{id:"gratitude",label:"🙏 Gratitude"}]} active={view} onChange={setView}/>
    {view==="mood"&&<div>
      <div style={{padding:"18px",background:c.gS,borderRadius:"16px",border:`1px solid ${c.bd}`,marginBottom:"14px",textAlign:"center"}}>
        <div style={{fontSize:"12px",color:c.t2,marginBottom:"10px"}}>How are you feeling?</div>
        <div style={{display:"flex",justifyContent:"center",gap:"8px"}}>{MOODS.map(m=><button key={m.id} onClick={()=>logM(m.id)} style={{
          padding:"10px 12px",borderRadius:"14px",border:`2px solid ${todayM?.mood===m.id?m.c:c.bd}`,background:todayM?.mood===m.id?m.c+"18":c.bg3,cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:"26px"}}>{m.e}</div><div style={{fontSize:"9px",color:todayM?.mood===m.id?m.c:c.t3,marginTop:"2px",fontWeight:500}}>{m.l}</div>
        </button>)}</div>
      </div>
      <div style={{fontSize:"12px",fontWeight:600,color:c.t2,marginBottom:"8px"}}>Last 30 Days</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:"3px"}}>{last30.map((d,i)=>{const mood=MOODS.find(m=>m.id===d.mood);return <div key={i} title={`${d.date}: ${mood?.l||"—"}`} style={{aspectRatio:"1",borderRadius:"4px",background:mood?mood.c:c.bg4,opacity:mood?1:.3}}/>})}</div>
    </div>}
    {view==="habits"&&<div>
      <div style={{padding:"14px 16px",background:c.gS,borderRadius:"16px",border:`1px solid ${c.bd}`,marginBottom:"14px",display:"flex",alignItems:"center",gap:"14px"}}>
        <Ring pct={habits.length?(hDone.length/habits.length)*100:0} color={c.ok}/><div><div style={{fontSize:"14px",fontWeight:600,color:c.tx}}>{hDone.length}/{habits.length}</div><div style={{fontSize:"11px",color:c.t2}}>today</div></div>
      </div>
      {habits.length===0?<Empty icon="🔥" title="No habits" sub="Track daily habits"/>:habits.map(h=>{const done=(h.completions||[]).includes(t);const streak=getStr(h);
        return <div key={h.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 14px",background:c.bg3,borderRadius:"12px",marginBottom:"5px"}}>
          <button onClick={()=>togH(h.id)} style={{width:"36px",height:"36px",borderRadius:"12px",border:`2px solid ${done?c.ok:c.bd}`,background:done?c.ok+"18":c.bg4,cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>{done?"✅":h.icon}</button>
          <div style={{flex:1}}><div style={{fontSize:"14px",fontWeight:500,color:done?c.t3:c.tx}}>{h.name}</div></div>
          {streak>0&&<span style={{fontSize:"12px",color:c.wn,fontWeight:600}}>🔥{streak}</span>}
          <button onClick={()=>setData(p=>({...p,habits:p.habits.filter(x=>x.id!==h.id)}))} style={{background:"none",border:"none",cursor:"pointer",color:c.t3,fontSize:"11px"}}>✕</button>
        </div>})}
      <Btn v="secondary" onClick={()=>setHShow(true)} style={{width:"100%",justifyContent:"center",marginTop:"10px"}}>+ Add Habit</Btn>
      <Modal open={hShow} onClose={()=>setHShow(false)} title="New Habit">
        <Inp label="Habit" value={hF.name} onChange={v=>setHF(p=>({...p,name:v}))} ph="e.g. Drink 8 glasses of water"/>
        <div style={{marginBottom:"12px"}}><label style={{display:"block",marginBottom:"5px",fontSize:"12px",color:c.t2,fontWeight:500}}>Icon</label>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>{["💪","🧘","📚","💧","🏃","🧠","💊","🎵","🌅","😴","🥗","✍️"].map(e=><button key={e} onClick={()=>setHF(p=>({...p,icon:e}))} style={{width:"38px",height:"38px",borderRadius:"10px",fontSize:"20px",border:`2px solid ${hF.icon===e?c.ac:c.bd}`,background:hF.icon===e?c.acG:c.bg4,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{e}</button>)}</div>
        </div>
        <Btn onClick={()=>{if(!hF.name.trim())return;setData(p=>({...p,habits:[...p.habits,{id:uid(),...hF,completions:[],createdAt:nw()}]}));setHF({name:"",icon:"💪",frequency:"daily"});setHShow(false);}} disabled={!hF.name.trim()} sz="lg" style={{width:"100%",justifyContent:"center"}}>Add</Btn>
      </Modal>
    </div>}
    {view==="gratitude"&&<div>
      <div style={{padding:"18px",background:c.gS,borderRadius:"16px",border:`1px solid ${c.bd}`,marginBottom:"14px"}}>
        <div style={{fontSize:"12px",color:c.t2,marginBottom:"8px"}}>🙏 What are you grateful for?</div>
        <textarea value={gratT} onChange={e=>setGratT(e.target.value)} placeholder="Three things..." style={{width:"100%",padding:"12px",background:c.bg3,border:`1px solid ${c.bd}`,borderRadius:"12px",color:c.tx,fontSize:"14px",fontFamily:"'Outfit',sans-serif",outline:"none",resize:"vertical",minHeight:"80px"}}/>
        <Btn onClick={()=>{if(!gratT.trim())return;setData(p=>{const ex=(p.gratitude||[]).find(g=>g.date===t);return ex?{...p,gratitude:p.gratitude.map(g=>g.date===t?{...g,text:gratT}:g)}:{...p,gratitude:[...(p.gratitude||[]),{date:t,text:gratT,createdAt:nw()}]};});}} style={{marginTop:"8px",width:"100%",justifyContent:"center"}}>Save</Btn>
      </div>
      {(data.gratitude||[]).filter(g=>g.date!==t).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map(g=><div key={g.date} style={{padding:"10px 14px",background:c.bg3,borderRadius:"10px",marginBottom:"4px"}}>
        <div style={{fontSize:"10px",color:c.t3,marginBottom:"3px"}}>{fmtF(g.date)}</div>
        <div style={{fontSize:"13px",color:c.tx,lineHeight:1.5}}>{g.text}</div>
      </div>)}
    </div>}
  </div>);
}

// MISC
function MiscMod({data,setData}){const c=C[data.theme];const[show,setShow]=useState(false);const[f,sf]=useState({content:""});
  const misc=(data.misc||[]).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  const move=(item,mod)=>{setData(p=>{const ns={...p,misc:p.misc.filter(m=>m.id!==item.id)};
    if(mod==="notes")ns.notes=[...p.notes,{id:uid(),title:item.content.substring(0,50),content:item.content,tags:[],status:"raw",pinned:false,createdAt:nw(),updatedAt:nw()}];
    else if(mod==="tasks")ns.tasks=[...p.tasks,{id:uid(),name:item.content,note:"",dueDate:td(),dueTime:"",category:"errands",priority:"medium",estimatedMinutes:30,repeat:"none",subtasks:[],status:"todo",tags:[],energy:"",context:"",goalType:"daily",createdAt:nw()}];
    else if(mod==="reminders")ns.reminders=[...p.reminders,{id:uid(),title:item.content,date:td(),time:"",repeat:"none",type:"general",done:false,createdAt:nw()}];return ns;});};
  return(<div>
    {misc.length===0?<Empty icon="📎" title="Inbox empty" sub="Quick dump anything"/>:
    misc.map(item=><div key={item.id} style={{padding:"12px 14px",background:c.bg3,borderRadius:"12px",marginBottom:"6px",border:`1px solid ${c.bd}`}}>
      <div style={{fontSize:"13px",color:c.tx,marginBottom:"6px",lineHeight:1.5}}>{item.content}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:"10px",color:c.t3}}>{fmt(item.createdAt)}</span>
        <div style={{display:"flex",gap:"3px"}}>
          {["tasks","notes","reminders"].map(m=><button key={m} onClick={()=>move(item,m)} style={{padding:"2px 7px",fontSize:"9px",borderRadius:"6px",border:`1px solid ${c.bd}`,background:c.bg4,color:c.t2,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>→{m}</button>)}
          <button onClick={()=>setData(p=>({...p,misc:p.misc.filter(m=>m.id!==item.id)}))} style={{background:"none",border:"none",cursor:"pointer",color:c.t3,fontSize:"11px"}}>🗑</button>
        </div>
      </div>
    </div>)}
    <FAB onClick={()=>setShow(true)}/>
    <Modal open={show} onClose={()=>setShow(false)} title="Quick Capture">
      <Inp value={f.content} onChange={v=>sf({content:v})} ph="Type anything..." multi style={{minHeight:"100px"}}/>
      <Btn onClick={()=>{if(!f.content.trim())return;setData(p=>({...p,misc:[...p.misc,{id:uid(),content:f.content.trim(),createdAt:nw()}]}));sf({content:""});setShow(false);}} disabled={!f.content.trim()} sz="lg" style={{width:"100%",justifyContent:"center"}}>Save</Btn>
    </Modal>
  </div>);
}

// PROFILE & SETTINGS with Summary Dashboard
function ProfMod({data,setData,onReset,onShowIntro}){const c=C[data.theme];
  const totalExp=(data.expenses||[]).reduce((s,e)=>s+Number(e.amount),0);
  const thisMonthExp=(data.expenses||[]).filter(e=>{const ms=new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().split("T")[0];return e.date>=ms;}).reduce((s,e)=>s+Number(e.amount),0);
  const tasksDone=(data.tasks||[]).filter(t=>t.status==="done").length;
  const exportD=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`lifepad-${td()}.json`;a.click();URL.revokeObjectURL(u);};
  const exportCSV=type=>{let csv="";if(type==="tasks"){csv="Name,Category,Priority,Status,Due Date\n";data.tasks.forEach(t=>csv+=`"${t.name}","${t.category}","${t.priority}","${t.status}","${t.dueDate}"\n`);}
    else{csv="Amount,Category,Note,Date\n";data.expenses.forEach(e=>csv+=`${e.amount},"${e.category}","${e.note||""}","${e.date}"\n`);}
    const b=new Blob([csv],{type:"text/csv"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`lifepad-${type}-${td()}.csv`;a.click();URL.revokeObjectURL(u);};

  return(<div>
    <div style={{padding:"20px",background:c.gS,borderRadius:"16px",border:`1px solid ${c.bd}`,marginBottom:"14px",textAlign:"center"}}>
      <div style={{width:"56px",height:"56px",borderRadius:"18px",background:c.gr,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:"26px",boxShadow:"0 4px 16px rgba(124,106,255,.3)"}}>✨</div>
      <div style={{fontSize:"20px",fontWeight:700,color:c.tx,fontFamily:"'Playfair Display',serif"}}>LifePad</div>
      <div style={{fontSize:"11px",color:c.t3,marginTop:"2px"}}>{data.mode==="guest"?"Guest Mode":"Logged In"} • v3.0</div>
    </div>

    <Inp label="Your Name" value={data.userName} onChange={v=>setData(p=>({...p,userName:v}))} ph="Your name"/>

    {/* Summary Dashboard */}
    <div style={{marginBottom:"14px"}}>
      <div style={{fontSize:"13px",fontWeight:600,color:c.tx,marginBottom:"8px"}}>📊 Summary Dashboard</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px"}}>
        {[{l:"Tasks",c:data.tasks?.length||0,i:"✅"},{l:"Done",c:tasksDone,i:"🎯"},
          {l:"Notes",c:data.notes?.length||0,i:"💡"},{l:"Expenses",c:data.expenses?.length||0,i:"💰"},
          {l:"This Month",c:cur(thisMonthExp),i:"📊"},{l:"Total Spent",c:cur(totalExp),i:"💸"},
          {l:"Habits",c:data.habits?.length||0,i:"🔥"},{l:"Collections",c:data.collections?.length||0,i:"📋"},
          {l:"Holidays",c:data.holidays?.length||0,i:"🎉"},
        ].map(s=><div key={s.l} style={{padding:"10px",background:c.bg3,borderRadius:"12px",textAlign:"center"}}>
          <div style={{fontSize:"16px",marginBottom:"2px"}}>{s.i}</div>
          <div style={{fontSize:typeof s.c==="string"?"12px":"16px",fontWeight:700,color:c.tx,fontFamily:"'JetBrains Mono',monospace"}}>{s.c}</div>
          <div style={{fontSize:"8px",color:c.t3}}>{s.l}</div>
        </div>)}
      </div>
    </div>

    {/* Theme */}
    <div style={{marginBottom:"14px"}}>
      <label style={{display:"block",marginBottom:"6px",fontSize:"12px",color:c.t2,fontWeight:500}}>Theme</label>
      <div style={{display:"flex",gap:"8px"}}>{["dark","light"].map(t=><button key={t} onClick={()=>setData(p=>({...p,theme:t}))} style={{
        flex:1,padding:"12px",borderRadius:"14px",border:`2px solid ${data.theme===t?c.ac:c.bd}`,
        background:data.theme===t?c.acG:c.bg3,cursor:"pointer",color:c.tx,fontFamily:"'Outfit',sans-serif",fontSize:"13px",fontWeight:500}}>
        {t==="dark"?"🌙 Dark":"☀️ Light"}</button>)}</div>
    </div>

    {/* Quick Actions */}
    <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"14px"}}>
      <Btn v="secondary" onClick={onShowIntro} style={{width:"100%",justifyContent:"center"}}>📖 View App Intro</Btn>
      <Btn v="secondary" onClick={exportD} style={{width:"100%",justifyContent:"center"}}>📥 Full Backup (JSON)</Btn>
      <Btn v="secondary" onClick={()=>exportCSV("tasks")} style={{width:"100%",justifyContent:"center"}}>📊 Tasks CSV</Btn>
      <Btn v="secondary" onClick={()=>exportCSV("expenses")} style={{width:"100%",justifyContent:"center"}}>💰 Expenses CSV</Btn>
      <Btn v="danger" onClick={()=>{if(confirm("Reset all data?"))onReset()}} style={{width:"100%",justifyContent:"center"}}>🗑️ Reset All Data</Btn>
    </div>
  </div>);
}

// HOME DASHBOARD
function Home({data,setData,nav}){const c=C[data.theme];const t=td();
  const tT=(data.tasks||[]).filter(x=>x.dueDate===t);const dC=tT.filter(x=>x.status==="done").length;const pct=tT.length?(dC/tT.length)*100:0;
  const tExp=(data.expenses||[]).filter(e=>e.date===t).reduce((s,e)=>s+Number(e.amount),0);
  const missC=(data.tasks||[]).filter(x=>x.status!=="done"&&x.dueDate&&x.dueDate<t).length;
  const topT=tT.filter(x=>x.status!=="done").sort((a,b)=>({urgent:0,high:1,medium:2,low:3}[a.priority]||2)-({urgent:0,high:1,medium:2,low:3}[b.priority]||2)).slice(0,3);
  const todayM=(data.moodLog||[]).find(m=>m.date===t);
  const hTotal=(data.habits||[]).length;const hDone=(data.habits||[]).filter(h=>(h.completions||[]).includes(t)).length;
  const nextH=(data.holidays||[]).filter(h=>h.date>=t).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const[qT,setQT]=useState("");
  const qAdd=()=>{if(!qT.trim())return;setData(p=>({...p,tasks:[...p.tasks,{id:uid(),name:qT.trim(),note:"",dueDate:t,dueTime:"",category:"errands",priority:"medium",estimatedMinutes:30,repeat:"none",subtasks:[],status:"todo",tags:[],energy:"",context:"",goalType:"daily",createdAt:nw()}]}));setQT("");};
  const mods=[{id:"tasks",icon:"✅",l:"Tasks",s:`${dC}/${tT.length}`,color:"#7C6AFF"},{id:"expenses",icon:"💰",l:"Expenses",s:cur(tExp),color:"#10B981"},
    {id:"notes",icon:"💡",l:"Ideas",s:`${data.notes?.length||0}`,color:"#F59E0B"},{id:"reminders",icon:"🔔",l:"Reminders",s:`${(data.reminders||[]).filter(r=>!r.done).length}`,color:"#EC4899"},
    {id:"collections",icon:"📋",l:"Collections",s:`${data.collections?.length||0}`,color:"#3B82F6"},{id:"holidays",icon:"🌴",l:"Holidays",s:nextH?`${dUntil(nextH.date)}d`:"—",color:"#14B8A6"},
    {id:"wellness",icon:"😊",l:"Wellness",s:hTotal?`${hDone}/${hTotal}`:"start",color:"#8B5CF6"},{id:"misc",icon:"📎",l:"Inbox",s:`${data.misc?.length||0}`,color:"#78716C"}];

  return(<div>
    <div style={{marginBottom:"16px"}}><div style={{fontSize:"13px",color:c.t2}}>{greet()}{data.userName?`, ${data.userName}`:""} 👋</div>
      <div style={{fontSize:"22px",fontWeight:700,color:c.tx,fontFamily:"'Playfair Display',serif"}}>{dayN()}, {fmt(t)}</div></div>
    <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
      <div style={{flex:2,padding:"14px 16px",background:c.gS,borderRadius:"16px",border:`1px solid ${c.bd}`,display:"flex",alignItems:"center",gap:"12px"}}>
        <Ring pct={pct} size={50} color={pct===100?c.ok:c.ac}><span style={{fontSize:"12px"}}>{Math.round(pct)}%</span></Ring>
        <div><div style={{fontSize:"13px",fontWeight:600,color:c.tx}}>{pct===100?"All done! 🎉":`${tT.length-dC} left`}</div>
          <div style={{fontSize:"10px",color:c.t2}}>{tT.length} tasks{missC>0?` • ⚠️${missC}`:""}</div></div>
      </div>
      <div style={{flex:1,padding:"14px",background:c.bg3,borderRadius:"16px",border:`1px solid ${c.bd}`,textAlign:"center",cursor:"pointer"}} onClick={()=>nav("wellness")}>
        <div style={{fontSize:"26px"}}>{todayM?MOODS.find(m=>m.id===todayM.mood)?.e||"😊":"😊"}</div>
        <div style={{fontSize:"9px",color:c.t3,marginTop:"2px"}}>{todayM?"logged":"log mood"}</div>
      </div>
    </div>
    <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
      <input value={qT} onChange={e=>setQT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&qAdd()} placeholder="⚡ Quick add task..."
        style={{flex:1,padding:"11px 16px",background:c.bg3,border:`1px solid ${c.bd}`,borderRadius:"14px",color:c.tx,fontSize:"13px",fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
      <button onClick={qAdd} style={{padding:"11px 16px",background:c.gr,border:"none",borderRadius:"14px",color:"#fff",cursor:"pointer",fontSize:"16px"}}>+</button>
    </div>
    {topT.length>0&&<div style={{marginBottom:"14px"}}><div style={{fontSize:"11px",fontWeight:600,color:c.t2,marginBottom:"6px",textTransform:"uppercase",letterSpacing:".5px"}}>🎯 Top priorities</div>
      {topT.map(task=><div key={task.id} onClick={()=>nav("tasks")} style={{display:"flex",alignItems:"center",gap:"8px",padding:"9px 14px",background:c.bg3,borderRadius:"10px",marginBottom:"3px",cursor:"pointer",borderLeft:`3px solid ${PRIS.find(p=>p.id===task.priority)?.c||c.bd}`}}>
        <span style={{fontSize:"12px",color:c.tx,flex:1}}>{task.name}</span>
        {task.estimatedMinutes&&<span style={{fontSize:"9px",color:c.t3}}>{task.estimatedMinutes}m</span>}
      </div>)}</div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
      {mods.map(m=><button key={m.id} onClick={()=>nav(m.id)} style={{padding:"16px 14px",borderRadius:"16px",border:`1px solid ${c.bd}`,background:c.bg3,cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-8px",right:"-8px",width:"40px",height:"40px",borderRadius:"50%",background:m.color+"0D"}}/>
        <div style={{fontSize:"24px",marginBottom:"6px"}}>{m.icon}</div>
        <div style={{fontSize:"13px",fontWeight:600,color:c.tx}}>{m.l}</div>
        <div style={{fontSize:"11px",color:c.t3,fontFamily:"'JetBrains Mono',monospace"}}>{m.s}</div>
      </button>)}
    </div>
    {nextH&&<div onClick={()=>nav("holidays")} style={{padding:"12px 16px",background:c.gS,borderRadius:"14px",border:`1px solid ${c.bd}`,cursor:"pointer",display:"flex",alignItems:"center",gap:"10px"}}>
      <span style={{fontSize:"22px"}}>🌴</span><div style={{flex:1}}>
        <div style={{fontSize:"13px",fontWeight:500,color:c.tx}}>{nextH.name}</div>
        <div style={{fontSize:"10px",color:c.t2}}>{fmtF(nextH.date)} • {dUntil(nextH.date)===0?"Today!":dUntil(nextH.date)===1?"Tomorrow":`in ${dUntil(nextH.date)} days`}</div>
      </div></div>}
  </div>);
}

// ============================================================
// MAIN APP
// ============================================================
export default function App(){
  const[data,setDataRaw]=useState(()=>ld()||INIT);
  const setData=useCallback(u=>{setDataRaw(p=>{const n=typeof u==="function"?u(p):u;sv(n);return n;})},[]);
  const[mod,setMod]=useState("home");
  const[showIntro,setShowIntro]=useState(false);
  const[menuOpen,setMenuOpen]=useState(false);

  useEffect(()=>{document.body.dataset.t=data.theme},[data.theme]);

  // Onboarding
  if(!data.onboarded) return <Onboarding onDone={prefs=>setData(p=>({...p,onboarded:true,introSeen:true,userName:prefs.name,theme:prefs.theme}))}/>;

  // Show intro slides from menu
  if(showIntro){
    const slides=[
      {icon:"✅",title:"Smart Task Management",desc:"Plan by day, week, month. 12 categories. Max 15 per category. Priority, energy, context tags."},
      {icon:"💰",title:"Expense Tracking",desc:"Quick entry with UPI/cash/card. Daily, weekly, monthly breakdown with category charts."},
      {icon:"💡",title:"Ideas & Notes",desc:"Capture, tag, pin, organize. Status pipeline: Raw → Actionable → Archived."},
      {icon:"🔔",title:"Reminders",desc:"Birthdays, bills, deadlines. One-time or recurring with priority levels."},
      {icon:"📋",title:"Collections",desc:"Unlimited lists with dates and personal notes per item. Movies, books, anything."},
      {icon:"🌴",title:"Holiday & Trip Planner",desc:"Auto-loaded govt holidays. Long weekend detection. Trip planner with budget tracking."},
      {icon:"😊",title:"Wellness Hub",desc:"Mood tracking, habit streaks, gratitude journal. Year-in-pixels mood map."},
      {icon:"📎",title:"Quick Inbox",desc:"Dump anything fast. Route to tasks, notes, or reminders later."},
    ];
    const[si,setSi]=useState(0);
    return(<div style={{minHeight:"100vh",background:C[data.theme].bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",padding:"20px",textAlign:"center"}}>
      <div style={{fontSize:"64px",marginBottom:"16px"}}>{slides[si].icon}</div>
      <h2 style={{color:C[data.theme].tx,fontSize:"20px",fontWeight:700,margin:"0 0 8px"}}>{slides[si].title}</h2>
      <p style={{color:C[data.theme].t2,fontSize:"13px",lineHeight:1.7,maxWidth:"300px",margin:"0 0 24px"}}>{slides[si].desc}</p>
      <div style={{display:"flex",gap:"6px",marginBottom:"20px"}}>{slides.map((_,i)=><div key={i} style={{width:i===si?"18px":"6px",height:"6px",borderRadius:"3px",background:i===si?C[data.theme].ac:C[data.theme].bd,transition:"all .3s"}}/>)}</div>
      <div style={{display:"flex",gap:"10px",width:"100%",maxWidth:"300px"}}>
        <Btn v="secondary" onClick={()=>setShowIntro(false)} style={{flex:1,justifyContent:"center"}}>Close</Btn>
        <Btn onClick={()=>{if(si<slides.length-1)setSi(si+1);else setShowIntro(false);}} style={{flex:2,justifyContent:"center"}}>{si===slides.length-1?"Done":"Next"}</Btn>
      </div>
    </div>);
  }

  const c=C[data.theme];
  const labels={home:"LifePad",tasks:"Tasks",expenses:"Expenses",notes:"Ideas",reminders:"Reminders",collections:"Collections",holidays:"Holidays & Trips",wellness:"Wellness",misc:"Inbox",profile:"Profile"};
  const render=()=>{switch(mod){
    case"home":return<Home data={data} setData={setData} nav={setMod}/>;
    case"tasks":return<TasksMod data={data} setData={setData}/>;
    case"expenses":return<ExpMod data={data} setData={setData}/>;
    case"notes":return<NotesMod data={data} setData={setData}/>;
    case"reminders":return<RemMod data={data} setData={setData}/>;
    case"collections":return<CollMod data={data} setData={setData}/>;
    case"holidays":return<HolMod data={data} setData={setData}/>;
    case"wellness":return<WellMod data={data} setData={setData}/>;
    case"misc":return<MiscMod data={data} setData={setData}/>;
    case"profile":return<ProfMod data={data} setData={setData} onReset={()=>{setData(INIT);setMod("home");}} onShowIntro={()=>setShowIntro(true)}/>;
    default:return null;}};

  const navItems=[{id:"home",icon:"🏠",label:"Home"},{id:"tasks",icon:"✅",label:"Tasks"},{id:"wellness",icon:"😊",label:"Wellness"},{id:"holidays",icon:"🌴",label:"Holidays"},{id:"profile",icon:"👤",label:"Profile"}];

  return(<div style={{minHeight:"100vh",background:c.bg,fontFamily:"'Outfit',sans-serif",color:c.tx,maxWidth:"480px",margin:"0 auto",position:"relative"}}>
    {/* Top Bar */}
    <div style={{position:"sticky",top:0,zIndex:50,background:c.bg+"F0",backdropFilter:"blur(16px)",borderBottom:`1px solid ${c.bd}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        {mod!=="home"&&<button onClick={()=>setMod("home")} style={{background:"none",border:"none",cursor:"pointer",color:c.t2,fontSize:"18px",padding:"2px"}}>←</button>}
        <h1 style={{margin:0,fontSize:mod==="home"?"18px":"16px",fontWeight:700,color:c.tx,fontFamily:mod==="home"?"'Playfair Display',serif":"'Outfit',sans-serif"}}>{labels[mod]}</h1>
      </div>
      <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
        <button onClick={()=>setData(p=>({...p,theme:p.theme==="dark"?"light":"dark"}))} style={{background:c.bg3,border:`1px solid ${c.bd}`,borderRadius:"10px",padding:"6px 8px",cursor:"pointer",color:c.t2,display:"flex",fontSize:"14px"}}>{data.theme==="dark"?"☀️":"🌙"}</button>
        <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:c.bg3,border:`1px solid ${c.bd}`,borderRadius:"10px",padding:"6px 8px",cursor:"pointer",color:c.t2,display:"flex",fontSize:"14px"}}>☰</button>
      </div>
    </div>

    {/* Side Menu */}
    {menuOpen&&<div style={{position:"fixed",inset:0,zIndex:200}} onClick={()=>setMenuOpen(false)}>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",top:0,right:0,width:"280px",height:"100vh",background:c.bg2,borderLeft:`1px solid ${c.bd}`,padding:"20px",overflowY:"auto",animation:"sr .3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <h3 style={{margin:0,fontSize:"16px",fontWeight:600,color:c.tx}}>Menu</h3>
          <button onClick={()=>setMenuOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:c.t2,fontSize:"16px"}}>✕</button>
        </div>
        {data.userName&&<div style={{padding:"12px",background:c.gS,borderRadius:"12px",marginBottom:"14px"}}>
          <div style={{fontSize:"14px",fontWeight:600,color:c.tx}}>👤 {data.userName}</div>
          <div style={{fontSize:"11px",color:c.t3}}>{data.mode==="guest"?"Guest Mode":"Logged In"}</div>
        </div>}
        {/* Quick stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"14px"}}>
          <div style={{padding:"10px",background:c.bg3,borderRadius:"10px",textAlign:"center"}}><div style={{fontSize:"16px",fontWeight:700,color:c.tx}}>{data.tasks?.length||0}</div><div style={{fontSize:"9px",color:c.t3}}>Tasks</div></div>
          <div style={{padding:"10px",background:c.bg3,borderRadius:"10px",textAlign:"center"}}><div style={{fontSize:"14px",fontWeight:700,color:c.tx}}>{cur((data.expenses||[]).reduce((s,e)=>s+Number(e.amount),0))}</div><div style={{fontSize:"9px",color:c.t3}}>Total Spent</div></div>
        </div>
        {/* Nav */}
        {[{id:"home",icon:"🏠",l:"Home"},{id:"tasks",icon:"✅",l:"Tasks"},{id:"expenses",icon:"💰",l:"Expenses"},{id:"notes",icon:"💡",l:"Ideas"},{id:"reminders",icon:"🔔",l:"Reminders"},
          {id:"collections",icon:"📋",l:"Collections"},{id:"holidays",icon:"🌴",l:"Holidays"},{id:"wellness",icon:"😊",l:"Wellness"},{id:"misc",icon:"📎",l:"Inbox"},{id:"profile",icon:"⚙️",l:"Settings"}]
          .map(item=><button key={item.id} onClick={()=>{setMod(item.id);setMenuOpen(false);}} style={{
            display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",background:mod===item.id?c.acG:"transparent",border:"none",borderRadius:"10px",cursor:"pointer",marginBottom:"2px",color:mod===item.id?c.ac:c.tx,fontFamily:"'Outfit',sans-serif",fontSize:"14px",fontWeight:mod===item.id?600:400}}>
            <span style={{fontSize:"18px"}}>{item.icon}</span>{item.l}
          </button>)}
        <div style={{borderTop:`1px solid ${c.bd}`,paddingTop:"12px",marginTop:"12px"}}>
          <button onClick={()=>{setShowIntro(true);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",background:"transparent",border:"none",borderRadius:"10px",cursor:"pointer",color:c.t2,fontFamily:"'Outfit',sans-serif",fontSize:"14px"}}>📖 App Intro</button>
        </div>
      </div>
      <style>{`@keyframes sr{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </div>}

    {/* Content */}
    <div style={{padding:"14px 20px 100px"}}>{render()}</div>

    {/* Bottom Nav */}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",background:c.bg2+"F5",backdropFilter:"blur(16px)",borderTop:`1px solid ${c.bd}`,display:"flex",justifyContent:"space-around",padding:"6px 0 env(safe-area-inset-bottom, 8px)",zIndex:50}}>
      {navItems.map(item=><button key={item.id} onClick={()=>setMod(item.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1px",padding:"5px 14px",background:"none",border:"none",cursor:"pointer",borderRadius:"10px"}}>
        <span style={{fontSize:"20px",opacity:mod===item.id?1:.4}}>{item.icon}</span>
        <span style={{fontSize:"9px",fontWeight:mod===item.id?600:400,color:mod===item.id?c.ac:c.t3,fontFamily:"'Outfit',sans-serif"}}>{item.label}</span>
        {mod===item.id&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:c.ac,marginTop:"1px"}}/>}
      </button>)}
    </div>

    <style>{`*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}body{margin:0;background:${c.bg};overflow-x:hidden}input,textarea,select,button{font-family:'Outfit',sans-serif}input:focus,textarea:focus,select:focus{border-color:${c.ac}!important}::placeholder{color:${c.t3}}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${c.bd};border-radius:3px}option{background:${c.bg2};color:${c.tx}}@media(min-width:768px){body{display:flex;justify-content:center}}`}</style>
  </div>);
}
