import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from "@/components/ui/toaster" // Import Toaster

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Physics Problem Solver', // Update title
  description: 'Analyze physics problems with AI', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <Script
          id="mathjax-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
                  displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']]
                },
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                }
              };
            `,
          }}
        />
        <Script
          id="mathjax-script"
          strategy="beforeInteractive"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
