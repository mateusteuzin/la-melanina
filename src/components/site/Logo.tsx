import logo from "@/assets/logo.png";

export function Logo({ className = "", height = 56 }: { className?: string; height?: number }) {
  return (
    <img src={logo} alt="LA MELANINA — Espaço de Bronzeamento" style={{ height }} className={`w-auto object-contain ${className}`} />
  );
}
