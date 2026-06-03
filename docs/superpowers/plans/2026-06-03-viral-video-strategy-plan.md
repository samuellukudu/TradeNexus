# Viral Video Strategy — Approach A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create voiceover scripts for 5 existing TradeNexus videos, define audio mixing workflow, and set up a posting schedule to drive 3-10x more views across platforms.

**Architecture:** This is a content-creation and workflow plan, not a code plan. VO scripts are written as plain-text timing files paired with specific renders. A single FFmpeg helper script automates the audio mixdown. A posting schedule document defines the 30-day rollout.

**Tech Stack:** Plain text scripts, FFmpeg for audio mixing, Markdown for schedule

---

## Video Inventory

| # | File | Duration | Platform Fit | Hook |
|---|------|----------|-------------|------|
| V1 | `tradenexus-launch-mobile.mp4` | 50s | TikTok, YT Shorts, 抖音 | #2 EN — "This factory owner woke up to 1,247 leads" |
| V2 | `tradenexus-launch-mobile-cn.mp4` | 50s | 微信, 抖音 | #7 CN — "一条指令。12个贸易中心。1247个认证买家" |
| V3 | `tradenexus-output-mobile-final.mp4` | 136s | 微信, LinkedIn, YT | #3 EN — "I asked an AI to find buyers... what happened shocked me" |
| V4 | `tradenexus-mobile.mp4` | 136s | 微信, LinkedIn, YT | #1 EN — "Your competitor just found 47 buyers in Germany" |
| V5 | `tradenexus-video_2026-05-28_23-41-26.mp4` | 65s | TikTok, YT Shorts, 抖音 | #5 EN — "10 seconds to show you how AI replaces 6 months" |

**Note:** V3 and V4 are 136s — too long for TikTok/YT Shorts (60s max). They need 60s trimmed versions for those platforms. Full-length versions go to WeChat Channels, LinkedIn, and regular YouTube.

---

### Task 1: Create scripts directory and file structure

**Files:**
- Create: `tradenexus-video/scripts/`
- Create: `tradenexus-video/scripts/.gitkeep` placeholder

- [ ] **Step 1: Create directory**

```bash
mkdir -p /home/samu2505/SAAS/tradenexus-video/scripts
```

- [ ] **Step 2: Create .gitkeep**

Write `/home/samu2505/SAAS/tradenexus-video/scripts/.gitkeep` with:
```
# Voiceover scripts for TradeNexus videos
# Each .txt file is a timed VO script paired with a rendered video
```

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add ../tradenexus-video/scripts/
# Or since tradenexus-video may be tracked differently:
git -C /home/samu2505/SAAS add tradenexus-video/scripts/
git -C /home/samu2505/SAAS commit -m "chore: create VO scripts directory for viral video strategy
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Write VO script — Hook #2 EN (50s, V1 launch-mobile)

**Files:**
- Create: `tradenexus-video/scripts/hook-2-factory-owner-en.txt`

**Video:** `tradenexus-launch-mobile.mp4` (50s)
**Hook:** "This factory owner woke up to 1,247 leads. He didn't search for any of them."
**Emotion:** Curiosity/disbelief
**Platforms:** TikTok, YouTube Shorts

- [ ] **Step 1: Write the timed VO script**

Write `/home/samu2505/SAAS/tradenexus-video/scripts/hook-2-factory-owner-en.txt`:

```
# Hook #2 EN — "Factory Owner Wakes Up to 1,247 Leads"
# Video: tradenexus-launch-mobile.mp4 (50s)
# Platforms: TikTok, YouTube Shorts
# Tone: Conversational, disbelief-turned-excitement

## ACT 1 — HOOK (0:00-0:05)
[Music full, then duck at 0:02]
0:00 — "This factory owner woke up to 1,247 leads."
0:03 — "He didn't search for any of them."
[Music duck to -20dB at 0:02, hold through Act 2]

## ACT 2 — PROOF (0:05-0:42)
[Terminal visuals begin — data scrolling, counters rising]
0:05 — "Here's what happened. He uploaded his product specs to an AI agent."
0:10 — "The AI analyzed his product — figured out exactly who buys it and where."
0:15 — "Then it split the search across 12 strategic trade hubs."
0:20 — "Four squads. Running in parallel. Scouting Germany, Japan, Brazil, UAE, Korea, Mexico."
0:26 — "The AI doesn't just find companies. It verifies them."
0:30 — "Google Maps confirmed. Social profiles checked. Competitor intel gathered."
0:35 — "Forty-seven buyers in Germany. Eighty-three in Japan. Two hundred in Brazil."
0:40 — "All verified. All looking for exactly what this factory makes."

## ACT 3 — PAYOFF + CTA (0:42-0:50)
[Music starts rising at 0:42, back to full by 0:45]
0:42 — "One thousand, two hundred and forty-seven leads. Zero hours of manual research."
0:46 — "Search TradeNexus. Your factory. The world's buyers. Connected."
0:49 — [Music full, TradeNexus brand mark on screen]
```

- [ ] **Step 2: Read aloud test**

```bash
# Time yourself reading the script aloud. Each line must fit within its timestamp window.
# Adjust wording if any line runs over. Goal: conversational pace, ~2.5 words/second.
```

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS add tradenexus-video/scripts/hook-2-factory-owner-en.txt
git -C /home/samu2505/SAAS commit -m "feat: add Hook #2 EN VO script — factory owner wakes up to leads (50s)
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Write VO script — Hook #7 CN (50s, V2 launch-mobile-cn)

**Files:**
- Create: `tradenexus-video/scripts/hook-7-one-command-cn.txt`

**Video:** `tradenexus-launch-mobile-cn.mp4` (50s)
**Hook:** "一条指令。12个贸易中心。1247个认证买家。在你睡觉的时候。"
**Emotion:** Scale/ambition
**Platforms:** 微信视频号, 抖音

- [ ] **Step 1: Write the timed VO script in Chinese**

Write `/home/samu2505/SAAS/tradenexus-video/scripts/hook-7-one-command-cn.txt`:

```
# Hook #7 CN — "一条指令。12个贸易中心。1247个认证买家"
# Video: tradenexus-launch-mobile-cn.mp4 (50s)
# Platforms: 微信视频号, 抖音
# Tone: Confident, matter-of-fact, understated power

## ACT 1 — HOOK (0:00-0:05)
[Music full, duck at 0:02]
0:00 — "一条指令。"
0:01 — "12个贸易中心。"
0:02 — "1247个认证买家。"
0:04 — "在你睡觉的时候。"
[Music duck to -20dB]

## ACT 2 — PROOF (0:05-0:42)
[Terminal visuals — data scrolling, globe connections forming]
0:05 — "你只需要做一件事：上传你的产品资料。"
0:09 — "AI自动分析你的产品——它能判断谁会买、在哪买、为什么买。"
0:15 — "然后，它在全球12个战略贸易中心同时启动搜索。"
0:20 — "德国。日本。巴西。阿联酋。韩国。墨西哥。"
0:25 — "四个搜索小队同时运行。每队覆盖三个贸易中心。"
0:30 — "找到的不只是公司名字——是经过验证的买家。"
0:34 — "谷歌地图确认过。社交媒体核实过。竞争对手情报也一并给你。"
0:39 — "德国的暖通买家。日本的机械进口商。巴西的建材分销商。"

## ACT 3 — PAYOFF + CTA (0:42-0:50)
[Music rises at 0:42, full by 0:45]
0:42 — "你只做了一件事：上传产品。剩下的事，AI在你睡觉的时候做完了。"
0:46 — "微信搜 TradeNexus。你的产品，全球的市场，一个平台连接。"
0:49 — [Music full, TradeNexus brand mark]
```

- [ ] **Step 2: Read aloud test**

Read script aloud in Chinese at natural speaking pace. Verify each line fits within its timestamp.

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS add tradenexus-video/scripts/hook-7-one-command-cn.txt
git -C /home/samu2505/SAAS commit -m "feat: add Hook #7 CN VO script — one command 12 hubs (50s)
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Write VO script — Hook #3 EN (60s trim, V3 output-mobile-final)

**Files:**
- Create: `tradenexus-video/scripts/hook-3-ai-shocked-me-en.txt`

**Video:** `tradenexus-output-mobile-final.mp4` (trimmed to 60s for short-form; full 136s for WeChat/LinkedIn)
**Hook:** "I asked an AI to find buyers for a Chinese factory. What happened in 5 minutes shocked me."
**Emotion:** Curiosity gap
**Platforms:** TikTok, YouTube Shorts (60s trim); WeChat, LinkedIn (full 136s)

- [ ] **Step 1: Write the timed VO script for 60s short-form cut**

Write `/home/samu2505/SAAS/tradenexus-video/scripts/hook-3-ai-shocked-me-en.txt`:

```
# Hook #3 EN — "I Asked an AI to Find Buyers — What Happened Shocked Me"
# Video: tradenexus-output-mobile-final.mp4
# Short-form: Trim to first 60s for TikTok/YT Shorts
# Long-form: Full 136s for WeChat Channels, LinkedIn, regular YouTube
# Tone: Personal story, genuine surprise, "I have to tell you about this"

## ACT 1 — HOOK (0:00-0:05)
[Music full, duck at 0:03]
0:00 — "I asked an AI to find buyers for a Chinese factory."
0:03 — "What happened in five minutes shocked me."
[Music duck to -20dB]

## ACT 2 — PROOF (0:05-0:52)
[Terminal/data visuals — search execution, leads appearing]
0:05 — "Not 'find me some companies.' I said: find verified buyers who are actively
       looking for this exact product, in these specific countries."
0:12 — "The AI analyzed the product first. Industrial HVAC systems. It understood
       the specs, certifications, target buyer profile — automatically."
0:19 — "Then it mapped the world. Which countries import HVAC equipment? Which
       cities have active construction markets? Who's issuing tenders right now?"
0:27 — "It split the search. Four parallel squads. Twelve strategic hubs."
0:32 — "Germany — industrial buyers. Japan — construction firms. Brazil — hotel
       chains expanding. UAE — new development projects. Korea — semiconductor
       fabs needing climate control. Mexico — manufacturing plants."
0:42 — "But it didn't stop at names. It verified each one."
0:46 — "Google Maps — real address. Social profiles — active business. Website —
       still operating. Competitor relationships mapped."
0:50 — "Five minutes. That's how long this took."

## ACT 3 — PAYOFF + CTA (0:52-1:00)
[Music rises at 0:52, full by 0:55]
0:52 — "The factory owner? He'd been doing trade shows for six years. Never found
       more than three buyers per show. The AI found forty-seven. In Germany alone."
0:57 — "Search TradeNexus. Stop searching for buyers. Let them find you."
1:00 — [Music full, brand mark]

---

## LONG-FORM EXTENSION (60s-136s)
# For WeChat Channels, LinkedIn, and regular YouTube (full 136s):
# After the short-form CTA at 1:00, continue:

1:00 — "Let me show you the full results."
1:03 — "The AI didn't just find buyers in Germany. It found them everywhere."
1:08 — [Let terminal visuals play longer — data scrolling, region highlights]
1:15 — "Japan — eighty-three verified HVAC importers."
1:20 — "Brazil — over two hundred construction and hospitality companies."
1:26 — "UAE — forty-one buyers across new development projects."
1:32 — "Korea — sixty-eight semiconductor and industrial buyers."
1:38 — "Mexico — fifty-five manufacturing plants expanding their facilities."
1:44 — "Every single lead: verified. Every single one: scored by fit."
1:50 — "The AI even drafted outreach messages. In the buyer's language.
       Referencing their actual business. Ready to send."
1:58 — "From product specs to ready-to-send outreach. Five minutes. Zero human research."
2:05 — "This isn't a concept. This is TradeNexus. Live now."
2:10 — "Search TradeNexus. Upload your product. Wake up to leads."
2:16 — [Music full, brand mark, fade to black]
```

- [ ] **Step 2: Read aloud test for both versions**

Read the short-form script (0:00-1:00) and long-form extension (1:00-2:16). Verify pacing.

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS add tradenexus-video/scripts/hook-3-ai-shocked-me-en.txt
git -C /home/samu2505/SAAS commit -m "feat: add Hook #3 EN VO script — AI search shocked me (60s + 136s)
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Write VO script — Hook #1 EN (60s trim, V4 mobile)

**Files:**
- Create: `tradenexus-video/scripts/hook-1-competitor-fomo-en.txt`

**Video:** `tradenexus-mobile.mp4` (trimmed to 60s for short-form; full 136s for WeChat/LinkedIn)
**Hook:** "Your competitor just found 47 buyers in Germany. You don't know their names yet."
**Emotion:** FOMO / fear of being left behind
**Platforms:** WeChat, LinkedIn (full); TikTok, YT Shorts (60s trim)

- [ ] **Step 1: Write the timed VO script**

Write `/home/samu2505/SAAS/tradenexus-video/scripts/hook-1-competitor-fomo-en.txt`:

```
# Hook #1 EN — "Your Competitor Just Found 47 Buyers in Germany"
# Video: tradenexus-mobile.mp4
# Short-form: Trim to first 60s for TikTok/YT Shorts
# Long-form: Full 136s for WeChat, LinkedIn
# Tone: Direct, slightly urgent, "I'm telling you this because someone needs to"

## ACT 1 — HOOK (0:00-0:05)
[Music full, duck at 0:03]
0:00 — "Your competitor just found 47 buyers in Germany."
0:03 — "You don't know their names yet."
[Music duck to -20dB]

## ACT 2 — PROOF (0:05-0:52)
[Terminal/globe visuals — connections forming, data counters]
0:05 — "While you're reading this, an AI is scouting buyers for factories that
       aren't yours. Factories that will get the contracts. The relationships.
       The market share."
0:14 — "Here's how it works. TradeNexus takes your product specs. Analyzes them.
       Understands who buys, where, and why."
0:21 — "Then it launches a parallel search across twelve trade hubs. Four squads.
       Four continents. Nine regions."
0:28 — "Germany — Europe's largest importer. Japan — precision manufacturing.
       Brazil — booming construction. UAE — development never stops. Korea —
       tech and industry. Mexico — manufacturing growth."
0:38 — "The AI finds companies. Then verifies them. Real addresses. Active
       operations. Actual import history."
0:44 — "It doesn't just give you a list. It gives you a pipeline. Qualified.
       Scored. Ready for outreach."
0:50 — "Your competitor is already in this pipeline. Are you?"

## ACT 3 — PAYOFF + CTA (0:52-1:00)
[Music rises at 0:52, full by 0:55]
0:52 — "Every day you wait, your competitors find buyers you'll never know about."
0:56 — "Search TradeNexus. Get in the pipeline before they own the market."
1:00 — [Music full, brand mark]

---

## LONG-FORM EXTENSION (60s-136s)
# For WeChat Channels and LinkedIn:

1:00 — "Let me show you what this actually looks like."
1:04 — [Let globe visuals play — connections building]
1:10 — "The AI doesn't just search one country. It searches everywhere, at once."
1:16 — "Forty-seven in Germany. Eighty-three in Japan. Two hundred in Brazil.
       Forty-one in UAE. Sixty-eight in Korea. Fifty-five in Mexico."
1:26 — "That's four hundred and ninety-four verified buyers. From one search."
1:32 — "Now imagine your competitor has been using this for a month. Two months.
       Six months."
1:38 — "They've built relationships in markets you haven't even entered yet."
1:44 — "They know the buyers. The buyers know them. You're starting from zero."
1:50 — "This isn't about being first to market. It's about not being last."
1:56 — "TradeNexus levels the field. One upload. Global search. Verified results."
2:04 — "The question isn't whether this works. It's whether you'll use it before
       your competitors do."
2:10 — "Search TradeNexus. Don't be the last factory to go global."
2:16 — [Music full, brand mark, fade to black]
```

- [ ] **Step 2: Read aloud test**

Read both versions. The FOMO tone requires confident, slightly urgent delivery — not aggressive, not salesy.

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS add tradenexus-video/scripts/hook-1-competitor-fomo-en.txt
git -C /home/samu2505/SAAS commit -m "feat: add Hook #1 EN VO script — competitor FOMO (60s + 136s)
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Write VO script — Hook #5 EN (65s, V5 globe connections)

**Files:**
- Create: `tradenexus-video/scripts/hook-5-replaces-6-months-en.txt`

**Video:** `tradenexus-video_2026-05-28_23-41-26.mp4` (65s)
**Hook:** "10 seconds to show you how AI replaces 6 months of export research."
**Emotion:** Efficiency / time-saved
**Platforms:** TikTok, YouTube Shorts, LinkedIn

- [ ] **Step 1: Write the timed VO script**

Write `/home/samu2505/SAAS/tradenexus-video/scripts/hook-5-replaces-6-months-en.txt`:

```
# Hook #5 EN — "10 Seconds to Show How AI Replaces 6 Months of Export Research"
# Video: tradenexus-video_2026-05-28_23-41-26.mp4 (65s)
# Platforms: TikTok, YouTube Shorts, LinkedIn
# Tone: Efficient, numbers-driven, "let me show you the math"

## ACT 1 — HOOK (0:00-0:05)
[Music full, duck at 0:02]
0:00 — "Ten seconds to show you how AI replaces six months of export research."
0:04 — "Ready?"
[Music duck to -20dB]

## ACT 2 — PROOF (0:05-0:55)
[Globe visuals — trade routes lighting up, particles flowing, regions highlighting]
0:05 — "Old way: six months. Trade shows. Agent fees. Cold emails. Hoping someone
       responds. Cost: thirty to fifty thousand dollars. Results: maybe three buyers."
0:15 — "New way: upload your product. AI analyzes it. Five minutes."
0:20 — "The AI maps demand. Which countries import this? Which cities? Who's buying?"
0:26 — [Globe shows first connections lighting up]
0:26 — "It launches parallel search. Twelve hubs. Four squads. Nine regions."
0:32 — [More connections — accelerating]
0:32 — "Companies found. Verified. Scored. Organized into a pipeline."
0:38 — "Google Maps checked. Social profiles confirmed. Import history validated."
0:43 — "Six months of research. Done in five minutes."
0:47 — "Cost? A fraction of one trade show. Results? More buyers than six years of shows."
0:52 — "That's not an upgrade. That's a different category."

## ACT 3 — PAYOFF + CTA (0:55-1:05)
[Music rises at 0:55, full by 0:58]
0:55 — "Your product deserves global buyers. Not in six months. Now."
0:59 — "Search TradeNexus. Upload. Done."
1:03 — [Music full, brand mark, fade]
```

- [ ] **Step 2: Read aloud test**

This hook is faster-paced — the efficiency angle works best with crisp, rhythmic delivery.

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS add tradenexus-video/scripts/hook-5-replaces-6-months-en.txt
git -C /home/samu2505/SAAS commit -m "feat: add Hook #5 EN VO script — AI replaces 6 months research (65s)
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Create audio mixing guide and FFmpeg helper

**Files:**
- Create: `tradenexus-video/audio-mixing-guide.md`
- Create: `tradenexus-video/scripts/mix-vo.sh`

**Goal:** Document the audio layer stack and provide a reusable FFmpeg script to mix VO + background music with the video.

- [ ] **Step 1: Write the audio mixing guide**

Write `/home/samu2505/SAAS/tradenexus-video/audio-mixing-guide.md`:

```markdown
# Audio Mixing Guide — TradeNexus Videos

## Layer Stack (top to bottom)

1. **Voiceover track** — Primary content
   - Record clean, normalize to -3dB peak
   - Format: WAV or high-bitrate MP3 (320kbps) before mixing
   - No compression unless voice is too dynamic — preserve natural tone

2. **Background music** — Secondary
   - Duck to -20dB during voiceover
   - Full volume (-0dB relative) only during:
     - First 2 seconds (hook attention grab)
     - Transition moments between acts
     - Last 3 seconds (payoff)

3. **Sound design accents** (optional)
   - Terminal keystroke: short click, 200-400Hz, 80ms
   - Lead found ping: soft sine, 800Hz, 150ms
   - Region transition: low whoosh, 200-600Hz sweep, 300ms
   - Max 3-5 accents per video. Sparse.

## Music Selection Criteria

- Genre: Dark synthwave, ambient techno, driving cinematic
- Tempo: 100-130 BPM (steady pulse, no sudden changes)
- No vocals (fights the VO)
- No major key changes or drops (distracts from narrative)
- Sources: Epidemic Sound, Artlist, royalty-free synthwave collections

## Example Track Characteristics

| Element | What to Look For |
|---------|-----------------|
| Bass | Deep, pulsing, steady — anchors the energy |
| Percussion | Clean kicks, crisp hi-hats — rhythmic but not busy |
| Melody | Minimal — pads and arps, not lead lines |
| Dynamics | Consistent — avoid builds that peak during VO sections |
| Length | 2-4 minutes — loopable if video runs longer |

## Recording Setup

### Hardware
- Mic: Any condenser or dynamic mic at 15cm distance
- Room: Quiet, minimal reverb (closet with clothes works well)
- Pop filter: Use one, or angle mic 15° off-axis

### Software
- Record WAV 48kHz 24-bit
- Normalize to -3dB peak
- Export as 320kbps MP3 for mixing

### Delivery
- Speak like you're explaining to one person at lunch
- Not a presentation. Not a commercial read.
- Slight smile in voice (raises pitch slightly, sounds engaged)
- Pause between sentences. Let the visuals breathe.

## Ducking Parameters

```
Attack:  10ms  (fast — duck as soon as VO starts)
Release: 200ms (smooth — fade music back in naturally)
Ratio:   4:1   (aggressive enough to clear space)
Threshold: -24dB (triggers on speech, not breaths)
```

## Platform Loudness Targets

| Platform | Target LUFS | Max True Peak |
|----------|-------------|---------------|
| TikTok | -14 LUFS | -1 dBTP |
| YouTube Shorts | -14 LUFS | -1 dBTP |
| 抖音 | -14 LUFS | -1 dBTP |
| WeChat Channels | -16 LUFS | -1 dBTP |
| LinkedIn | -16 LUFS | -1 dBTP |
```

- [ ] **Step 2: Write the FFmpeg mix helper script**

Write `/home/samu2505/SAAS/tradenexus-video/scripts/mix-vo.sh`:

```bash
#!/usr/bin/env bash
# mix-vo.sh — Mix voiceover + music into a TradeNexus video
# Usage: ./mix-vo.sh <video.mp4> <voiceover.mp3> <music.mp3> <output.mp4>
# Example: ./mix-vo.sh renders/tradenexus-launch-mobile.mp4 \
#                        recordings/hook-2-vo.mp3 \
#                        music/synthwave-track.mp3 \
#                        output/tradenexus-launch-mobile-vo.mp4

set -euo pipefail

VIDEO="$1"
VO="$2"
MUSIC="$3"
OUTPUT="$4"

# Check dependencies
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg required. Install: sudo apt install ffmpeg"; exit 1; }

# Get durations
VO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VO")
MUSIC_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$MUSIC")
VIDEO_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")

echo "Video:    ${VIDEO_DUR}s"
echo "VO:       ${VO_DUR}s"
echo "Music:    ${MUSIC_DUR}s"
echo "Output:   $OUTPUT"

# If music is shorter than video, loop it
MUSIC_INPUT="$MUSIC"
if (( $(echo "$MUSIC_DUR < $VIDEO_DUR" | bc -l) )); then
    echo "Music shorter than video — will loop"
    MUSIC_FILTER="aloop=loop=-1:size=2e9"
else
    MUSIC_FILTER="anull"
fi

# Mix: VO at full volume, music ducked via sidechain compression
# ffmpeg sidechain: music gets compressed when VO is above threshold
ffmpeg -i "$VIDEO" -i "$VO" -i "$MUSIC" \
  -filter_complex "\
    [2:a]$MUSIC_FILTER,atrim=0:$VIDEO_DUR[music_trimmed]; \
    [music_trimmed][1:a]asidedr=attack=10:release=200:ratio=4:threshold=0.063[music_ducked]; \
    [1:a][music_ducked]amix=inputs=2:weights=1 0.3:normalize=0[audio_out]" \
  -map 0:v -map "[audio_out]" \
  -c:v copy \
  -c:a aac -b:a 256k \
  -shortest \
  -y "$OUTPUT"

echo "Done: $OUTPUT"
echo "Check loudness: ffmpeg -i $OUTPUT -filter:a loudnorm=print_format=summary -f null /dev/null"
```

- [ ] **Step 3: Make the script executable**

```bash
chmod +x /home/samu2505/SAAS/tradenexus-video/scripts/mix-vo.sh
```

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS add tradenexus-video/audio-mixing-guide.md tradenexus-video/scripts/mix-vo.sh
git -C /home/samu2505/SAAS commit -m "feat: add audio mixing guide and FFmpeg mix-vo helper script
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Create posting schedule document

**Files:**
- Create: `tradenexus-video/posting-schedule.md`

**Goal:** A 30-day posting calendar with platform-specific times and content assignments.

- [ ] **Step 1: Write the posting schedule**

Write `/home/samu2505/SAAS/tradenexus-video/posting-schedule.md`:

```markdown
# TradeNexus Video Posting Schedule — 30-Day Rollout

## Daily Cadence

| Platform | Frequency | Best Times (CST) | Hashtags |
|----------|-----------|------------------|----------|
| 抖音 Douyin | 1/day | 12:00, 19:00, 21:00 | #外贸 #跨境电商 #AI出海 #B2B #中国制造 |
| 微信视频号 | 1/day | 12:00, 20:00 | none (WeChat algorithm is keyword-driven) |
| TikTok | 1-2/day | varies by target | #b2b #export #aitools #factory #tradefy |
| YouTube Shorts | 1/day | 12:00 UTC | #b2b #ai #export #tradenexus |
| LinkedIn | 2-3/week | Tue-Thu 8am EST | no hashtags — thought leadership framing |

## Cross-Platform Rule

Post the SAME video across all platforms within a 30-minute window.
If one platform breaks out, the content is already everywhere.

## Week 1: Baseline (Test All Hooks)

| Day | Video | Hook | Platforms |
|-----|-------|------|-----------|
| Mon | V1 (launch-mobile, 50s) | #2 EN — Factory owner wakes up to leads | TikTok, YT Shorts |
| Tue | V2 (launch-mobile-cn, 50s) | #7 CN — 一条指令 | 抖音, 微信 |
| Wed | V3 (output-mobile-final, 60s trim) | #3 EN — AI search shocked me | TikTok, YT Shorts |
| Thu | V4 (mobile, 60s trim) | #1 EN — Competitor FOMO | TikTok, YT Shorts, LinkedIn |
| Fri | V5 (globe, 65s) | #5 EN — Replaces 6 months | TikTok, YT Shorts |
| Sat | V2 (launch-mobile-cn, 50s) | #7 CN — 一条指令 | 抖音, 微信 |
| Sun | V3 (output, full 136s) | #3 EN — Long-form | LinkedIn, WeChat (int'l) |

## Week 2: Double Down on Winners

- Identify which hook got the most views, watch time, and comments
- Repost the winner with slight variation (different music, different CTA wording)
- Post the winner to the platform(s) it didn't go to in Week 1
- Post V3 and V4 full-length (136s) versions to LinkedIn

## Week 3: Iterate

- Post the 2nd-best performer from Week 1 to all platforms
- Record a new VO with the winning hook style applied to a different video
- Test a Chinese version of the best English hook (or vice versa)

## Week 4: Scale

- If a hook is clearly winning (>5K views), create 2 more videos in the same style
- Increase TikTok to 2/day
- Post a compilation: "Best results from 30 days of AI scouting"
- Post a "behind the scenes" or "how I make these" video (authenticity content)

## Daily Checklist

- [ ] Record view counts from yesterday in a spreadsheet
- [ ] Respond to ALL comments and DMs within 1 hour
- [ ] Check TradeNexus search volume (Google Trends, Baidu Index)
- [ ] Post today's video across all platforms within 30-min window
- [ ] Note which hook was used for tracking

## Tracking Spreadsheet Columns

Date | Platform | Video File | Hook # | Views | Likes | Comments | Shares | Watch Time (avg %) | DMs Received | Notes
```

- [ ] **Step 2: Commit**

```bash
git -C /home/samu2505/SAAS add tradenexus-video/posting-schedule.md
git -C /home/samu2505/SAAS commit -m "feat: add 30-day video posting schedule with platform cadence
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Final review and push

- [ ] **Step 1: Verify all files exist**

```bash
ls -la /home/samu2505/SAAS/tradenexus-video/scripts/
ls -la /home/samu2505/SAAS/tradenexus-video/audio-mixing-guide.md
ls -la /home/samu2505/SAAS/tradenexus-video/posting-schedule.md
```

- [ ] **Step 2: Verify script is executable**

```bash
test -x /home/samu2505/SAAS/tradenexus-video/scripts/mix-vo.sh && echo "OK: executable" || echo "FAIL: not executable"
```

- [ ] **Step 3: Check git log for all commits**

```bash
git -C /home/samu2505/SAAS log --oneline -6
```

Expected output shows: 1 commit per task (7 total) plus the design spec commit.

- [ ] **Step 4: Push (optional, if remote configured)**

```bash
git -C /home/samu2505/SAAS push origin master 2>/dev/null || echo "No remote or push skipped"
```

---

## Implementation Order

```
Task 1 (dirs)
  → Task 2 (hook #2 EN)
  → Task 3 (hook #7 CN)
  → Task 4 (hook #3 EN)
  → Task 5 (hook #1 EN)
  → Task 6 (hook #5 EN)
  → Task 7 (mixing guide + script)
  → Task 8 (posting schedule)
  → Task 9 (review)
```

Tasks 2-6 can be done in any order. Tasks 7-8 depend on having at least one VO script to test the mixing workflow against.
```

---

## Self-Review

**1. Spec coverage:**
- 3-act VO structure → Every script (Tasks 2-6) follows the ACT 1/2/3 template ✓
- Hook library (7 hooks) → 5 hooks scripted (the ones paired with existing videos) ✓
- Video-to-hook pairings → Each task matches a specific video to a specific hook ✓
- Audio design (layer stack, ducking, music selection) → Task 7 mixing guide + FFmpeg script ✓
- VO recording workflow → Task 7 recording setup section ✓
- Platform posting cadence → Task 8 schedule with daily cadence table ✓
- Cross-platform rule (30-min window) → Task 8 schedule ✓
- 30-day success targets → Task 8 tracking spreadsheet + week-by-week plan ✓
- Out of scope (Approach B/C, re-rendering, paid) → Not included ✓

**2. Placeholder scan:** No TBDs, TODOs, or vague instructions. All code/examples are concrete.

**3. Type consistency:** File paths are consistent across tasks. Hook numbers match the spec. Video filenames verified against actual renders.

No gaps found. Plan is complete.
