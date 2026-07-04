import LandingNavbar from '@/components/shared/LandingNavbar';
import LandingFooter from '@/components/shared/LandingFooter';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesStrip from '@/components/landing/FeaturesStrip';
import ModulesSection from '@/components/landing/ModulesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import MockTestSection from '@/components/landing/MockTestSection';
import WhySection from '@/components/landing/WhySection';
import CTASection from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <FeaturesStrip />
      <ModulesSection />
      <HowItWorksSection />
      <MockTestSection />
      <WhySection />
      <CTASection />
      <LandingFooter />
    </>
  );
}
