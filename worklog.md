# Worklog

---
Task ID: 1
Agent: Main agent (Z.ai)
Task: Membangun website edukasi Merge Sort interaktif bergaya playful game ("MergeSort Quest") untuk materi algoritma sorting — Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui.

Work Log:
- Inisialisasi environment fullstack (curl init-fullstack.sh) — Next.js 16 dev server jalan di port 3000.
- Setup layout.tsx: font Baloo 2 + Nunito via next/font/google (terverifikasi reachable dari sandbox), metadata bahasa Indonesia.
- globals.css: tema neo-brutalism playful — palet candy (pink/kuning/mint/lavender/oranye, tanpa biru/indigo), utility neo-shadow, pola bg-dots/grid-paper/stripes, keyframes (float-bob, wiggle, pop-in, shake-x, pulse-glow, stripe-slide, bounce-soft), scrollbar custom.
- src/lib/mergesort.ts: engine step-by-step — pohon rekursi (node ber-id path L/R), snapshot per langkah (split/leaf/compare/place/mergeDone/finish) dengan narasi Indonesia, mergedPreview parsial, counter perbandingan, parseArrayInput + randomArray unik.
- src/lib/sounds.ts: SFX sintetis Web Audio API (click/pop/correct/wrong/levelUp/victory/gameOver) + persistensi preferensi suara di localStorage.
- components/mergesort/: navbar (sticky + anchor), hero (demo merge 4 kartu auto-loop dengan framer-motion layout animation + stiker dekoratif), concept (Divide/Conquer/Combine + analogi kartu + rekursi), simulator (pohon rekursi responsif per-level, play/pause/step/reset, speed slider, custom input, keyboard shortcut, narasi robot, confetti saat selesai), game "Merge Master" (5 level, 3 nyawa, combo multiplier x2/x3, skor + bonus, best score localStorage, sound toggle, confetti + overlay status), complexity (kartu Big-O, grafik SVG n² vs n log n, tabel turnamen algoritma, fakta seru), code-section (tab Pseudocode/JS/Python + mini syntax highlighter tanpa dependensi + catatan bacaan), footer sticky.
- Lint: perbaiki 5 error (set-state-in-effect → pola goToStep event-driven; Pile diekstrak jadi komponen top-level; init localStorage → readBestScore saat save + disable comment untuk sound sync) + ganti <link> font ke next/font (hilangkan warning).
- Verifikasi agent-browser: render desktop & mobile OK, interaksi simulator (step/autoplay/pause) OK, game end-to-end (pilih benar/salah, skor & combo tepat — 80+125=205, level complete, next level) OK, tab kode OK, sticky footer OK, tanpa error console. Perbaikan bug overflow horizontal mobile (min-w-0 pada grid item section kode).

Stage Summary:
- Deliverable: website "MergeSort Quest" 1 halaman lengkap di src/app/page.tsx (komposisi 8 section) — hanya route `/` sesuai aturan.
- Fitur inti: (1) Simulator visualisasi merge sort langkah-demi-langkah dengan narasi Bahasa Indonesia, (2) Mini game Merge Master 5 level dengan skor/nyawa/combo/confetti/suara, (3) Materi konsep, kompleksitas (grafik + tabel), dan kode 3 bahasa.
- Status: lint bersih, dev server OK, browser-verified end-to-end, responsive mobile OK.

---
Task ID: 2
Agent: Main agent (Z.ai)
Task: Rebuild total menjadi SATU hero section premium berisi simulator Merge Sort (permintaan revisi user): animasi akurat, layout rapi, GSAP advanced + shader WebGL, copywriting profesional Indonesia — materi lain akan lewat PowerPoint.

Work Log:
- Unduh dependensi untuk inline offline: GSAP 3.13.0 core + MotionPathPlugin + SplitText + ScrambleTextPlugin + CustomEase (jsdelivr), font Space Grotesk 400/700 + JetBrains Mono 400/700 (subset latin woff2 base64) + subset simbol (≤, →).
- Bangun sebagai single-file HTML vanilla (scripts/sim/): template.html, style.css (tema dark premium glassmorphism), shader.js (WebGL domain-warped FBM aurora, uniform uEnergy digerakkan fase simulasi + parallax mouse + grain + vignette), engine.js (pohon rekursi level-order: split floor(len/2), singleton copy trunk, generator langkah split/place 1:1 algoritma, merge stabil <=), anim.js (runner timeline: mitosis split + cut flash, open grup + slot, pulse dua pointer cyan/amber, penerbangan kartu MotionPath, sweep + sorted, konsumsi child + cascade trunk + reap tag, finale), ui.js (controller play/pause/step/rush, intro SplitText mask reveal, parallax orbs quickTo, keyboard Space/→/R/Esc).
- build.py merakit semua + font base64 → download/merge-sort-simulator.html (321 KB, offline penuh) dan public/simulator.html.
- page.tsx diganti redirect('/simulator.html'); layout.tsx metadata profesional; hapus komponen playful lama (src/components/mergesort, lib/sounds, lib/mergesort); eslint ignore utk scripts/download/public html.
- Bug yang ditemukan & diperbaiki via pengujian headless (agent-browser + VLM QA):
  1) runSplit signature menerima st bukan level → playback beku di langkah 1.
  2) grup hasil merge menyimpan kartu di landed bukan cards → head sumber undefined, rantai putus; fix: g.cards=landed saat close + un-fill slot sumber.
  3) BUG ALGORITMIK KRITIS: buildSteps mensimulasikan merge dari nilai asli (belum terurut) padahal sumber level berikutnya sudah terurut → hasil akhir tidak terurut; fix: working array bottom-up dengan write-back per merge.
  4) overflow-x mobile dari orb fixed → html overflow-x clip.
  5) tag level yatim setelah baris dikonsumsi → reapEmptyTags.
- Verifikasi: full-run n=8 & n=16 menghasilkan array terurut identik dengan expected sort (eval JS), penempatan = n·log n tepat, pause/resume/step/reset/acak/ukuran/keyboard OK, tanpa error console, QA visual VLM 3 viewport (desktop final, n=16, mobile 390) lolos, preview localhost:3000 → 307 → simulator.html OK, lint bersih.

Stage Summary:
- Deliverable final: /home/z/my-project/download/merge-sort-simulator.html (single-file, offline, 321 KB) — identik dengan yang diserve di public/simulator.html (preview link).
- Halaman = hero section tunggal: topbar, headline SplitText, chips kompleksitas, CTA, panel konsol simulasi (toolbar 6/8/12/16 elemen, kecepatan 0.5–3x, progress, stage pohon rekursi 4–5 level, statistik, narasi ScrambleText), footnote level-order vs depth-first.
- Akurasi: setiap langkah = operasi algoritmik nyata (split tanpa perbandingan; place = satu perbandingan/penempatan two-pointer stabil; drain tanpa perbandingan); hasil terurut terverbatim untuk n=8/16.
- Sumber daya untuk iterasi: scripts/sim/* (edit + jalankan python3 scripts/sim/build.py).

---
Task ID: 3
Agent: Main agent (Z.ai)
Task: Iterasi sesuai feedback user: (1) ubah gaya ke NEO-BRUTALISM, (2) perbaiki pergerakan kartu yang mengganggu — kartu yang akan ditempatkan selalu "digeser ke kiri dulu" sebelum naik (konten L2→L1). Animasi lain dipertahankan (user sudah suka).

Work Log:
- Diagnosis akar masalah dari kode lama: `.group{display:flex}` → saat kartu diambil, flex menutup celah → kartu tetangga SNAP ke kiri (tanpa animasi); plus `fromX = srcKid.x` (tepi kiri grup) sebagai asal penerbangan → kartu non-pertama teleport ke tepi kiri dulu baru terbang.
- Fix engine.js: kartu & slot kini `position:absolute` dengan `left = idx*(CW+INTRA)` di dalam grup (grup diberi `height:CH`) → kartu sumber TIDAK PERNAH bergeser saat saudaranya diambil (baris sumber = array tetap yang dibaca pointer — secara algoritmik juga lebih jujur).
- Fix anim.js runPlace: asal penerbangan = `srcKid.x + winner.offsetLeft` (posisi kartu sesungguhnya); mendarat sebagai anak langsung grup di `left = insertIdx*48` (bukan anak slot) sehingga offsetParent selalu `.group` — pengukuran posisi pada merge level berikutnya selalu tepat; slot sumber yang dikosongkan dikembalikan ke garis putus.
- Restyle total neo-brutalism (style.css rewrite): kertas krem #F4F0E5, tinta #16161A, aksen flat kuning/pink/cyan/lime, border 2.5-3px, hard shadow 0-blur, sudut 90° tanpa radius; headline "Sort" = huruf stiker kuning bergaris tinta (SplitText per-char, nth-child rotasi ±2°); tombol dengan efek tekan (translate + shadow menyusut); fase & progress pakai strip diagonal hard-stop; kartu cmp-l cyan / cmp-r pink / fly 9px shadow / sorted lime; final group "nudge" steps(1) flicker; rowtag jadi chip hitam; sweep jadi bar lime flat.
- shader.js rewrite "cetakan riso": kertas krem + bercak halftone dither Bayer 8x8 (dua medan vnoise bergerak) + dua cincin tinta mengapung + grain cetak; uEnergy tetap digerakkan fase; fallback no-gl kertas flat + grid.
- ui.js: SplitText tanpa mask (box-shadow stiker tidak terpotong); intro char back.out(1.7)+autoAlpha. template.html: favicon/mark bar tajam kuning/pink/cyan/lime bergaris tinta, chip ditambah kotak aksen.
- QA headless (agent-browser): n=8 & n=16 full-run → hasil terurut identik dengan sort referensi; wr = n·log₂n tepat (24 & 64); instrumentasi 24 penerbangan: 10 bermula dari offset non-zero (48/96/144 px — kartu ke-2/3/4, dulu terbang dari tepi kiri grup) dan 0 kasus kartu tetangga bergeser; tangkapan mid-flight kartu "33" (sisi R, mulai di left=236 vs tepi grup 188) membuktikan terbang langsung dari posisi aslinya; keyboard Space/→/Esc OK; console bersih; VLM QA 4 screenshot (hero, mid-flight, done, mobile 390px) — semua PASS tanpa defect.

Stage Summary:
- Perbaikan pergerakan TERVERIFIKASI: kartu tidak lagi digeser ke kiri dulu; terbang lurus dari posisi aslinya ke slot tujuan (arc MotionPath).
- Gaya penuh neo-brutalism diterapkan konsisten (topbar→footnote), termasuk shader latar bergaya cetak riso.
- Deliverable: download/merge-sort-simulator.html (321.9 KB) = public/simulator.html (md5 identik, dev server 3000 aktif, / → 307 → /simulator.html).
- Sumber daya iterasi tetap: scripts/sim/* + python3 scripts/sim/build.py.
