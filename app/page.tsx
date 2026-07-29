import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import CategoryGrid from "@/components/CategoryGrid";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen">
        <Hero />
        <StatsBar />
        <CategoryGrid />
        <ProductGrid />
      </main>
      <Footer />
    </>
  );
}
