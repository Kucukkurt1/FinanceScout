"use client";

import { SimpleArticle } from "@/components/site/simple-article";
import { Mail, MessageSquare, Clock, Globe, ShieldCheck, Zap, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function BizeUlasinPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus({ type: "error", message: "Lütfen tüm alanları doldurunuz." });
      return;
    }
    // Görüntü amaçlı başarı mesajı
    setStatus({ type: "success", message: "Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız." });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="relative pb-32">
      {/* Arka Plan Dekorasyonu */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-sky-500/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[300px] w-[300px] rounded-full bg-violet-500/5 blur-[100px]" />
      </div>

      <SimpleArticle
        title="Bize Ulaşın"
        description="FinanceScout deneyiminizi iyileştirmek, teknik sorunları çözmek veya iş birliği fikirlerinizi duymak için buradayız."
        wide
      >
        {/* İletişim Kartları */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-sky-500/30 hover:bg-white/[0.06]">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <Mail className="size-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">E-posta</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Resmi talepler ve genel sorularınız için bize yazın.
            </p>
            <a 
              href="mailto:help.financescout@gmail.com" 
              className="mt-4 block text-sm font-medium text-sky-400 hover:underline"
            >
              help.financescout@gmail.com
            </a>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-violet-500/30 hover:bg-white/[0.06]">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="size-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Topluluk</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Geliştirme sürecine katılın veya hata bildiriminde bulunun.
            </p>
            <Link 
              href="/hakkimizda" 
              className="mt-4 block text-sm font-medium text-violet-400 hover:underline"
            >
              Ekibimize Göz Atın →
            </Link>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-amber-500/30 hover:bg-white/[0.06]">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="size-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Yanıt Süresi</h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">
              Tüm mesajlara en kısa sürede dönüş yapmaya çalışıyoruz.
            </p>
            <span className="mt-4 block text-sm font-medium text-amber-400/80">
              Ortalama 24-48 Saat
            </span>
          </div>
        </div>

        {/* Bilgi Bölümü */}
        <div className="mt-24 space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Zap className="size-5 text-sky-400" />
              <h2 className="!mt-0 text-2xl font-bold tracking-tight text-white">Nasıl Yardımcı Olabiliriz?</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-white/90">Teknik Sorunlar</h4>
                <p className="text-[15px] leading-relaxed text-white/65">
                  Analizlerin yüklenmemesi, grafik hataları veya API bağlantı sorunları yaşıyorsanız lütfen tarayıcı bilgilerinizi de ekleyerek bize ulaşın.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white/90">Model ve Tahmin Soruları</h4>
                <p className="text-[15px] leading-relaxed text-white/65">
                  Prophet ve LSTM modellerimizin çalışma prensipleri veya veri setlerimiz hakkında daha detaylı bilgi almak isterseniz sormaktan çekinmeyin.
                </p>
              </div>
            </div>
          </section>

          {/* İletişim Formu */}
          <section className="mt-24">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-12">
              <div className="max-w-xl">
                <h2 className="!mt-0 text-2xl font-bold text-white">Bize Ulaşın</h2>
                <p className="mt-4 text-white/60 leading-relaxed">
                  Bir sorunuz veya öneriniz mi var? Formu doldurarak ekibimize doğrudan mesaj gönderebilirsiniz. 
                </p>
                
                <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/80">Adınız Soyadınız</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ahmet Yılmaz" 
                        className="h-12 bg-[#cbd5e1]/90 border-white/10 text-slate-900 placeholder:text-slate-500 focus:ring-sky-500/30 rounded-xl border-none shadow-inner transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">E-posta Adresiniz</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ahmet@example.com" 
                        className="h-12 bg-[#cbd5e1]/90 border-white/10 text-slate-900 placeholder:text-slate-500 focus:ring-sky-500/30 rounded-xl border-none shadow-inner transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white/80">Konu</Label>
                    <Input 
                      id="subject" 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Hangi konuda yazıyorsunuz?" 
                      className="h-12 bg-[#cbd5e1]/90 border-white/10 text-slate-900 placeholder:text-slate-500 focus:ring-sky-500/30 rounded-xl border-none shadow-inner transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white/80">Mesajınız</Label>
                    <textarea 
                      id="message" 
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Detaylı mesajınızı buraya bırakın..."
                      className="w-full rounded-xl bg-[#cbd5e1]/90 p-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 shadow-inner transition-all text-sm font-medium resize-none"
                    />
                  </div>
                  
                  {status && (
                    <div className={cn(
                      "flex items-center gap-2 p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1",
                      status.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    )}>
                      {status.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                      {status.message}
                    </div>
                  )}

                  <Button type="submit" className="w-full md:w-auto px-10 h-12 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all active:scale-95">
                    Mesajı Gönder
                  </Button>
                </form>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent p-8 md:p-12">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
              <div className="mb-6">
                <svg width="0" height="0" className="absolute">
                  <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" /> {/* cyan-400 */}
                    <stop offset="100%" stopColor="#ffffff" /> {/* white */}
                  </linearGradient>
                </svg>
                <ShieldCheck 
                  className="size-12 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" 
                  style={{ stroke: "url(#shield-gradient)" }} 
                />
              </div>
              <h2 className="!mt-0 text-2xl font-bold text-white">Güvenli ve Şeffaf İletişim</h2>
              <p className="mt-4 text-white/60 leading-relaxed">
                İletişime geçtiğinizde paylaştığınız bilgiler, yalnızca talebinize yanıt vermek amacıyla kullanılır. 
                FinanceScout olarak kişisel verilerinizin korunmasına ve gizliliğinize en yüksek önemi veriyoruz.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link 
                  href="/yasal" 
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/40 hover:text-sky-400 transition-colors"
                >
                  <Globe className="size-4" />
                  Yasal Bilgiler
                </Link>
                <Link 
                  href="/yasal#gizlilik" 
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/40 hover:text-sky-400 transition-colors"
                >
                  <ShieldCheck className="size-4" />
                  Gizlilik Politikası
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-24 text-center">
          <p className="text-sm uppercase tracking-[0.2em] font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
            FinanceScout Support
          </p>
          <p className="mt-2 text-white/50 italic">Verinin gücüyle, şeffaf bir gelecek için.</p>
        </div>
      </SimpleArticle>
    </div>
  );
}
