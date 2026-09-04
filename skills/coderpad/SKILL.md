---
name: coderpad
description: Drive CoderPad Screen IDE (screen-ide.coderpad.io) as a trusted human-speed user via chrome-agent CDP. Use when the user asks to practice, run, or debug a CoderPad tutorial or exercise. Trigger on "coderpad", "start the tutorial", "run the tests", "solve the exercise". Covers editor internals, human-speed typing, and the tutorial-vs-assessment red line.
---

# CoderPad Trusted-User Skill

## Red line first

- Tutorial = solvable. It states it is repeatable and not part of the assessment.
- Live assessment (`You must complete this test on your own`) = NEVER solve, type answers, or press Submit. Observe and read only, unless the user explicitly orders an action and owns the consequences.
- Never press `Submit` without an explicit user order. Running tests is the default stopping point.
## Shared browser from Mac (connection setup)

Architecture: Chrome runs headed on the user Mac. CDP listens on Mac `127.0.0.1:9222`. A reverse SSH tunnel from Mac to this Linux VPS maps VPS `localhost:9222` to Mac. `chrome-agent` on the VPS talks to `localhost:9222` through registry entry `mac-shared-01`.

### 1. Launch on Mac (user runs this)
```
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-shared --remote-allow-origins=* about:blank
```
Separate `user-data-dir` is required. Never use the main profile. Keep this window open for the whole session.

### 2. Tunnel from Mac to VPS (user runs this)
```
ssh -R 9222:127.0.0.1:9222 USER@100.x.y.z -N -f
```
Keep the tunnel process alive. Kill switch: `pkill -f "ssh -R 9222"` on Mac ends agent access in <1 sec.

### 3. Verify and register on VPS (agent runs this)
```bash
curl -s --max-time 5 http://localhost:9222/json/version  # must show Browser + webSocketDebuggerUrl
export PATH="$HOME/.local/bin:$PATH"  # chrome-agent lives at ~/.local/bin/chrome-agent
mkdir -p /tmp/chrome-agent /tmp/agent-log
echo $$  # long-lived shell PID for the registry entry
```
Registry file `/tmp/chrome-agent/registry.json` maps name to port. Liveness = recorded PID is alive and owned by us plus port listening. Use a persistent shell PID, never a one-shot command PID:
```json
{"mac-shared-01": {"port": 9222, "pid": 3541402, "browser_version": "Chrome/152", "user_data_dir": "", "launched": "2026-09-04T17:30:00+00:00"}}
```
Confirm with:
```bash
~/.local/bin/chrome-agent status  # must show mac-shared-01 alive:true with current tab URL
~/.local/bin/chrome-agent mac-shared-01 Runtime.evaluate '{"expression": "document.title", "returnByValue": true}'
```
Expected clean signals: `webdriver:false`, own property `false`, real `platform`/`vendor`, `window.chrome` keys `[app,csi,loadTimes]`.

### 4. Operate the shared instance
Address every command at `mac-shared-01`. One-shot commands open a temporary isolated CDP session per call (~50-80 ms). `attach` holds a persistent session for event streams. Sessions are isolated: Network/Page subscriptions in one session never leak into another.
For multi-tab work use `--target-index N` or `--url SUBSTRING` from `status` output. Default is the first page target.
If `status` shows no instances: tunnel is down or registry file is missing. Re-check curl first, then registry JSON, then re-register.

## Platform notes (verified 2026-09-04)

Screen IDE layout: header (`Question N/N - <lang>`, `mm:ss / mm:ss` timer), Instructions pane, Answer (Monaco editor), Tests list, Console output pane, `Run all tests` + `Submit` buttons.

Editor facts that matter:
- Monaco inside `react-monaco-editor-react`. No global `window.monaco`.
- Editor API (preferred): the standalone instance at `window.editors.ANSWER` exposes `getModel()` (`getLineCount`, `getLineContent(n)`, `getLineMaxColumn(n)`), `getPosition`/`setPosition`, `setSelection`, `revealLineInCenter(n)`, `focus`, and `executeEdits(id, [{range, text}])`. Use it for surgical reads and line-range edits. Probe shape first; key names vary by build.
- Fallback: full file text also lives in the React controlled prop. Find the fiber node with `memoizedProps.value` + `memoizedProps.onChange`, stash as `window.__fiberNode`. Read via `memoizedProps.value`, bulk-write via `onChange(fixedText)` only as last resort (returns `ide/codeChanged`).
- Visible DOM (`.view-line`) is virtualized — only ~15 lines render. Never trust it for full content or coords after scroll. Single-evaluate find+rect; two-step locate-then-act races virtualization.
- Hidden input is `TEXTAREA.ime-text-area`, not `.inputarea`.
- Drafts persist server-side. `Page.reload` does NOT reset the file.
- Auto-indent trap: Monaco adds indent on newline, so line-by-line `insertText` of fully-indented code stacks indent and breaks Python. Expect it. Fix with one `executeEdits` normalization pass over the typed range (repair-only, logged), then read the range back before running tests.
- Shell quoting trap: never build evaluate payloads with `python3 -c "..."` inside bash double quotes. Bash eats `\\n` into real newlines and the JS dies with SyntaxError. Build payload JSON only via heredoc `<<'EOF'`, and use `String.fromCharCode(10)` instead of `\n` inside composed JS expressions.
- Python harness shape: `compute_X(...)` stub + `try_solution` that `print(dumps(...))` + `main()` reading `loads(input())`. Tail code between `# Ignore and do not change` markers is harness — never touch.

## Trusted-user rules

1. Isolated profile only (`--user-data-dir=/tmp/chrome-shared`). Never aim at the user's main profile.
2. Narrate before acting: target + reason in chat, plus `console.log('[agent] ...')` in page.
3. Observe-only default: screenshots and `Runtime.evaluate` reads are free. `Input.dispatch*`, `onChange` bulk writes, and `executeEdits` need an explicit user go-ahead per exercise, or one standing test-wide order covering all questions. `executeEdits` is repair-only (indent normalization), never a first-write shortcut, and every use is logged plus read back. `Submit` always needs its own separate order, never covered by standing go-ahead.
4. Allowlist domains per task (e.g. `screen-ide.coderpad.io` + `coderpad.io` only).
5. Human veto wins: any human click/type pauses the agent. Kill switch on Mac: `pkill -f "ssh -R 9222"`.
6. Keep native signals: no fingerprint spoofing, no window-border marker on the shared instance. Vanilla CDP attach keeps `navigator.webdriver=false` (own=false), real `platform`/`vendor`, real `window.chrome` keys.
7. Log every write act (method, coords/text hash, timestamp) to `/tmp/agent-log/cdp.log`.

## Human-speed interaction (hard numbers)

CDP one-shot already costs ~50-80 ms. Add human gaps on top:

- Mouse: locate via `getBoundingClientRect`, move in 5 steps, 50-150 ms between steps, `mousePressed` + `mouseReleased` as separate calls.
- Clicks: 200-400 ms dwell between press and release on editor focus clicks.
- Typing code: NEVER bulk `insertText` a whole file. Type line-by-line: one `Input.insertText` per line, 300-600 ms pause between lines, 1-2 s pause between logical blocks. ~15-line function takes ~30-60 s. That is the point.
- Key combos (undo/select): `keyDown` + `keyUp` pairs with 100 ms gap; max 2 undos assumed — verify after, never loop blindly.
- Reads: max 1 evaluate per second; sleep 1 s after scroll before reading rendered lines.
- Run tests: `scrollIntoView({block:"center"})` then click, then wait 6-10 s before reading console output.
- Budget: ~10-15 min per question at human speed (a 37-line fix takes ~55 s typing alone plus verify cycles). Track timer used/remaining in every report.
- Reusable read snippets: test list via `innerText.indexOf("Tests")` slice; console via `innerText.indexOf("Console output")` slice; timer via first 120 chars of `innerText`.

## Workflow per exercise

1. Observe first: jpeg screenshot, then timer, full instructions (`document.body.innerText`), tests list, stub via `getModel` or fiber `value` saved to `/tmp/<name>_raw.py`. Ask before clicking Start tutorial: the click is a state change.
2. Solve locally in `/tmp`, verify with python3 against the worked example before touching the browser. If the statement output contradicts its own trace or the rules, implement the rules, flag the conflict to the user before typing, and let the test run adjudicate.
3. Focus editor (click + `revealLineInCenter` + `setPosition` + `focus`). Read the stub line content first and size the selection exactly (`    return 184` is 14 chars, so endColumn 15). Off-by-one leaves trailing digits. Type the fix at human speed (below). Repair preferred over rewrite: replace only the stub body, keep harness. If indent stacks, one `executeEdits` normalization pass, then read back.
4. Verify in editor (model slice + fiber `value` slice), then `Run all tests`, read console (`Success` + test names, no failures).
5. Report: solution idea, test outcome, timer used/remaining. Stop. Ask before `Submit`.

## Worked example: ant diagonal distance

Moves `0:(+1,+1) 1:(+1,-1) 2:(-1,-1) 3:(-1,+1)`. Return `int(sqrt(x²+y²))`.

```python
x = y = 0
for m in moves:
    if m == 0:
        x += 1
        y += 1
    elif m == 1:
        x += 1
        y -= 1
    elif m == 2:
        x -= 1
        y -= 1
    else:
        x -= 1
        y += 1
return int((x * x + y * y) ** 0.5)
```

Check: `[0,3,0,0,2,0,0]` → x=3, y=5 → `int(sqrt(34))` = 5. Empty list → 0.
