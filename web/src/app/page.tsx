import { Nav } from "@/components/nav";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Work } from "@/components/sections/work";
import { Stack } from "@/components/sections/stack";
import { Contact } from "@/components/sections/contact";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <Stack />
        <Contact />
      </main>
    </>
  );
}
