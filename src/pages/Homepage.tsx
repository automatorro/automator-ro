import { PublicLayout } from '@/components/layouts/PublicLayout';
import { Hero } from '@/components/homepage/Hero';
import { PedagogicalFoundation } from '@/components/homepage/PedagogicalFoundation';
import { HowItWorks } from '@/components/homepage/HowItWorks';
import { WhatYouGet } from '@/components/homepage/WhatYouGet';
import { Features } from '@/components/homepage/Features';
import { Pricing } from '@/components/homepage/Pricing';
import { Footer } from '@/components/homepage/Footer';

const Homepage = () => {
  return (
    <PublicLayout>
      <Hero />
      <PedagogicalFoundation />
      <HowItWorks />
      <WhatYouGet />
      <Features />
      <Pricing />
      <Footer />
    </PublicLayout>
  );
};

export default Homepage;
