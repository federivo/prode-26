import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Display serif de alto contraste — sensación de trofeo grabado.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

// Cuerpo cálido y con carácter, excelente para español.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Prode Mundial 2026",
    template: "%s · Prode Mundial 2026",
  },
  description:
    "Jugá al prode del Mundial 2026 con tus amigos. Cargá tus pronósticos y competí por la corona.",
  applicationName: "Prode Mundial 2026",
  appleWebApp: {
    capable: true,
    title: "Prode 26",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2e7" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1813" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${fraunces.variable} ${hanken.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica el tema guardado antes de pintar (evita el flash). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
