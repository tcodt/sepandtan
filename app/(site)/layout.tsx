import Navbar from "@/components/layout/navbar";
import Footer from "@/components/common/footer";
import MobileNavigation from "@/components/common/mobile-navigation";

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
    </>
  );
}
