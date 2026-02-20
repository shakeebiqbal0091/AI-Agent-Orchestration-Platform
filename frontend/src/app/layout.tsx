 
"use client"
// import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

// export const metadata: Metadata = {
//   title: "Nexus Agentic OS",
//   description: "A high-fidelity, professional AI Agent interface featuring a glassmorphic dark UI.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('af_user');
    if (!stored) { router.push('/login'); return; }
    // setUser(JSON.parse(stored));
  }, [router]);
  return (
    <>
 
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}
        suppressHydrationWarning
      >
         
        {children}
      </body>
    </html>
    </>
  );
}