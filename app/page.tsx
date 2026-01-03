import AboutFeature from "@/components/common/about-feature";
import HeroSection from "@/components/common/hero-section";
import Services from "@/components/common/services";
import Usage from "@/components/common/usage";
import DomeGallery from "@/components/DomeGallery";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <Services />
      <Usage />
      <AboutFeature />
      <div className="w-full h-screen mb-12 pb-12">
        <h3 className="md:text-2xl text-xl text-center md:text-start text-foreground font-semibold p-4 md:p-8">
          ورزشکاران هفته
        </h3>
        <DomeGallery grayscale={false} />
      </div>

      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut magni
        fugiat blanditiis placeat iure atque, accusantium animi cumque ducimus
        reprehenderit facilis voluptatum consequatur corporis est beatae aperiam
        cum. Minus, omnis?
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut magni
        fugiat blanditiis placeat iure atque, accusantium animi cumque ducimus
        reprehenderit facilis voluptatum consequatur corporis est beatae aperiam
        cum. Minus, omnis?
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut magni
        fugiat blanditiis placeat iure atque, accusantium animi cumque ducimus
        reprehenderit facilis voluptatum consequatur corporis est beatae aperiam
        cum. Minus, omnis?
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut magni
        fugiat blanditiis placeat iure atque, accusantium animi cumque ducimus
        reprehenderit facilis voluptatum consequatur corporis est beatae aperiam
        cum. Minus, omnis?
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut magni
        fugiat blanditiis placeat iure atque, accusantium animi cumque ducimus
        reprehenderit facilis voluptatum consequatur corporis est beatae aperiam
        cum. Minus, omnis?
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut magni
        fugiat blanditiis placeat iure atque, accusantium animi cumque ducimus
        reprehenderit facilis voluptatum consequatur corporis est beatae aperiam
        cum. Minus, omnis?
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut magni
        fugiat blanditiis placeat iure atque, accusantium animi cumque ducimus
        reprehenderit facilis voluptatum consequatur corporis est beatae aperiam
        cum. Minus, omnis?
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aut magni
        fugiat blanditiis placeat iure atque, accusantium animi cumque ducimus
        reprehenderit facilis voluptatum consequatur corporis est beatae aperiam
        cum. Minus, omnis?
      </p>
    </div>
  );
}
