import type { Metadata } from "next";
import "./globals.css";

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
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <a href="/" className="text-2xl font-bold text-primary-600">
                  BungeeHub
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/login" className="text-gray-700 hover:text-primary-600">
                  Login
                </a>
                <a
                  href="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
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
