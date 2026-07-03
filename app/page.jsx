import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustedBrands from "@/components/TrustedBrands";
import DiscoverSection from "@/components/DiscoverSection";
import FeaturedCollections from "@/components/FeaturedCollections";
import AIFeatures from "@/components/AIFeatures";
import CreatorCollaboration from "@/components/CreatorCollaboration";
import HowItWorks from "@/components/HowItWorks";
import Statistics from "@/components/Statistics";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <main className="min-h-screen bg-cream selection:bg-brand-primary selection:text-white">
      <Navbar />
      <Hero />
      <TrustedBrands />
      <DiscoverSection />
      <FeaturedCollections />
      <AIFeatures />
      <CreatorCollaboration />
      <HowItWorks />
      <Statistics />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
