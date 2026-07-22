# Quote by Emir Ulucay

Modern, hızlı ve profesyonel teklif & fatura oluşturma aracı. 

Quote, tamamen tarayıcı üzerinde çalışan, verilerinizi sunuculara göndermeden güvenli bir şekilde yüksek kaliteli (A4 formatında) PDF teklifler ve faturalar oluşturmanızı sağlayan açık kaynaklı bir Next.js uygulamasıdır.

## ✨ Özellikler

- **Gelişmiş PDF Çıktısı**: Hazırladığınız faturaları tek tıkla şık tasarımlı bir PDF dosyasına çevirin.
- **Dinamik Önizleme**: Sol panelde girdiğiniz her bilgi anında sağ taraftaki A4 önizlemesinde güncellenir.
- **Kişiselleştirilebilir Profiller**: Birden fazla profil (ör. Şirketiniz, Freelance işleriniz) oluşturun ve logolarınızı yükleyerek profesyonel bir görünüm elde edin.
- **Satır Öğeleri Yönetimi**: Hizmetlerinizi, fiyatlarını ve miktarlarını kolayca ekleyin. KDV ve genel toplam otomatik olarak hesaplanır.
- **Tamamen İstemci Taraflı (Client-side)**: Girilen hiçbir veri bir veritabanına kaydedilmez. Tüm PDF oluşturma süreçleri tarayıcınızda gerçekleşir.

## 🚀 Teknolojiler

- [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- [Framer Motion](https://www.framer.com/motion/) (Animasyonlar)
- [html2canvas](https://html2canvas.hertzen.com/) & [jsPDF](https://parall.ax/products/jspdf) (PDF oluşturma)

## 📦 Kurulum

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz:

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/emirulucay/quote.git
   cd quote
   ```

2. Gerekli paketleri `pnpm` (veya `npm`, `yarn`) ile yükleyin:
   ```bash
   pnpm install
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   pnpm run dev
   ```

4. Tarayıcınızda uygulamanın çalıştığını görmek için [http://localhost:3000](http://localhost:3000) adresine gidin.

## 🛠️ Klasör Yapısı

- `src/app/page.tsx`: Ana uygulama arayüzü, form paneli ve PDF önizleme mantığı.
- `src/hooks/use-invoice-state.ts`: Fatura öğeleri, profil verileri ve durum yönetiminin yapıldığı özel (custom) hook.
- `src/components/ui/`: `shadcn/ui` tarafından sağlanan yeniden kullanılabilir temel bileşenler (Button, Input, Select vb.).
- `public/`: Açık grafik (OpenGraph) görselleri, logolar ve faviconlar.

## 🤝 Katkıda Bulunma

Bu proje açık kaynaklıdır ve katkılarınıza (Pull Request) her zaman açıktır. Herhangi bir hatayla karşılaşırsanız veya yeni bir özellik eklemek isterseniz `Issues` sekmesinde bir konu başlatabilirsiniz.

## ☕ Geliştiriciye Destek

Eğer bu aracı faydalı bulduysanız ve projeye destek olmak isterseniz bana bir kahve ısmarlayabilirsiniz:  
👉 [Buy Me a Coffee](https://buymeacoffee.com/emirulucay)

---

*Tasarlanıp ❤️ ile geliştirildi — Emir Uluçay.*
