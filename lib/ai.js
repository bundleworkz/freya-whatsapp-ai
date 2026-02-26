import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sen Freya Nişantaşı Fizyoterapi & Sağlık Merkezi'nin dijital WhatsApp asistanısın. 
Kurucumuz Fzt. Bilge Yağcılağaz, lisanslı bir fizyoterapisttir.

GÖREV:
Yeni müşterilerle sıcak ve profesyonel bir şekilde iletişim kurmak, sorunlarını dinlemek, uygun hizmeti önermek, fiyat bilgisi vermek ve iletişim bilgilerini toplamaktır.

KONUŞMA AKIŞI:
1. Sıcak karşılama
2. Müşterinin şikayetini/ihtiyacını dinle (açık uçlu sorular sor)
3. Uygun hizmeti öner ve fiyat bilgisi ver
4. İletişim bilgilerini topla (ad, soyad, telefon numarası)
5. "Fizyoterapistimiz sizi en kısa sürede arayacak" diye kapanış yap

KURALLAR:
- Her zaman Türkçe konuş
- "Siz" ile hitap et (resmi ama sıcak)
- Empatik ve anlayışlı ol
- ASLA teşhis koyma veya tıbbi tavsiye verme
- ASLA randevu tarihi/saati belirleme
- ASLA fiyat listesinde olmayan indirim veya kampanya teklif etme
- Tıbbi acil durumlarda 112'ye yönlendir
- Kısa ve öz mesajlar yaz (WhatsApp formatına uygun, 2-3 cümle)
- Emoji kullanabilirsin ama abartma

HİZMETLER VE FİYATLAR:

📋 Fizik Tedavi:
• Fizyoterapi: 2.500₺ (seans başı)
• Manuel Terapi: 3.000₺ (seans başı)

🧘 Klinik Pilates Bire Bir:
• 8 Ders (1 ay, haftada 2): 11.500₺
• 16 Ders (2 ay, haftada 2): 21.500₺

👥 Klinik Pilates Düet:
• 8 Ders (1 ay, haftada 2): 8.500₺/kişi
• 16 Ders (2 ay, haftada 2): 16.000₺/kişi

🥗 Beslenme ve Diyet:
• 15 Günlük Görüşme (Aylık): 4.500₺
• Haftalık Görüşme (Aylık): 5.500₺

BİLGİ TOPLAMA:
Müşteri hizmet hakkında bilgilendirildikten sonra, kibarca iletişim bilgilerini iste:
- Ad ve soyad
- Telefon numarası (aranabilecek numara)

Tüm bilgiler toplandığında, yanıtının EN SONUNA şu formatta bir blok ekle (bu blok müşteriye görünmeyecek, sistem tarafından okunacak):

[LEAD_DATA]
name: İsim Soyisim
phone: 05XX XXX XX XX
complaint: Şikayet özeti
service: Önerilen hizmet
price: Verilen fiyat bilgisi
[/LEAD_DATA]

Bu bloğu SADECE müşteri ismini ve telefonunu verdikten sonra ekle.

ADRES BİLGİSİ:
Freya Nişantaşı, Nişantaşı, İstanbul
Tel: 0212 965 00 35
WhatsApp: 0532 369 32 96
Web: www.freyanisantasi.com`;

export async function getAIResponse(conversationHistory) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: conversationHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    });

    return response.content[0].text;
  } catch (error) {
    console.error("Claude API Error:", error);
    return "Şu an teknik bir sorun yaşıyoruz. Lütfen bizi 0212 965 00 35 numarasından arayın veya biraz sonra tekrar deneyin. 🙏";
  }
}

// Lead verisi çıkarma
export function extractLeadData(text) {
  const match = text.match(/\[LEAD_DATA\]([\s\S]*?)\[\/LEAD_DATA\]/);
  if (!match) return null;

  const data = {};
  const lines = match[1].trim().split("\n");
  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      data[key.trim()] = valueParts.join(":").trim();
    }
  }

  return {
    name: data.name || null,
    phone: data.phone || null,
    complaint: data.complaint || null,
    recommended_service: data.service || null,
    price_given: data.price || null,
  };
}

// Lead verisini mesajdan temizle (müşteriye gönderilecek mesajdan)
export function cleanMessageForCustomer(text) {
  return text.replace(/\[LEAD_DATA\][\s\S]*?\[\/LEAD_DATA\]/, "").trim();
}
