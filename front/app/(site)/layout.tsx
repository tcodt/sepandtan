import Navbar from "@/components/layout/navbar";
import Footer from "@/components/common/footer";
import MobileNavigation from "@/components/common/mobile-navigation";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <MobileNavigation />
      <InstallPrompt variant="banner" />
    </>
  );
}
