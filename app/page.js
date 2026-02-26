"use client";

import { useState, useEffect } from "react";

const STATUS_LABELS = {
  new: { label: "Yeni", color: "bg-blue-100 text-blue-800" },
  contacted: { label: "Arandı", color: "bg-yellow-100 text-yellow-800" },
  converted: { label: "Dönüştürüldü", color: "bg-green-100 text-green-800" },
  lost: { label: "Kayıp", color: "bg-red-100 text-red-800" },
};

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, converted: 0 });

  // Lead'leri getir
  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000); // 30 saniyede bir güncelle
    return () => clearInterval(interval);
  }, [filter]);

  async function fetchLeads() {
    try {
      const res = await fetch(`/api/leads?status=${filter}`);
      const data = await res.json();
      setLeads(data);
      setLoading(false);

      // İstatistikler
      const allRes = await fetch("/api/leads?status=all");
      const allData = await allRes.json();
      setStats({
        total: allData.length,
        new: allData.filter((l) => l.status === "new").length,
        contacted: allData.filter((l) => l.status === "contacted").length,
        converted: allData.filter((l) => l.status === "converted").length,
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      setLoading(false);
    }
  }

  // Konuşma geçmişini getir
  async function viewConversation(lead) {
    setSelectedLead(lead);
    try {
      // Lead'e ait konuşmaları bul
      const convRes = await fetch(`/api/conversations?lead_id=${lead.id}`);
      const convs = await convRes.json();

      if (convs.length > 0) {
        const msgRes = await fetch(`/api/conversations?id=${convs[0].id}`);
        const msgs = await msgRes.json();
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setMessages([]);
    }
  }

  // Durum güncelle
  async function updateStatus(id, newStatus) {
    try {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchLeads();
      if (selectedLead?.id === id) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#2E7D6F] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🌿 Freya Nişantaşı</h1>
            <p className="text-green-100 text-sm">WhatsApp AI Yönetim Paneli</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600 text-sm">
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
              AI Aktif
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Toplam Lead" value={stats.total} color="bg-gray-500" />
          <StatCard label="Yeni" value={stats.new} color="bg-blue-500" />
          <StatCard label="Arandı" value={stats.contacted} color="bg-yellow-500" />
          <StatCard label="Dönüştürüldü" value={stats.converted} color="bg-green-500" />
        </div>

        {/* Filtre */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: "all", label: "Tümü" },
            { key: "new", label: "🔵 Yeni" },
            { key: "contacted", label: "🟡 Arandı" },
            { key: "converted", label: "🟢 Dönüştürüldü" },
            { key: "lost", label: "🔴 Kayıp" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-[#2E7D6F] text-white shadow"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Listesi */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-700">
                  Müşteri Adayları ({leads.length})
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Henüz müşteri adayı yok. WhatsApp AI aktif olduğunda burası dolacak!
                </div>
              ) : (
                <div className="divide-y">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedLead?.id === lead.id ? "bg-green-50 border-l-4 border-[#2E7D6F]" : ""
                      }`}
                      onClick={() => viewConversation(lead)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800">
                              {lead.name || "İsimsiz"}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                STATUS_LABELS[lead.status]?.color || ""
                              }`}
                            >
                              {STATUS_LABELS[lead.status]?.label || lead.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">📞 {lead.phone}</p>
                          {lead.complaint && (
                            <p className="text-sm text-gray-600">📌 {lead.complaint}</p>
                          )}
                          {lead.recommended_service && (
                            <p className="text-sm text-[#2E7D6F]">
                              🎯 {lead.recommended_service}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {formatDate(lead.created_at)}
                        </span>
                      </div>

                      {/* Durum butonları */}
                      <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                        {lead.status === "new" && (
                          <button
                            onClick={() => updateStatus(lead.id, "contacted")}
                            className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200"
                          >
                            ✓ Arandı
                          </button>
                        )}
                        {(lead.status === "new" || lead.status === "contacted") && (
                          <>
                            <button
                              onClick={() => updateStatus(lead.id, "converted")}
                              className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                            >
                              ✓ Dönüştürüldü
                            </button>
                            <button
                              onClick={() => updateStatus(lead.id, "lost")}
                              className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                            >
                              ✗ Kayıp
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Konuşma Detayı */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border sticky top-6">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-700">
                  {selectedLead ? `💬 ${selectedLead.name || "İsimsiz"}` : "💬 Konuşma Detayı"}
                </h2>
              </div>

              {!selectedLead ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Bir müşteriye tıklayarak konuşmayı görüntüleyin
                </div>
              ) : (
                <div className="p-4">
                  {/* Lead özet bilgileri */}
                  <div className="bg-green-50 rounded-lg p-3 mb-4 text-sm">
                    <p><strong>📞</strong> {selectedLead.phone}</p>
                    {selectedLead.complaint && <p><strong>📌</strong> {selectedLead.complaint}</p>}
                    {selectedLead.recommended_service && (
                      <p><strong>🎯</strong> {selectedLead.recommended_service}</p>
                    )}
                    {selectedLead.price_given && (
                      <p><strong>💰</strong> {selectedLead.price_given}</p>
                    )}
                  </div>

                  {/* Mesajlar */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-4">
                        Konuşma kaydı bulunamadı
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                              msg.role === "user"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-[#2E7D6F] text-white"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                msg.role === "user" ? "text-gray-400" : "text-green-200"
                              }`}
                            >
                              {formatDate(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
