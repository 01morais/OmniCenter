import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { RegistrarSW } from "@/components/RegistrarSW";

const titulo = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-titulo" });
const corpo = Source_Sans_3({ subsets: ["latin"], variable: "--f-corpo" });

export const metadata: Metadata = { title: "OmniCenter", description: "Atendimento do shopping por QR Code", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#12332E" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable}`}>
      <body>{children}<RegistrarSW /></body>
    </html>
  );
}
