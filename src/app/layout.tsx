import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmModalProvider } from '@/components/common/ConfirmModalProvider';
import { GlobalNotificationProvider } from '@/context/GlobalNotificationContext';
import { I18nProvider } from '@/components/providers/I18nProvider';

import Providers from '@/providers/Providers';
import Script from 'next/script';

const outfit = Outfit({
  subsets: ["latin"],
});

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
        <Providers>
          <I18nProvider>
            <ThemeProvider>
              <ToastProvider>
                <SidebarProvider>
                  <ConfirmModalProvider>
                    <GlobalNotificationProvider>
                      {children}
                    </GlobalNotificationProvider>
                  </ConfirmModalProvider>
                </SidebarProvider>
              </ToastProvider>
            </ThemeProvider>
          </I18nProvider>
        </Providers>
        <Script
          src="/scripts/cleanup-localStorage.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

export default RootLayout;
