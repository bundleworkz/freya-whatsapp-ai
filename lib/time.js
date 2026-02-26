// Türkiye saatine göre mesai kontrolü
export function isWorkingHours() {
  const now = new Date();

  // UTC'yi Istanbul saatine çevir (UTC+3)
  const istanbulOffset = 3 * 60; // dakika
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istanbulMinutes = (utcMinutes + istanbulOffset) % (24 * 60);
  const istanbulHour = Math.floor(istanbulMinutes / 60);
  const istanbulMinute = istanbulMinutes % 60;

  // 09:00 - 20:00 arası
  const startHour = 9;
  const endHour = 20;

  if (istanbulHour >= startHour && istanbulHour < endHour) {
    return true;
  }
  return false;
}

// Istanbul saatini formatla
export function getIstanbulTime() {
  return new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
}

// Sonraki mesai başlangıcına kalan süre
export function getNextWorkingHourMessage() {
  return "Merhaba! Freya Nişantaşı'na ulaştığınız için teşekkür ederiz. 🌿 Şu an mesai saatlerimiz dışındayız. Çalışma saatlerimiz: Her gün 09:00 - 20:00. Mesajınız bize ulaştı, en kısa sürede dönüş yapacağız!";
}
