import "./globals.css";

export const metadata = {
  title: "Freya Nişantaşı - AI Yönetim Paneli",
  description: "WhatsApp AI Müşteri Asistanı Yönetim Paneli",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
