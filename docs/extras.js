(()=>{"use strict";
const $=id=>document.getElementById(id),AI=(window.NEWSIFT_AI_URL||"").trim();
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const css=`
.topbar{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:var(--surface)!important;transition:height .3s ease,box-shadow .3s ease}
.topbar.shrunk{height:60px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
button,.tab-btn,.icon-btn,.save,.read,.search,.archive-bar,.news-card,.detail-dialog{will-change:auto!important}
.hero:before{transform:translate3d(0,var(--py,0px),0)}
.news-card.rv{animation:none!important;opacity:0;transform:translate3d(0,30px,0) scale(.985);transition:opacity .65s cubic-bezier(.2,.8,.2,1),transform .65s cubic-bezier(.2,.8,.2,1)}
.news-card.rv.in{opacity:1;transform:none}
.news-card.seen{animation:none!important}
.section-head.rv,.news-tabs.rv{opacity:0;transform:translate3d(0,18px,0);transition:opacity .6s ease,transform .6s ease;animation:none!important}
.section-head.rv.in,.news-tabs.rv.in{opacity:1;transform:none}
.ai-btn{color:var(--brand);border-color:color-mix(in srgb,var(--brand) 45%,var(--line));font-family:var(--ur-body);white-space:nowrap}
.ask-dana{margin-top:16px;border:1px solid var(--brand);background:var(--brand2);color:var(--brand);border-radius:13px;padding:11px 16px;font:700 14px var(--ur-body);cursor:pointer;transition:transform .2s ease}
.ask-dana:active{transform:scale(.97)}
#aiDlg{width:min(680px,calc(100% - 16px));max-height:88vh;margin:auto auto 8px;padding:0;border:1px solid var(--line);border-radius:22px;background:var(--surface);color:var(--ink);overflow:hidden}
#aiDlg[open]{display:flex;flex-direction:column;animation:aiUp .35s cubic-bezier(.2,.8,.2,1) both}
#aiDlg::backdrop{background:rgba(3,5,9,.7)}
@keyframes aiUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
.ai-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--line)}
.ai-head b{font:700 20px var(--ur-head);color:var(--brand);display:block;line-height:2}
.ai-head small{color:var(--muted);font-size:11px}
.ai-ctx{margin:10px 14px 0;padding:8px 12px;border-radius:12px;background:var(--brand2);font-size:12px;line-height:1.9;color:var(--ink)}
.ai-msgs{flex:1;min-height:180px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.ai-b{max-width:92%;padding:10px 14px;border-radius:16px;line-height:2.1;font:15px var(--ur-body);white-space:pre-wrap;word-break:break-word;animation:aiB .3s ease both}
.ai-b.u{align-self:flex-start;background:var(--brand);color:var(--on-brand)}
.ai-b.a{align-self:flex-end;background:var(--bg);border:1px solid var(--line)}
.ai-src{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;font:12px Inter,sans-serif}
.ai-src b{width:100%;font:700 12px var(--ur-body);color:var(--muted)}
.ai-src a{color:var(--brand);border:1px solid var(--line);border-radius:9px;padding:3px 9px;text-decoration:none;direction:ltr}
.ai-dots span{display:inline-block;width:7px;height:7px;margin:0 2px;border-radius:50%;background:var(--brand);animation:aiD 1s infinite ease-in-out}
.ai-dots span:nth-child(2){animation-delay:.15s}.ai-dots span:nth-child(3){animation-delay:.3s}
@keyframes aiD{0%,80%,100%{opacity:.25;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
@keyframes aiB{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ai-chips{display:flex;gap:8px;overflow-x:auto;padding:4px 14px 10px;scrollbar-width:none}
.ai-chips button{flex:none;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:20px;padding:6px 13px;font:13px var(--ur-body);cursor:pointer}
.ai-form{display:flex;gap:8px;padding:10px 14px 14px;border-top:1px solid var(--line)}
.ai-form textarea{flex:1;resize:none;border:1px solid var(--line);border-radius:14px;background:var(--bg);color:var(--ink);padding:10px 12px;font:15px/1.9 var(--ur-body);outline:none;max-height:110px}
.ai-form textarea:focus{border-color:var(--brand)}
.ai-send{width:46px;border:0;border-radius:14px;background:var(--brand);color:var(--on-brand);font-size:18px;cursor:pointer}
.ai-send:disabled{opacity:.5}
@media(prefers-reduced-motion:reduce){.news-card.rv,.section-head.rv,.news-tabs.rv{opacity:1;transform:none}}
`;
const st=document.createElement("style");st.textContent=css+"\n.full-story-btn{display:block;width:100%;margin-top:10px}\n.generated-story{margin:18px 0;padding:18px;border:1px solid var(--line);border-radius:16px;background:var(--bg);color:var(--ink);line-height:2.15}\n.generated-story h2{font:700 20px var(--ur-head);margin:0 0 12px;color:var(--brand)}\n.generated-story-text{white-space:pre-wrap;overflow-wrap:anywhere;font:16px/2.2 var(--ur-body)}\n.generated-story-sources{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;padding-top:14px;border-top:1px solid var(--line)}\n.generated-story-sources h3{width:100%;font:700 16px var(--ur-head)}\n.generated-story-sources a{display:inline-block;padding:7px 11px;border:1px solid var(--line);border-radius:10px;color:var(--brand);text-decoration:none;font:13px Inter,sans-serif;direction:ltr}\n.story-loading{color:var(--muted);font:14px/2 var(--ur-body)}\n";document.head.append(st);

/* ---------- smooth scroll reveal ---------- */
if(!reduce&&"IntersectionObserver"in window){
  const io=new IntersectionObserver(es=>{let i=0;es.forEach(e=>{if(!e.isIntersecting)return;const c=e.target;io.unobserve(c);
    setTimeout(()=>{c.classList.add("in");setTimeout(()=>{c.classList.remove("rv","in");c.classList.add("seen")},800)},Math.min(i++,5)*70)})},{rootMargin:"0px 0px -6% 0px",threshold:.06});
  const watch=()=>document.querySelectorAll(".news-card:not(.rv):not(.seen),.section-head:not(.rv):not(.seen),.news-tabs:not(.rv):not(.seen)").forEach(c=>{c.classList.add("rv");io.observe(c)});
  const news=$("news");if(news)new MutationObserver(watch).observe(news,{childList:true});
  watch();
}
const top=document.querySelector(".topbar"),hero=document.querySelector(".hero");let tk=false;
addEventListener("scroll",()=>{if(tk)return;tk=true;requestAnimationFrame(()=>{const y=scrollY;if(top)top.classList.toggle("shrunk",y>40);if(hero&&!reduce)hero.style.setProperty("--py",Math.min(y*.15,50)+"px");tk=false})},{passive:true});

/* ---------- Dana AI ---------- */
const dlg=document.createElement("dialog");dlg.id="aiDlg";
dlg.innerHTML='<div class="ai-head"><div><b>✦ دانا</b><small>Newsift AI · خبروں کا ساتھی</small></div><button class="icon-btn" id="aiClose" aria-label="Close">✕</button></div><div id="aiCtx" class="ai-ctx" hidden></div><div id="aiMsgs" class="ai-msgs" aria-live="polite"></div><div id="aiChips" class="ai-chips"></div><div class="ai-form"><textarea id="aiQ" rows="1" maxlength="500" placeholder="خبر کے بارے میں کچھ بھی پوچھیں…"></textarea><button id="aiSend" class="ai-send" aria-label="Send">➤</button></div>';
document.body.append(dlg);
const msgs=$("aiMsgs"),inp=$("aiQ"),send=$("aiSend");
let story=null,hist=[],busy=false;
const CH_STORY=["اس خبر کی اصطلاحات سمجھائیں","اس کی وجوہات کیا ہیں؟","اس کا پس منظر بتائیں","آگے کیا ہو سکتا ہے؟"];
const CH_GEN=["آج دنیا کی سب سے بڑی خبر کیا ہے؟","پاکستان کی تازہ صورتحال بتائیں"];
function bubble(cls,text){const d=document.createElement("div");d.className="ai-b "+cls;d.textContent=text;msgs.append(d);msgs.scrollTop=msgs.scrollHeight;return d}
function chips(){const c=$("aiChips");c.innerHTML="";(story?CH_STORY:CH_GEN).forEach(t=>{const b=document.createElement("button");b.textContent=t;b.onclick=()=>ask(t);c.append(b)})}
function openAI(s){
  const same=(s&&story&&s.title===story.title)||(!s&&!story);
  if(!same){story=s||null;hist=[];msgs.innerHTML=""}
  const ctx=$("aiCtx");ctx.hidden=!story;ctx.textContent=story?"خبر: "+story.title:"";
  if(!msgs.children.length)bubble("a",story?"میں دانا ہوں۔ اس خبر کے بارے میں پوچھیں، میں انٹرنیٹ پر تلاش کر کے ذرائع کے ساتھ جواب دوں گا۔":"میں دانا ہوں۔ کوئی بھی خبر یا اصطلاح پوچھیں، میں انٹرنیٹ پر تلاش کر کے ذرائع کے ساتھ جواب دوں گا۔");
  chips();if(!dlg.open)dlg.showModal();
}
async function ask(q){
  q=(q||"").trim();if(!q||busy)return;
  bubble("u",q);inp.value="";inp.style.height="auto";
  if(!AI){bubble("a","دانا ابھی فعال نہیں ہوا۔ ایپ کے مالک کو اس کی ترتیب مکمل کرنی ہے۔");return}
  busy=true;send.disabled=true;
  const w=document.createElement("div");w.className="ai-b a ai-dots";w.innerHTML="<span></span><span></span><span></span>";msgs.append(w);msgs.scrollTop=msgs.scrollHeight;
  const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),60000);
  try{
    const r=await fetch(AI,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},signal:ac.signal,body:JSON.stringify({question:q,story:story,history:hist.slice(-6)})});
    const d=await r.json().catch(()=>({}));
    w.remove();
    if(!r.ok||!d.answer)throw new Error(d.error||"fail");
    const b=bubble("a",d.answer);
    const src=(d.sources||[]).filter(s=>s&&/^https:\/\//i.test(s.uri||"")).slice(0,6);
    if(src.length){const box=document.createElement("div");box.className="ai-src";const h=document.createElement("b");h.textContent="ذرائع";box.append(h);
      src.forEach(s=>{const a=document.createElement("a");a.href=s.uri;a.target="_blank";a.rel="noopener noreferrer";a.textContent=s.title||"source";box.append(a)});b.append(box)}
    hist.push({role:"user",text:q},{role:"model",text:d.answer});
  }catch(e){w.remove();bubble("a","معذرت، ابھی جواب نہیں مل سکا۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔")}
  clearTimeout(tm);busy=false;send.disabled=false;msgs.scrollTop=msgs.scrollHeight;
}
send.onclick=()=>ask(inp.value);
inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask(inp.value)}});
inp.addEventListener("input",()=>{inp.style.height="auto";inp.style.height=Math.min(inp.scrollHeight,110)+"px"});
$("aiClose").onclick=()=>dlg.close();
const btn=document.createElement("button");btn.id="aiBtn";btn.className="icon-btn ai-btn";btn.textContent="✦ دانا";btn.setAttribute("aria-label","Dana AI");
const acts=document.querySelector(".top-actions");if(acts)acts.prepend(btn);
btn.onclick=()=>openAI(null);
const body=$("detailBody");
if(body)new MutationObserver(()=>{
  if(!body.querySelector("h2"))return;
  if(!body.querySelector(".ask-dana")){
    const b=document.createElement("button");b.className="ask-dana";b.textContent="✦ دانا سے اس خبر پر پوچھیں";
    b.onclick=()=>{const t=body.querySelector("h2")?.textContent||"",s=(body.querySelector("p")?.textContent||"").slice(0,2500);openAI({title:t,summary:s})};
    body.append(b);
  }
  if(!body.querySelector(".full-story-btn")){
    const b=document.createElement("button");b.className="ask-dana full-story-btn";b.textContent="▤ مکمل تفصیلی خبر پڑھیں";
    b.onclick=()=>generateFullStory(b);
    body.append(b);
  }
}).observe(body,{childList:true});
async function generateFullStory(button){
  const previous=body.querySelector(".generated-story");
  if(previous&&!previous.dataset.failed)return;
  if(previous)previous.remove();
  if(!AI){button.textContent="AI سروس ابھی ترتیب نہیں دی گئی";return}
  const title=body.querySelector("h2")?.textContent||"";
  const summary=(body.querySelector("p")?.textContent||"").slice(0,3000);
  const sources=[...body.querySelectorAll(".detail-sources a")].map(a=>({name:a.textContent.replace(/↗/g,"").trim(),url:a.href}));
  button.disabled=true;button.textContent="مکمل خبر تیار ہو رہی ہے…";
  const panel=document.createElement("section");panel.className="generated-story";panel.dir="rtl";
  panel.innerHTML='<h2>مکمل تفصیلی خبر</h2><p class="story-loading">معتبر ذرائع سے تازہ معلومات جمع کی جا رہی ہیں۔ اس میں کچھ وقت لگ سکتا ہے…</p>';
  button.after(panel);
  let timer;
  try{
    const controller=new AbortController();timer=setTimeout(()=>controller.abort(),90000);
    const response=await fetch(AI,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},signal:controller.signal,
      body:JSON.stringify({mode:"full_story",question:"اس موضوع پر متعدد معتبر اور آزاد ذرائع سے تحقیق کرکے مکمل، تفصیلی اور متوازن اردو نیوز اسٹوری لکھیں۔",story:{title,summary,sources}})});
    const raw=await response.text();
    let data={};
    try{data=JSON.parse(raw)}catch(_){throw new Error("سرور نے JSON کے بجائے غیر متوقع جواب دیا (HTTP "+response.status+")")}
    if(!response.ok||!data.answer)throw new Error(data.details||data.error||("HTTP "+response.status+": جواب خالی ہے"));
    panel.innerHTML="";
    const heading=document.createElement("h2");heading.textContent="مکمل تفصیلی خبر";panel.append(heading);
    const article=document.createElement("div");article.className="generated-story-text";article.textContent=data.answer;panel.append(article);
    const valid=(data.sources||[]).filter(s=>s&&/^https:\/\//i.test(s.uri||"")).slice(0,10);
    if(valid.length){
      const section=document.createElement("div");section.className="generated-story-sources";
      const label=document.createElement("h3");label.textContent="استعمال شدہ ذرائع اور مزید مطالعہ";section.append(label);
      valid.forEach(s=>{const a=document.createElement("a");a.href=s.uri;a.target="_blank";a.rel="noopener noreferrer";a.textContent=s.title||"اصل خبر پڑھیں";section.append(a)});
      panel.append(section);
    }
    button.textContent="✓ مکمل خبر تیار ہے";
  }catch(e){
    panel.dataset.failed="true";
    const p=document.createElement("p");p.textContent="خرابی کی تفصیل: "+(e.name==="AbortError"?"درخواست 90 سیکنڈ میں مکمل نہیں ہوئی (Timeout)":(e.message||String(e)));panel.replaceChildren(p);
    button.disabled=false;button.textContent="دوبارہ مکمل خبر تیار کریں";
  }finally{if(timer)clearTimeout(timer)}
}
})();
