import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["vietnamese", "latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://binh-gom-thanh-ha-web.vercel.app"),
  title: "SẮC GỐM CỔ THỊ",
  description: "Workshop đập bình gốm nhận quà",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png"
  },
  openGraph: {
    title: "SẮC GỐM CỔ THỊ",
    description: "Workshop đập bình gốm nhận quà",
    images: ["/images/site-logo.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" className={`${lora.variable} ${plusJakartaSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
