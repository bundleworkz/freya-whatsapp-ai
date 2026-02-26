export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import twilio from "twilio";
import { getServiceClient } from "@/lib/supabase";
import { getAIResponse, extractLeadData, cleanMessageForCustomer } from "@/lib/ai";
import { isWorkingHours, getNextWorkingHourMessage, getIstanbulTime } from "@/lib/time";
import { sendWhatsAppNotification, sendEmailNotification } from "@/lib/notify";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const from = formData.get("From");
    const body = formData.get("Body");
    const profileName = formData.get("ProfileName");

    if (!from || !body) {
      return new NextResponse("Missing params", { status: 400 });
    }

    console.log(`Mesaj geldi: ${from} -> ${body}`);

    const db = getServiceClient();
    if (!db) {
      return createTwiMLResponse("Sistem bakimda. Lutfen 0212 965 00 35 numarasindan arayin.");
    }

    const phone = from.replace("whatsapp:", "");

    // 1. Mevcut musteri mi kontrol et
    const { data: knownNumber } = await db
      .from("known_numbers")
      .select("*")
      .eq("phone", phone)
      .single();

    if (knownNumber) {
      console.log(`Mevcut musteri: ${knownNumber.name || phone}`);
      const knownMsg = "Merhaba! Mesajiniz icin tesekkur ederiz. Ekibimiz en kisa surede size donus yapacaktir.";
      return createTwiMLResponse(knownMsg);
    }

    // 2. Mesai saati kontrolu
    if (!isWorkingHours()) {
      console.log(`Mesai disi mesaj: ${phone}`);

      // Mesaji kaydet
      const { data: queuedConv } = await db
        .from("conversations")
        .select("id")
        .eq("phone", phone)
        .eq("status", "queued")
        .single();

      if (!queuedConv) {
        const { data: newConv } = await db
          .from("conversations")
          .insert({ phone, status: "queued" })
          .select()
          .single();

        if (newConv) {
          await db.from("messages").insert({
            conversation_id: newConv.id,
            role: "user",
            content: body,
          });
        }
      } else {
        await db.from("messages").insert({
          conversation_id: queuedConv.id,
          role: "user",
          content: body,
        });
      }

      const outsideMsg = getNextWorkingHourMessage();
      return createTwiMLResponse(outsideMsg);
    }

    // 3. Aktif konusma var mi kontrol et
    let { data: conversation } = await db
      .from("conversations")
      .select("*")
      .eq("phone", phone)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      const { data: newConv } = await db
        .from("conversations")
        .insert({ phone, status: "active" })
        .select()
        .single();
      conversation = newConv;
    }

    // 4. Kullanici mesajini kaydet
    await db.from("messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: body,
    });

    // 5. Konusma gecmisini al
    const { data: history } = await db
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    // 6. Claude'dan yanit al
    const aiResponse = await getAIResponse(history || [{ role: "user", content: body }]);

    // 7. Lead verisi var mi kontrol et
    const leadData = extractLeadData(aiResponse);
    const customerMessage = cleanMessageForCustomer(aiResponse);

    // 8. AI yanitini kaydet
    await db.from("messages").insert({
      conversation_id: conversation.id,
      role: "assistant",
      content: customerMessage,
    });

    // 9. Lead verisi varsa kaydet ve bildirim gonder
    if (leadData && leadData.name) {
      console.log(`Lead yakalandi: ${leadData.name}`);

      const { data: lead } = await db
        .from("leads")
        .upsert(
          {
            phone,
            name: leadData.name,
            complaint: leadData.complaint,
            recommended_service: leadData.recommended_service,
            price_given: leadData.price_given,
            status: "new",
          },
          { onConflict: "phone" }
        )
        .select()
        .single();

      await db
        .from("conversations")
        .update({
          lead_id: lead?.id,
          status: "completed",
          summary: `${leadData.name} - ${leadData.complaint} - ${leadData.recommended_service}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);

      const notificationData = {
        name: leadData.name,
        phone: leadData.phone || phone,
        complaint: leadData.complaint,
        recommended_service: leadData.recommended_service,
        price_given: leadData.price_given,
      };

      sendWhatsAppNotification(notificationData).catch(console.error);
      sendEmailNotification(notificationData).catch(console.error);
    }

    return createTwiMLResponse(customerMessage);
  } catch (error) {
    console.error("Webhook error:", error);
    return createTwiMLResponse(
      "Su an teknik bir sorun yasiyoruz. Lutfen bizi 0212 965 00 35 numarasindan arayin."
    );
  }
}

function createTwiMLResponse(message) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Freya WhatsApp AI",
    time: getIstanbulTime(),
    working: isWorkingHours(),
  });
}
