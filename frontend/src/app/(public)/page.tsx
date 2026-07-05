import CTASection from '@/components/landing/CTASection';
import FeaturesStrip from '@/components/landing/FeaturesStrip';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import MockTestSection from '@/components/landing/MockTestSection';
import ModulesSection from '@/components/landing/ModulesSection';
import WhySection from '@/components/landing/WhySection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesStrip />
      <ModulesSection />
      <HowItWorksSection />
      <MockTestSection />
      <WhySection />
      <CTASection />
    </>
  );
}
