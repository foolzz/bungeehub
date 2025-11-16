import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "BungeeHub - Community Delivery Network",
  description: "Transform your home into a delivery hub. Earn money while helping your community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        <main>{children}</main>
        <footer className="bg-gray-50 border-t mt-12">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              © 2024 BungeeHub. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
