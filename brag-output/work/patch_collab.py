import json
p='index.html'; s=open(p).read()
AV=json.load(open('avatars.json'))
QR=open('qr.svg').read().replace('<svg ','<svg class="size-28 shrink-0 rounded-sm" ',1)
def av(name,size): return AV[name].replace('SIZE',str(size))

scene = f'''  <!-- ============ 4b. COLLABORATE ============ -->
  <div class="scene" id="s7">
    <div class="abs" style="left:150px; top:330px; width:720px">
      <div class="display" id="h7a" style="font-size:112px">Friends add theirs.</div>
      <div id="h7b" style="font-size:40px; color:#6a6a6a; margin-top:30px; letter-spacing:-0.02em">Same link. Just a name.<br><span style="color:#1a3a3a; font-weight:600">No signup.</span></div>
    </div>

    <!-- owner: Collaborate sheet (Gallery.tsx CollaborateSheet) -->
    <div class="phone" id="ownerPhone" style="left:880px; top:106px; transform-origin: top left">
      <div class="screen">
        <div class="notch"></div>
        <section class="space-y-4 px-4 pt-14">
          <div class="relative -mx-4 h-44 overflow-hidden bg-brand-teal">
            <div class="cover7 ph absolute inset-0"></div>
            <div class="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent"></div>
            <div class="absolute inset-x-0 bottom-0 space-y-2 p-5 text-white">
              <h1 class="text-[34px] leading-[1.05] font-medium tracking-[-1px]">Goa trip</h1>
              <p class="text-sm text-white/85">116 photos · 1.4 GB · deleted in 3 days</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <span class="flex h-16 flex-col items-center justify-center gap-1 rounded-lg bg-primary text-sm font-semibold text-white">+ Add photos</span>
            <span class="flex h-16 flex-col items-center justify-center gap-1 rounded-lg border border-hairline text-sm font-semibold text-ink">Share</span>
            <span class="relative flex h-16 flex-col items-center justify-center gap-1 rounded-lg border border-hairline text-sm font-semibold text-ink">Collaborate<span id="collabDot" class="absolute top-2.5 right-2.5 size-2 rounded-full bg-brand-teal"></span></span>
          </div>
        </section>
        <div id="backdrop7" class="abs inset-0 bg-ink/50"></div>
        <div id="sheet7" class="abs inset-x-0 bottom-0 rounded-t-xl bg-canvas text-ink">
          <div class="space-y-4 px-5 pt-5 pb-8">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold">Collaborate</h2>
              <span class="grid size-11 place-items-center rounded-md text-muted"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path d="m6 6 12 12M6 18 18 6" stroke-linecap="round"/></svg></span>
            </div>
            <div id="switch7" class="flex w-full items-center justify-between gap-4 rounded-lg border border-hairline p-4 text-left">
              <span class="space-y-0.5">
                <span class="block font-semibold text-ink">Let friends add photos</span>
                <span class="block text-sm text-muted" id="switchTxt">Off: the link is view and download only.</span>
              </span>
              <span id="track7" class="relative h-7 w-12 shrink-0 rounded-full bg-surface-strong"><span id="knob7" class="absolute top-1 left-1 size-5 rounded-full bg-white shadow"></span></span>
            </div>
            <div id="onBlock" style="overflow:hidden">
              <div class="space-y-4">
                <p class="text-sm text-muted">Send the same link or QR. Turning this off pauses new uploads; photos already added stay.</p>
                <div class="flex items-center gap-4 rounded-lg border border-hairline p-3">
                  {QR}
                  <div class="space-y-2 text-sm"><p class="text-muted">Friends can scan this with their phone camera.</p><span class="inline-flex h-10 items-center rounded-md border border-hairline px-3 font-semibold text-ink">Download QR</span></div>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <h3 class="text-sm font-semibold text-ink">Contributors</h3>
              <ul class="divide-y divide-hairline rounded-lg border border-hairline">
                <li class="flex items-center gap-3 px-4 py-3">{av("Sam",32)}<span class="min-w-0 flex-1 truncate font-medium text-ink">Sam (you)</span><span class="text-sm text-muted">116 photos</span></li>
                <li class="contrib flex items-center gap-3 px-4 py-3" style="overflow:hidden">{av("Riya",32)}<span class="min-w-0 flex-1 truncate font-medium text-ink">Riya</span><span class="text-sm text-muted">24 photos</span></li>
                <li class="contrib flex items-center gap-3 px-4 py-3" style="overflow:hidden">{av("Arjun",32)}<span class="min-w-0 flex-1 truncate font-medium text-ink">Arjun</span><span class="text-sm text-muted">18 photos</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="tap" id="tapO"></div>
      </div>
    </div>

    <!-- guest: JoinCard → Add your photos (Gallery.tsx) -->
    <div class="phone" id="guestPhone" style="left:1365px; top:62px; transform-origin: top left">
      <div class="screen">
        <div class="notch"></div>
        <section class="space-y-4 px-4 pt-14">
          <div class="relative -mx-4 h-48 overflow-hidden bg-brand-teal">
            <div class="cover7 ph absolute inset-0"></div>
            <div class="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent"></div>
            <div class="absolute inset-x-0 bottom-0 space-y-2 p-5 text-white">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"><span class="size-1.5 rounded-full bg-brand-mint"></span> Shared album</span>
              <h1 class="text-[34px] leading-[1.05] font-medium tracking-[-1px]">Goa trip</h1>
              <p class="text-sm text-white/85" id="gMeta">116 photos · 1.4 GB · deleted in 3 days</p>
            </div>
          </div>
          <div class="relative" style="height:236px">
            <form id="joinCard" class="abs inset-x-0 top-0 space-y-4 rounded-xl bg-brand-lavender/35 p-5">
              <div class="space-y-1">
                <p class="text-lg font-semibold text-ink">Were you on this trip?</p>
                <p class="text-sm text-body">Add your photos to “Goa trip”. Just your name, no account.</p>
              </div>
              <div class="flex gap-2">
                <div class="flex h-12 min-w-0 flex-1 items-center rounded-md border border-ink bg-canvas px-4 text-ink"><span id="gName"></span><span id="gCaret" class="ml-px inline-block h-5 w-[2px] bg-ink"></span><span id="gPh" class="text-muted-soft">Your name</span></div>
                <span id="joinBtn" class="flex h-12 shrink-0 items-center rounded-md bg-primary px-5 text-[15px] font-semibold text-white">Join trip</span>
              </div>
              <p class="text-xs text-muted">Just looking? Scroll down to view and download.</p>
            </form>
            <div id="guestActions" class="abs inset-x-0 top-0 space-y-4">
              <div class="grid grid-cols-[1fr_auto] gap-2">
                <span id="addBtn" class="flex h-14 items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-white"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-5"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Add your photos</span>
                <span class="flex h-14 items-center justify-center gap-2 rounded-lg border border-hairline px-4 text-sm font-semibold text-ink">Invite</span>
              </div>
              <p class="inline-flex items-center gap-2 text-sm text-muted">{av("Riya",22)} Adding as <span class="font-semibold text-ink">Riya</span></p>
              <div id="chips7" class="flex gap-2">
                <span class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white">Everyone · 140</span>
                <span class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-hairline pr-4 pl-1.5 text-sm font-semibold text-ink">{av("Sam",28)}Sam · 116</span>
                <span class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-hairline pr-4 pl-1.5 text-sm font-semibold text-ink">{av("Riya",28)}You · 24</span>
              </div>
            </div>
          </div>
          <ul class="-mx-4 grid grid-cols-3 gap-0.5" id="gTiles"></ul>
        </section>
        <div id="gTray" class="abs inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 px-4 pt-3 pb-8">
          <div class="space-y-3 rounded-lg border border-hairline bg-canvas p-4 shadow-sm">
            <div class="flex items-baseline justify-between gap-3">
              <p class="text-sm font-semibold text-ink" id="trayTitle">Adding 24 photos…</p>
              <span class="text-xs text-muted" id="traySize">0 MB / 81 MB</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-surface-strong"><div id="trayBar" class="h-full rounded-full bg-brand-teal"></div></div>
            <p class="text-xs text-muted">Keep this page open. Originals upload in full quality.</p>
          </div>
        </div>
        <div id="gToast" class="abs inset-x-0 top-14 z-50 flex justify-center px-4"><p class="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg">24 photos added. Thanks, Riya!</p></div>
        <div class="tap" id="tapG"></div>
      </div>
    </div>
  </div>

'''
anchor='  <!-- ============ 5. ORIGINALS, ANY DEVICE ============ -->'
assert anchor in s; s=s.replace(anchor, scene+anchor)

# gallery template: people + avatars on tiles
rep=[
('<p class="text-sm text-white/85">116 photos · 3 people · 1.9 GB · deleted in 3 days</p>','<p class="text-sm text-white/85">158 photos · 3 people · 2.4 GB · deleted in 3 days</p>'),
('      <ul class="tiles -mx-4 grid grid-cols-3 gap-0.5"></ul>',
 f'''      <div class="chips flex gap-2 overflow-hidden">
        <span class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white">Everyone · 158</span>
        <span class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-hairline pr-4 pl-1.5 text-sm font-semibold text-ink">{av("Sam",28)}Sam · 116</span>
        <span class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-hairline pr-4 pl-1.5 text-sm font-semibold text-ink">{av("Riya",28)}Riya · 24</span>
        <span class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-hairline pr-4 pl-1.5 text-sm font-semibold text-ink">{av("Arjun",28)}Arjun · 18</span>
      </div>
      <ul class="tiles -mx-4 grid grid-cols-3 gap-0.5"></ul>'''),
# per-tile avatar
('    <span class="chk absolute top-1.5 right-1.5',
 '    <span class="absolute bottom-1.5 left-1.5 rounded-full ring-2 ring-white/90">${AVS[i % 3]}</span>\n    <span class="chk absolute top-1.5 right-1.5'),
('const PHOTOS = Array.from', f'const AV = {json.dumps({k: v.replace("SIZE","22") for k,v in AV.items()})};\nconst AVS = [AV.Sam, AV.Riya, AV.Arjun];\nconst PHOTOS = Array.from'),
('dv.label(nSel || "all 116")','dv.label(nSel || "all 158")'),
# retime scene 5 (+4.4) and scene 6 (+4.0)
('  // Scene 5: any device (13.0 - 16.8)\n','  // Scene 5: any device (17.4 - 20.9), authored in local time t5\n  { const t = T - 4.4;\n'),
('s5out = eio(seg(t, 16.6, 16.95))','s5out = eio(seg(t, 16.15, 16.45))'),
('  // Scene 6: auto-delete + outro (16.8 - 21)\n','  }\n  // Scene 6: auto-delete + outro (20.8 - 25), authored in local time\n  { const t = T - 4.0;\n'),
('const DUR = 21;','const DUR = 25;'),
]
for a,b in rep:
    assert a in s, a; s=s.replace(a,b)

# close scene 6 block, add collab block; renderAt param renamed
s=s.replace('window.renderAt = function (t) {','window.renderAt = function (T) {\n  const t = T;',1)
end_marker='  set($("#tag"), inUp(t, 18.85, .5, 24));\n'
assert end_marker in s
collab_js = r'''  set($("#tag"), inUp(t, 18.85, .5, 24));
  }
  renderCollab(T);
'''
s=s.replace(end_marker, collab_js)

collab_fn = r'''
// ---------- collaboration scene (12.95 - 17.4) ----------
$$(".cover7").forEach((el) => (el.style.backgroundImage = photo(0)));
for (let i = 0; i < 9; i++) $("#gTiles").insertAdjacentHTML("beforeend", `<li class="relative"><span class="relative block aspect-square w-full overflow-hidden bg-surface-strong"><span class="ph block size-full" style="background-image:${photo(i * 2 + 5)}"></span>
  <span class="av absolute bottom-1.5 left-1.5 rounded-full ring-2 ring-white/90">${AV.Sam}</span></span></li>`);
const gTiles = $$("#gTiles li");
const onBlock = $("#onBlock"), onH = onBlock.scrollHeight;
function tapOn(tapEl, target, screen, scale, at, t) {
  const p = seg(t, at - .25, at + .3);
  if (!(p > 0 && p < 1)) return false;
  const r = target.getBoundingClientRect(), sr = screen.getBoundingClientRect();
  tapEl.style.left = (r.left + r.width / 2 - sr.left) / scale + "px"; tapEl.style.top = (r.top + r.height / 2 - sr.top) / scale + "px";
  const press = p < .45 ? eo(p / .45) : 1;
  set(tapEl, { o: p < .45 ? press : 1 - eo((p - .45) / .55), s: p < .45 ? 1.4 - .5 * press : .9 + .6 * (p - .45) });
  return true;
}
function renderCollab(t) {
  const s7 = $("#s7"), out = eio(seg(t, 17.05, 17.4));
  set(s7, { o: (t >= 12.95 ? 1 : 0) * (1 - out), s: 1 - .03 * out });
  set($("#h7a"), inUp(t, 13.0, .45)); set($("#h7b"), inUp(t, 13.25, .45));
  const op = eo(seg(t, 13.0, 13.5)), gp = eo(seg(t, 13.2, 13.7));
  set($("#ownerPhone"), { o: op, y: (1 - op) * 160 });
  set($("#guestPhone"), { o: gp, y: (1 - gp) * 160, s: 1.1 });
  // owner flips the switch at 13.85
  const on = t >= 13.85, sw = eo(seg(t, 13.85, 14.05));
  $("#knob7").style.left = 4 + 20 * sw + "px";
  $("#track7").className = `relative h-7 w-12 shrink-0 rounded-full ${on ? "bg-brand-teal" : "bg-surface-strong"}`;
  $("#switchTxt").textContent = on ? "On: anyone with the link joins with their name and uploads." : "Off: the link is view and download only.";
  $("#collabDot").style.opacity = on ? 1 : 0;
  onBlock.style.height = onH * eio(seg(t, 13.95, 14.35)) + "px"; onBlock.style.opacity = eo(seg(t, 14.05, 14.4));
  const contrib = $$(".contrib");
  [16.45, 16.75].forEach((at, i) => { const p = eo(seg(t, at, at + .3)); contrib[i].style.display = t >= at ? "flex" : "none"; contrib[i].style.opacity = p; contrib[i].style.transform = `translateX(${(1 - p) * 20}px)`; });
  if (!tapOn($("#tapO"), $("#track7"), $("#ownerPhone .screen"), 1, 13.85, t)) set($("#tapO"), { o: 0 });
  // guest types a name, joins, uploads
  const name = "Riya", nt = Math.round(name.length * seg(t, 14.1, 14.6));
  $("#gName").textContent = name.slice(0, nt); $("#gPh").style.display = nt ? "none" : "inline";
  $("#gCaret").style.opacity = t > 14.0 && t < 14.85 && (t < 14.6 || Math.floor(t * 2.5) % 2 === 0) ? 1 : 0;
  const joined = eo(seg(t, 14.95, 15.25));
  set($("#joinCard"), { o: 1 - eio(seg(t, 14.85, 15.0)), y: -10 * seg(t, 14.85, 15.0) });
  set($("#guestActions"), { o: joined, y: (1 - joined) * 16 });
  const gScreen = $("#guestPhone .screen");
  if (!tapOn($("#tapG"), $("#joinBtn"), gScreen, 1.1, 14.75, t) && !tapOn($("#tapG"), $("#addBtn"), gScreen, 1.1, 15.4, t)) set($("#tapG"), { o: 0 });
  const tr = eio(seg(t, 15.55, 16.35)), trayIn = eo(seg(t, 15.5, 15.75)), trayOut = eio(seg(t, 16.4, 16.6));
  set($("#gTray"), { o: trayIn * (1 - trayOut), y: (1 - trayIn) * 40 + trayOut * 40 });
  $("#trayBar").style.width = tr * 100 + "%";
  $("#traySize").textContent = `${Math.round(81 * tr)} MB / 81 MB`;
  const added = t >= 16.4;
  set($("#chips7"), { o: eo(seg(t, 16.45, 16.7)) });
  $("#gMeta").textContent = added ? "140 photos · 2 people · 1.7 GB · deleted in 3 days" : "116 photos · 1.4 GB · deleted in 3 days";
  gTiles.forEach((li, i) => { $(".av", li).innerHTML = added && i < 3 ? AV.Riya : AV.Sam; const p = added && i < 3 ? back(seg(t, 16.45 + i * .06, 16.75 + i * .06)) : 1; li.style.transform = `scale(${.6 + .4 * p})`; li.style.opacity = clamp(p * 2); });
  gTiles.forEach((li, i) => { if (added && i < 3) $(".ph", li).style.backgroundImage = photo(30 + i); });
  const ti = eo(seg(t, 16.45, 16.65)), to = eio(seg(t, 17.0, 17.15));
  set($("#gToast"), { o: ti * (1 - to), y: (1 - ti) * -12 });
}
window.DUR = DUR;'''
s=s.replace('\nwindow.DUR = DUR;', collab_fn, 1)
open(p,'w').write(s)
print("ok")
