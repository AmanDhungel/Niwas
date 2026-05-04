import Hero from "./Hero";
import Categories from "./Categories";
import FeaturedProperties from "./FeaturedProperties";
import PropertyCollections from "./PropertyCollections";
import WhyChooseUs from "./WhyChooseUs";
import PopularAreas from "./PopularAreas";
import BlogSection from "./BlogSection";
import Footer from "./Footer";
// import Navbar from "@/components/shared/Navbar";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* <Navbar /> */}
      <Hero />
      <div className="container mx-auto px-4 space-y-24 pb-20">
        <Categories />
        <FeaturedProperties />
        <PropertyCollections />
        <WhyChooseUs />
        <PopularAreas />
        <BlogSection />
      </div>
      <Footer />
    </main>
  );
}
