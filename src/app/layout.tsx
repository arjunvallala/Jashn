import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jashn - GenAI Celebration & Event Planner',
  description: 'Production-quality GenAI celebration & event planner for weddings, birthdays, and community events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        {children}
      </body>
    </html>
  );
}
