import Image from "next/image";
// Static import gives the image a content-hashed URL, so swapping the logo file busts every cache.
import logo from "@/assets/biosphere-logo.png";

/** BioSphere logo (Philippine eagle roundel on a white disc). Decorative — pair it with visible brand text. */
export function LogoMark({ className = "" }: { className?: string }) {
  return <Image src={logo} alt="" aria-hidden className={`object-contain ${className}`} />;
}
