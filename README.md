# Merge Sort — Interactive Simulator & Visualizer

Simulator interaktif algoritma **Merge Sort** dengan gaya desain visual **Neo-brutalism**, animasi fluid bertenaga **GSAP**, dan efek cetak latar belakang berbasis **WebGL Shader**.

Proyek ini dibuat untuk memvisualisasikan bagaimana algoritma Divide and Conquer bekerja secara presisi langkah-demi-langkah dengan pohon rekursi (recursion tree).

---

## ✨ Fitur Utama

- **Pohon Rekursi Interaktif**: Visualisasi pemecahan array (*split*) hingga penggabungan terurut (*merge*) secara level-order.
- **Kontrol Penuh**:
  - Pilihan ukuran array: 6, 8, 12, atau 16 elemen.
  - Kecepatan simulasi fleksibel: 0.5x hingga 3.0x.
  - Mode Play, Pause, Step-by-Step, Rush, dan Acak data baru.
  - Shortcut keyboard: `Space` (Play/Pause), `→` (Next Step), `R` (Reset).
- **Statistik Algoritma Real-time**: Menampilkan jumlah perbandingan aktif, penempatan kartu, dan perbandingan terhadap kompleksitas teoretis $O(n \log n)$.
- **Desain Neo-brutalism**: Palet warna kontras tinggi, hard shadow, stiker aksen, dan WebGL halftone / risograph canvas.
- **Responsif**: Mendukung tampilan desktop dan mobile.

---

## 🚀 Menjalankan Secara Lokal

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan).

1. **Clone repository:**
   ```bash
   git clone https://github.com/antoniorenaldy24/MergeSorting.git
   cd MergeSorting
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```

4. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📦 Build Produksi & Deploy

Untuk membuat build produksi standar:

```bash
npm run build
npm run start
```

### Deploy ke Vercel (Rekomendasi)

1. Buka [Vercel](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Klik tombol **Add New...** > **Project**.
3. Pilih repository `antoniorenaldy24/MergeSorting`.
4. Vercel akan otomatis mendeteksi framework **Next.js**. Klik **Deploy**.
5. Website Anda akan langsung aktif dengan URL produksi gratis (misal `https://mergesorting.vercel.app`).
