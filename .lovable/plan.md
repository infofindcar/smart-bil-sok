

## Plan: Fix Mobile Chat Performance and Screen Jumping

### Root Causes Identified

1. **`backdrop-blur-2xl`** on the main chat card (line 576) — forces GPU to re-sample underlying pixels every frame. Extremely expensive on mobile, especially during typing when content changes constantly.

2. **Competing scroll handlers causing screen jumps** — Three separate mechanisms fire simultaneously when typing on mobile:
   - `visualViewport` resize listener calls `scrollIntoView` (line 323-324)
   - `inputFocused` effect calls both `scrollIntoView` AND `queueScrollToBottom` (line 336-340)
   - `messages.length` effect calls `queueScrollToBottom` (line 343-345)
   - `visibleText` change effect calls `queueScrollToBottom` (line 365-367)
   
   These fight each other, causing the screen to jump up and down.

3. **Typewriter effect causes excessive re-renders** — `setVisibleText` is called every ~30ms per character, each triggering a full React re-render of the entire chat + a scroll update.

4. **Textarea auto-resize on every keystroke** — `el.style.height = '0px'` then `el.style.height = scrollHeight` causes layout thrashing (lines 748-750).

### Changes

#### 1. Remove `backdrop-blur` from chat card (`GuidedSearch.tsx`)
- Replace `backdrop-blur-2xl` on line 576 with a solid `bg-card` background
- Replace `bg-background/60` on textarea container (line 741) with solid `bg-background`
- This alone will dramatically improve mobile frame rate

#### 2. Consolidate scroll logic — stop competing handlers
- Remove the `visualViewport` resize listener entirely (lines 316-331) — it's redundant with the `inputFocused` effect and causes double-scrolling
- Simplify the `inputFocused` effect to only call `queueScrollToBottom(true)` with a single 350ms delay (remove the `scrollIntoView` call)
- Debounce the `visibleText` scroll effect — only scroll every 200ms during typewriting instead of on every character

#### 3. Optimize typewriter to batch updates
- Instead of calling `setVisibleText` per character (~30ms intervals), batch updates: accumulate 3-5 characters before calling setState
- This reduces re-renders from ~30/sec to ~8/sec during typing animation

#### 4. Fix textarea resize to avoid layout thrashing
- Use `requestAnimationFrame` wrapper around the height recalculation
- Don't reset to `0px` first — set directly to `scrollHeight` only if it changed

### Files Changed
- `src/components/GuidedSearch.tsx` — all four fixes above

