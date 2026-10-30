import json, sys
from playwright.sync_api import sync_playwright

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = sys.argv[1] if len(sys.argv) > 1 else "file:///F:/Hermes%20WorkSpace/richman4/index.html"

def probe(pg, label):
    info = pg.evaluate("""() => {
      let ac = null;
      try { ac = (typeof AC !== 'undefined') ? AC : null; } catch(e) {}
      return {
        state: ac ? ac.state : 'no-ctx',
        sr: ac ? ac.sampleRate : 0,
        unlocked: (typeof audioUnlocked !== 'undefined') ? audioUnlocked : null,
        mute: (typeof MUTE !== 'undefined') ? MUTE : null,
        speed: (typeof SPEED !== 'undefined') ? SPEED : null,
        btn: document.getElementById('muteBtn') ? document.getElementById('muteBtn').textContent.trim() : '-'
      };
    }""")
    print(f"[{label}] {json.dumps(info, ensure_ascii=False)}")
    return info

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--mute-audio"])
    pg = b.new_page()
    pg.goto(URL)
    pg.wait_for_timeout(600)
    probe(pg, "载入后（未点击）")

    # 真实点击开始游戏 -> 首次用户手势
    pg.click("#startBtn")
    pg.wait_for_timeout(800)
    probe(pg, "点开始游戏后")

    # 等待轮到自己并掷骰
    for _ in range(40):
        if pg.eval_on_selector("#rollBtn", "el => !el.disabled"):
            break
        pg.wait_for_timeout(300)
    pg.click("#rollBtn")
    pg.wait_for_timeout(2500)
    info = probe(pg, "掷骰子后")
    print("RESULT", info["state"], "| 解锁:", info["unlocked"], "| 静音:", info["mute"])

    # 关键判断：真实手势后 AudioContext 必须 running
    ok = info["state"] == "running"
    print("AUDIO_E2E", "PASS" if ok else "FAIL")
    b.close()
    sys.exit(0 if ok else 1)
