import {
  AnnouncementBar,
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/site-shell";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-50">
      <AnnouncementBar />
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
