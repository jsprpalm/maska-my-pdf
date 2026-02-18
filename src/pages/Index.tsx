import { useState } from "react";
import { ShieldCheck, FileDown, Eye, Zap } from "lucide-react";
import DropZone from "@/components/DropZone";
import PdfEditor from "@/components/PdfEditor";
import heroImage from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: ShieldCheck,
    title: "100% privat",
    description: "Din PDF lämnar aldrig din enhet. Allt bearbetas lokalt i webbläsaren.",
  },
  {
    icon: Eye,
    title: "Rita fritt",
    description: "Dra ut svarta block exakt där du vill maskera känslig information.",
  },
  {
    icon: FileDown,
    title: "Ladda ner direkt",
    description: "Hämta din maskerade PDF med ett klick — klar att delas säkert.",
  },
  {
    icon: Zap,
    title: "Ingen inloggning",
    description: "Inget konto, inga cookies, inga servrar. Öppna och kör.",
  },
];

export default function Index() {
  const [file, setFile] = useState<File | null>(null);

  if (file) {
    return <PdfEditor file={file} onReset={() => setFile(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="block w-3.5 h-1.5 bg-primary-foreground rounded-sm" />
          </div>
          <span className="font-bold text-lg tracking-tight">Maska</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-stamp inline-block" />
          Klientbaserat · Open source
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Hero image right side */}
        <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block pointer-events-none">
          <img
            src={heroImage}
            alt="PDF maskering illustration"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl px-6 py-20 mx-auto lg:mx-0 lg:pl-16 lg:pr-8 lg:max-w-3xl animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-stamp" />
            Gratis · Ingen registrering · Helt offline
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
            Maskera din
            <br />
            PDF{" "}
            <span
              className="relative inline-block px-2"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "6px" }}
            >
              direkt
            </span>
            <br />
            i webbläsaren.
          </h1>

          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
            Rita ut svarta block över känslig information i dina PDF-filer. 
            Snabbt, säkert och helt utan server — din data stannar på din dator.
          </p>

          {/* Drop zone */}
          <div className="mt-10">
            <DropZone onFileSelected={setFile} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-10">
            Hur det fungerar
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="flex gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <span className="font-bold text-foreground">Maska</span>
        {" "}— Maskera PDF:er utan att ladda upp dem. Byggt med pdf.js och pdf-lib.
      </footer>
    </div>
  );
}
