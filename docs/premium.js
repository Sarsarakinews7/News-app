(()=>{"use strict";
const R=document.documentElement,$=id=>document.getElementById(id);
const get=(k,v)=>{try{const x=localStorage.getItem(k);return x===null?v:x}catch{return v}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
if(get("newsift-theme",null)===null)document.body.classList.add("dark");
const SYM='<svg class="sym" viewBox="0 0 64 64" aria-hidden="true"><path pathLength="1" d="M14 10h28l10 10v34H14z"/><path pathLength="1" d="M42 10v10h10"/><path pathLength="1" d="M22 32h22M22 40h22M22 48h12"/><path pathLength="1" d="M50 4a12 12 0 0 1 10 10M50 -2a18 18 0 0 1 16 16"/></svg>';
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function applyPrefs(){R.dataset.font=get("newsift-font","nastaliq");R.dataset.size=get("newsift-size","m")}
applyPrefs();
let timer;
function intro(mode,force){
  document.getElementById("intro")?.remove();clearTimeout(timer);
  if(reduce)return;
  if(!force&&mode==="off")return;
  const el=document.createElement("div");el.id="intro";el.setAttribute("aria-hidden","true");
  el.style.setProperty("--k",mode==="short"?".5":"1");
  el.innerHTML='<div class="beam"></div>'+SYM+'<div class="word">NEWSIFT</div><div class="slogan" lang="ur" dir="rtl">خبروں کی دنیا، ایک نظر میں</div>';
  document.body.append(el);
  const end=()=>{clearTimeout(timer);el.classList.add("out");setTimeout(()=>el.remove(),600)};
  el.addEventListener("click",end);
  timer=setTimeout(end,mode==="short"?1500:2900);
}
const first=get("newsift-seen",null)===null;set("newsift-seen","1");
intro(first?"full":get("newsift-intro","short"),false);
const dlg=$("settings");
if(dlg){
  $("setFont").value=get("newsift-font","nastaliq");$("setSize").value=get("newsift-size","m");$("setIntro").value=get("newsift-intro","short");
  $("setBtn").onclick=()=>dlg.showModal();$("closeSet").onclick=()=>dlg.close();
  $("setFont").onchange=e=>{set("newsift-font",e.target.value);applyPrefs()};
  $("setSize").onchange=e=>{set("newsift-size",e.target.value);applyPrefs()};
  $("setIntro").onchange=e=>set("newsift-intro",e.target.value);
  $("replayIntro").onclick=()=>{dlg.close();intro("full",true)};
}
})();
