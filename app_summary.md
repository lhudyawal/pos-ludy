Berikut adalah finalisasi rancangan Core Features dan App Flow untuk aplikasi Ludy Sambel Pecel. Rancangan ini menggabungkan fungsi POS, CRM, manajemen performa, hingga penggajian dalam satu sistem yang terintegrasi.

I. Core Features (Fitur Utama)
1. Panel Admin (Manajemen & Monitoring)
Inventory Control: Input produk, varian rasa/level pedas, harga, dan manajemen stok gudang.
Store CRM (Database Toko): * Pencatatan profil toko (nama, alamat, koordinat GPS, kontak).
Customer Lifetime Value: Riwayat transaksi per toko untuk melihat toko mana yang paling loyal.
Sales Management (HR & Performance):
Target Setting: Input target penjualan bulanan (nominal/qty) untuk tiap individu.
Payroll System: Pengaturan gaji pokok, tunjangan, dan kalkulator komisi otomatis berdasarkan pencapaian target.
Centralized Reporting: * Sales Log: Pantauan aktivitas harian semua sales secara real-time.
Financial Report: Laporan laba rugi sederhana berdasarkan harga modal dan harga jual.
2. Panel Sales (Operasional Lapangan)
Smart Visit: Daftar toko yang harus dikunjungi hari ini dengan fitur "Check-in" berbasis lokasi (GPS).
Direct POS: Input pesanan di tempat, kalkulasi total harga otomatis, dan cetak struk digital (WhatsApp/PDF).
Daily Log Activity: Rekapitulasi mandiri mengenai berapa banyak toko yang dikunjungi dan total omzet yang didapat hari itu.
My Performance Dashboard: Grafik pencapaian target bulanan agar sales tahu berapa kekurangan mereka untuk mencapai bonus/komisi.
II. Struktur Log Transaksi Ganda
Aplikasi akan mencatat satu transaksi ke dalam dua perspektif berbeda:
Log Sales: Fokus pada siapa yang menjual, kapan, dan berapa totalnya (untuk audit harian & gaji).
Log Toko: Fokus pada toko mana yang membeli dan produk apa yang paling laku di sana (untuk strategi CRM & distribusi).
III. App Flow (Alur Kerja Terintegrasi)
Fase A: Inisialisasi (Admin - Awal Bulan)
Admin memperbarui stok produk di gudang.
Admin mengatur Target Bulanan untuk tiap sales (misal: Sales A target Rp10 Juta/bulan).
Admin memasukkan parameter Gaji & Komisi (misal: Bonus 2% jika target tercapai).
Fase B: Aktivitas Harian (Sales - Lapangan)
Check-in: Sales sampai di toko mitra, membuka aplikasi, dan melakukan check-in lokasi.
Transaction: Sales menginput pesanan sambel pecel. Stok di tangan sales berkurang secara sistem.
Logging: Begitu klik "Selesai", data langsung terpecah:
Masuk ke Log Harian Sales (untuk laporan ke Admin).
Masuk ke Riwayat Toko di database CRM.
Closing Harian: Di akhir hari, sales melakukan verifikasi total uang yang dibawa dengan total di aplikasi.
Fase C: Monitoring & Verifikasi (Admin - Harian)
Admin mengecek Log Transaksi Harian untuk memvalidasi setoran uang dari sales.
Admin melihat toko-toko mana saja yang telah dikunjungi melalui data CRM.
Fase D: Penggajian (Admin - Akhir Bulan)
Sistem secara otomatis menghitung total penjualan sales selama sebulan.
Sistem membandingkan total penjualan dengan Target Bulanan.
Admin membuka menu Payroll, meninjau hasil kalkulasi (Gaji Pokok + Komisi), dan melakukan finalisasi pembayaran gaji.
IV. Ringkasan Teknis untuk Pengembangan
Kebutuhan Data	Sumber Input	Output Utama
CRM	Admin & Sales	Loyalitas Toko & Pemetaan Wilayah
Log Transaksi	Sales (Real-time)	Laporan Penjualan & Stok
Target & Gaji	Admin (Config)	Motivasi Sales & Efisiensi Payroll