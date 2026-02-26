import twilio from "twilio";
import nodemailer from "nodemailer";

// WhatsApp bildirimi gönder (işletme sahibine)
export async function sendWhatsAppNotification(leadSummary) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.OWNER_WHATSAPP,
      body: formatLeadSummary(leadSummary),
    });

    console.log("WhatsApp notification sent:", message.sid);
    return true;
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return false;
  }
}

// E-posta bildirimi gönder
export async function sendEmailNotification(leadSummary) {
  try {
    // SMTP ayarları yoksa atla
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log("SMTP not configured, skipping email notification");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.OWNER_EMAIL,
      subject: `🌿 Yeni Müşteri: ${leadSummary.name || "İsimsiz"} - Freya AI`,
      html: formatLeadEmail(leadSummary),
    });

    console.log("Email notification sent");
    return true;
  } catch (error) {
    console.error("Email notification error:", error);
    return false;
  }
}

// WhatsApp özet formatı
function formatLeadSummary(lead) {
  return `📋 *Yeni Müşteri Özeti*
━━━━━━━━━━━━━━━
👤 *Ad Soyad:* ${lead.name || "Belirtilmedi"}
📞 *Telefon:* ${lead.phone || "Belirtilmedi"}
📌 *Şikayet:* ${lead.complaint || "Belirtilmedi"}
🎯 *Önerilen Hizmet:* ${lead.recommended_service || "Belirtilmedi"}
💰 *Fiyat Bilgisi:* ${lead.price_given || "Verilmedi"}
⏰ *Tarih:* ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
━━━━━━━━━━━━━━━
Lütfen müşteriyi en kısa sürede arayınız.`;
}

// E-posta HTML formatı
function formatLeadEmail(lead) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2E7D6F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🌿 Freya Nişantaşı</h2>
        <p style="margin: 5px 0 0;">Yeni Müşteri Bildirimi</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border: 1px solid #ddd;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">👤 Ad Soyad</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${lead.name || "Belirtilmedi"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">📞 Telefon</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${lead.phone || "Belirtilmedi"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">📌 Şikayet</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${lead.complaint || "Belirtilmedi"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">🎯 Önerilen Hizmet</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${lead.recommended_service || "Belirtilmedi"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">💰 Fiyat</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${lead.price_given || "Verilmedi"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">⏰ Tarih</td>
            <td style="padding: 10px;">${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</td>
          </tr>
        </table>
      </div>
      <div style="background: #2E7D6F; color: white; padding: 12px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px;">
        Lütfen müşteriyi en kısa sürede arayınız.
      </div>
    </div>
  `;
}
