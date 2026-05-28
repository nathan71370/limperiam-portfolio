import { TopBar } from "@/components/topbar";
import { CustomCursor } from "@/components/custom-cursor";
import { ScrollProgress } from "@/components/scroll-progress";
import { MagneticHandler } from "@/components/magnetic";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Work } from "@/components/sections/work";
import { Stack } from "@/components/sections/stack";
import { Contact } from "@/components/sections/contact";
import { Legal } from "@/components/sections/legal";
import { Footer } from "@/components/sections/footer";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <CustomCursor />
      <MagneticHandler />
      <TopBar />
      <main>
        <Hero />
        <About />
        <Work />
        <Stack />
        <Contact />
        <Legal />
      </main>
      <Footer />
    </>
  );
}
