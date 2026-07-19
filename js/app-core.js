const PLAN=window.PLAN;const ERAS=[...new Map(PLAN.map(x=>[x.era,{name:x.era,theme:x.theme,start:x.day,end:x.day}])).values()];PLAN.forEach(p=>ERAS.find(x=>x.name===p.era).end=p.day);const KEY="bible-history-reader-v1",defaultState={version:3,settings:{startDate:new Date().toISOString().slice(0,10),mode:"pace",theme:"system",fontSize:16,translation:"si"},progress:{},notes:{},selectedDay:1};let state=load();const views=[["today","今日"],["plan","通読表"],["history","歴史"],["notes","記録"],["settings","設定"]];
function load(){try{let x=JSON.parse(localStorage.getItem(KEY)||"{}");return {...defaultState,...x,settings:{...defaultState.settings,...(x.settings||{})}}}catch(e){return JSON.parse(JSON.stringify(defaultState))}}function save(){localStorage.setItem(KEY,JSON.stringify(state))}function doneCount(){return Object.values(state.progress).filter(x=>x==="completed").length}function nextDay(){for(let i=1;i<=365;i++)if(state.progress[i]!=="completed")return i;return 365}function scheduledDay(){const a=new Date(state.settings.startDate+"T00:00:00"),b=new Date();return Math.max(1,Math.min(365,Math.floor((b-a)/86400000)+1))}function currentDay(){return state.settings.mode==="calendar"?scheduledDay():nextDay()}function pct(){return Math.round(doneCount()/365*1000)/10}function applyTheme(){const t=state.settings.theme==="system"?(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"):state.settings.theme;document.documentElement.dataset.theme=t;document.documentElement.style.fontSize=state.settings.fontSize+"px"}function toast(m){const e=document.getElementById("toast");e.textContent=m;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}function navHtml(){return views.map(([id,l])=>`<button class="navbtn ${id==="today"?"active":""}" data-view="${id}">${l}</button>`).join("")}sidebar.innerHTML=navHtml();mobileNav.innerHTML=navHtml();document.addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)showView(b.dataset.view)});function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));render(id);scrollTo({top:0,behavior:"smooth"})}function render(id){applyTheme();headerProgress.textContent=`${doneCount()} / 365日 ・ ${pct()}%`;({today:renderToday,plan:renderPlan,history:renderHistory,notes:renderNotes,settings:renderSettings}[id]||renderToday)()}function dayData(d){return PLAN[Math.max(1,Math.min(365,d))-1]}function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
const BIBLE_BOOKS=window.BIBLE_BOOKS;
const BIBLE_BOOK_KEYS=Object.keys(BIBLE_BOOKS).sort((a,b)=>b.length-a.length);
function parseReadingForLinks(label){
  const groups=new Map();let currentBook=null;
  String(label).split("、").forEach(raw=>{
    let token=raw.trim(),matched=BIBLE_BOOK_KEYS.find(k=>token.startsWith(k));
    if(matched){currentBook=matched;token=token.slice(matched.length)}
    if(!currentBook||!BIBLE_BOOKS[currentBook])return;
    const nums=token.match(/\d+(?::\d+)?(?:～\d+(?::\d+)?)?/);if(!nums)return;
    const range=nums[0],parts=range.split("～"),left=parts[0],right=parts[1]||null;
    const startChapter=parseInt(left.split(":")[0],10);let endChapter=startChapter;
    if(right){endChapter=left.includes(":")&&!right.includes(":")?startChapter:parseInt(right.split(":")[0],10)}
    if(!Number.isFinite(startChapter)||!Number.isFinite(endChapter))return;
    if(!groups.has(currentBook))groups.set(currentBook,new Set());
    for(let c=startChapter;c<=endChapter;c++)groups.get(currentBook).add(c);
  });
  return [...groups.entries()].map(([book,chapters])=>({book,chapters:[...chapters].sort((a,b)=>a-b)}));
}
function renderBibleLinks(label){
  const groups=parseReadingForLinks(label);
  if(!groups.length)return `<div class="small">聖書箇所を自動判定できませんでした。</div>`;
  return `<div class="small">「ともに聴く聖書」で本文を読み、音声を再生できます。</div>`+groups.map(g=>{const meta=BIBLE_BOOKS[g.book];return `<div class="chapter-group"><div class="chapter-group-head"><span class="chapter-group-title">${esc(meta.titleNi)}</span><span class="small">該当章</span></div><div class="chapter-buttons">${g.chapters.map(c=>`<button type="button" class="chapter-btn" data-bible-book="${g.book}" data-bible-chapter="${c}" title="${esc(meta.titleNi)} ${c}章をともに聴く聖書で開く">${c}章</button>`).join("")}</div></div>`}).join("");
}
function openBibleChapter(bookKey,chapter){
  const book=BIBLE_BOOKS[bookKey];
  const chapterNumber=Number(chapter);
  if(!book||!Number.isInteger(chapterNumber)||chapterNumber<1)return;
  const url=`https://prs.app/ja/bible/${book.code}.${chapterNumber}.jdb`;
  const opened=window.open(url,"_blank","noopener,noreferrer");
  if(!opened)location.href=url;
}
