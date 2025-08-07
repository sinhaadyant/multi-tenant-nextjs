import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmModalProvider } from '@/components/common/ConfirmModalProvider';
import Providers from '@/providers/Providers';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <Providers>
          <ThemeProvider>
            <ToastProvider>
              <SidebarProvider>
                <ConfirmModalProvider>
                  {children}
                </ConfirmModalProvider>
              </SidebarProvider>
            </ToastProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
