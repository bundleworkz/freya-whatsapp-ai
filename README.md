# 🌿 Freya Nişantaşı - WhatsApp AI Müşteri Asistanı

WhatsApp üzerinden yeni müşterilerle otomatik iletişim kuran, sorunlarını dinleyen, hizmet ve fiyat bilgisi veren, iletişim bilgilerini toplayan AI asistan sistemi.

## 🏗️ Teknoloji

- **Next.js 14** - Backend + Frontend
- **Twilio** - WhatsApp Business API
- **Claude AI (Anthropic)** - Yapay zeka motoru
- **Supabase** - Veritabanı (PostgreSQL)
- **Vercel** - Hosting

## 🚀 Kurulum

### 1. Repo'yu klonla
```bash
git clone https://github.com/YOUR_USERNAME/freya-whatsapp-ai.git
cd freya-whatsapp-ai
npm install
```

### 2. Environment variables
`.env.example` dosyasını `.env.local` olarak kopyala ve doldur:
```bash
cp .env.example .env.local
```

### 3. Geliştirme
```bash
npm run dev
```

### 4. Deploy (Vercel)
GitHub'a push et, Vercel'de import et, environment variables ekle.

## 📁 Yapı

```
├── app/
│   ├── api/
│   │   ├── webhook/route.js    # Twilio webhook (ana işlem)
│   │   ├── leads/route.js      # Lead CRUD
│   │   └── conversations/route.js # Konuşma geçmişi
│   ├── layout.js
│   ├── page.js                  # Dashboard
│   └── globals.css
├── lib/
│   ├── supabase.js              # Veritabanı bağlantısı
│   ├── ai.js                    # Claude AI entegrasyonu
│   ├── time.js                  # Mesai saati kontrolü
│   └── notify.js                # Bildirim sistemi
└── .env.example
```

## 🔗 Webhook URL
Deploy sonrası Twilio'da webhook URL olarak ayarla:
```
https://YOUR-DOMAIN.vercel.app/api/webhook
```
