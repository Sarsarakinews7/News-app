import json, os, re, time, html, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

FEEDS = {
    "Google News": "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en&gl=US&ceid=US:en",
    "BBC": "http://feeds.bbci.co.uk/news/world/rss.xml",
    "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
    "Dawn": "https://www.dawn.com/feeds/home",
    "The Guardian": "https://www.theguardian.com/world/rss",
}
MODEL = "gemini-flash-latest"
KEY = os.environ.get("GEMINI_API_KEY", "")
STOP = set("the and for with from this that its after over into about says say new his her their will has have had not but more than amid".split())


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (news-digest-app)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def clean(t):
    t = html.unescape(re.sub(r"<[^>]+>", " ", t or ""))
    return re.sub(r"\s+", " ", t).strip()


def kw(title):
    return {w for w in re.findall(r"[a-z0-9]+", title.lower()) if len(w) > 3 and w not in STOP}


def load_items():
    items = []
    for name, url in FEEDS.items():
        try:
            root = ET.fromstring(get(url))
        except Exception as e:
            print("feed failed:", name, e)
            continue
        for it in list(root.iter("item"))[:20]:
            title = clean(it.findtext("title"))
            desc = clean(it.findtext("description"))
            if name == "Google News":
                title = re.sub(r"\s+-\s+[^-]+$", "", title)
                desc = ""
            if title:
                items.append({"source": name, "title": title, "desc": desc[:400],
                              "link": (it.findtext("link") or "").strip()})
    return items


def cluster(items):
    clusters = []
    for it in items:
        k = kw(it["title"])
        for c in clusters:
            common = k & c["kw"]
            if len(common) >= 3 or (k and len(common) / len(k | c["kw"]) >= 0.4):
                c["items"].append(it)
                break
        else:
            clusters.append({"kw": k, "items": [it]})
    clusters.sort(key=lambda c: (len({i["source"] for i in c["items"]}), len(c["items"])), reverse=True)
    return clusters


def ask_gemini(c):
    material = "\n".join(f"- [{i['source']}] {i['title']}. {i['desc']}" for i in c["items"][:8])
    prompt = (
        "You are a news editor. Based ONLY on the material below about one news story, write: "
        "an Urdu headline, an Urdu news report of 3 short paragraphs in your own original words "
        "(do not copy sentences), and an English headline. Do not add facts that are not in the material. "
        'Return JSON only: {"title_en": "...", "title_ur": "...", "report_ur": "..."}\n\nMATERIAL:\n' + material
    )
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}],
                       "generationConfig": {"responseMimeType": "application/json"}}).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, data=body, headers={
                "Content-Type": "application/json", "x-goog-api-key": KEY})
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.loads(r.read())
            return json.loads(data["candidates"][0]["content"]["parts"][0]["text"])
        except Exception as e:
            print("gemini error", attempt, e)
            time.sleep(15)
    return None


def main():
    items = load_items()
    top = cluster(items)[:5]
    if not top:
        raise SystemExit("no news found")
    stories = []
    for c in top:
        first = c["items"][0]
        res = ask_gemini(c) or {}
        sources = []
        seen = set()
        for i in c["items"]:
            if i["source"] not in seen:
                seen.add(i["source"])
                sources.append({"name": i["source"], "link": i["link"]})
        stories.append({
            "title_en": res.get("title_en") or first["title"],
            "title_ur": res.get("title_ur") or first["title"],
            "report_ur": res.get("report_ur") or first["desc"],
            "sources": sources,
        })
        time.sleep(5)
    os.makedirs("docs", exist_ok=True)
    out = {"updated": datetime.now(timezone.utc).isoformat(), "world": stories}
    with open("docs/news.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("saved", len(stories), "stories")


main()
