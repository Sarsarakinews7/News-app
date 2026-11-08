import json, os, re, time, html, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

TOP_N = 10  # number of important stories

FEEDS = {
    "Google News": "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en&gl=US&ceid=US:en",
    "BBC": "http://feeds.bbci.co.uk/news/world/rss.xml",
    "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
    "Dawn": "https://www.dawn.com/feeds/home",
    "The Guardian": "https://www.theguardian.com/world/rss",
}
MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"]
KEY = os.environ.get("GEMINI_API_KEY", "")
STOP = set("the and for with from this that its after over into about says say new his her their will has have had not but more than amid".split())

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (news-digest-app)"})
    with urllib.request.urlopen(req, timeout=30) as r: return r.read()

def clean(t):
    t = html.unescape(re.sub(r"<[^>]+>", " ", t or ""))
    return re.sub(r"\s+", " ", t).strip()

def kw(title):
    return {w for w in re.findall(r"[a-z0-9]+", title.lower()) if len(w) > 3 and w not in STOP}

def load_items():
    items=[]
    for name,url in FEEDS.items():
        try: root=ET.fromstring(get(url))
        except Exception as e:
            print("feed failed:",name,e); continue
        for it in list(root.iter("item"))[:50]:
            title=clean(it.findtext("title")); desc=clean(it.findtext("description"))
            if name=="Google News":
                title=re.sub(r"\s+-\s+[^-]+$","",title); desc=""
            if not title: continue
            rawdate=it.findtext("pubDate") or ""
            try: published=parsedate_to_datetime(rawdate).astimezone(timezone.utc).isoformat()
            except Exception: published=""
            link=(it.findtext("link") or "").strip()
            items.append({"source":name,"title":title,"desc":desc[:500],"link":link,"published_at":published})
    return items

def cluster(items):
    clusters=[]
    for it in items:
        k=kw(it["title"])
        for c in clusters:
            common=k & c["kw"]
            if len(common)>=3 or (k and len(common)/len(k|c["kw"])>=0.4):
                c["items"].append(it); break
        else: clusters.append({"kw":k,"items":[it]})
    clusters.sort(key=lambda c:(len({i["source"] for i in c["items"]}),len(c["items"])),reverse=True)
    return clusters

def fetch_text(url):
    """Download an article page and return its paragraph text (best effort)."""
    if not url or "news.google.com" in url: return ""
    try: raw=get(url).decode("utf-8","ignore")
    except Exception as e:
        print("page failed:",url[:80],e); return ""
    raw=re.sub(r"(?is)<(script|style|noscript|nav|footer|header|aside|form)[^>]*>.*?</\1>"," ",raw)
    m=re.search(r"(?is)<article[^>]*>(.*?)</article>",raw)
    block=m.group(1) if m else raw
    paras=[clean(p) for p in re.findall(r"(?is)<p[^>]*>(.*?)</p>",block)]
    paras=[p for p in paras if len(p)>70]
    return "\n".join(paras)[:6000]

def gemini_json(prompt):
    body=json.dumps({"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"responseMimeType":"application/json"}}).encode()
    for rnd,wait in enumerate([10,30,60]):
        for model in MODELS:
            url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                req=urllib.request.Request(url,data=body,headers={"Content-Type":"application/json","x-goog-api-key":KEY})
                with urllib.request.urlopen(req,timeout=180) as r: data=json.loads(r.read())
                res=json.loads(data["candidates"][0]["content"]["parts"][0]["text"])
                if isinstance(res,dict) and res.get("report_ur"): return res
            except Exception as e: print("gemini error",model,rnd,e)
        time.sleep(wait)
    return None

def write_full_story(c):
    mats=[]
    for i in c["items"][:5]:
        text=fetch_text(i["link"]) or i["desc"]
        mats.append(f"SOURCE: {i['source']}\nHEADLINE: {i['title']}\nTEXT: {text}")
    prompt=("You are a senior news editor for an Urdu news app. Below are reports of the SAME story from several news outlets. "
        "Combine them into ONE complete, detailed story in clear Urdu, written entirely in your own words (never copy sentences). "
        "Include every important fact found in the material: who, what, when, where, numbers, quotes paraphrased, background, reactions, and what is expected next. "
        "Use ONLY the material given; never add facts. If outlets differ on a point, say so and name which outlet said what. "
        "Structure: an opening summary paragraph, then several detailed paragraphs separated by blank lines (about 400 to 700 words if the material supports it, shorter if there is little material), "
        "then a final section that starts with the line 'اہم نکات:' followed by 4 to 6 lines each starting with '• '. "
        "Return JSON only: {\"title_en\": \"...\", \"title_ur\": \"...\", \"report_ur\": \"...\"}\n\n"+"\n\n---\n\n".join(mats))
    return gemini_json(prompt)

def main():
    raw=load_items()
    if not raw: raise SystemExit("no news found")
    grouped=cluster(raw)
    top=grouped[:TOP_N]
    important=[]
    for n,c in enumerate(top):
        first=c["items"][0]
        r=write_full_story(c) or {}
        print("story",n+1,"full report" if r else "fallback",len(r.get("report_ur","")),"chars")
        sources=[]; seen=set()
        for i in c["items"]:
            if i["source"] not in seen:
                seen.add(i["source"]); sources.append({"name":i["source"],"link":i["link"]})
        important.append({"title_en":r.get("title_en") or first["title"],"title_ur":r.get("title_ur") or first["title"],"report_ur":r.get("report_ur") or first["desc"],"sources":sources})
        time.sleep(3)
    all_stories=[]
    seen_links=set()
    for it in sorted(raw,key=lambda x:x.get("published_at",""),reverse=True):
        link=it["link"]
        if link and link in seen_links: continue
        if link: seen_links.add(link)
        all_stories.append({"title_en":it["title"],"title_ur":it["title"],"report_ur":it["desc"],"published_at":it["published_at"],"sources":[{"name":it["source"],"link":link}]})
    now=datetime.now(timezone.utc)
    out={"updated":now.isoformat(),"world":important,"all":all_stories}
    os.makedirs("docs/archive",exist_ok=True)
    with open("docs/news.json","w",encoding="utf-8") as f: json.dump(out,f,ensure_ascii=False,indent=1)
    with open(f"docs/archive/{now.date().isoformat()}.json","w",encoding="utf-8") as f: json.dump(out,f,ensure_ascii=False,indent=1)
    print("saved",len(important),"top stories and",len(all_stories),"daily feed stories")

main()
