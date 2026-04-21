import vclLogo from "@/assets/vcl-logo.svg";

interface VCLLogoProps {
  className?: string;
}

export function VCLLogo({ className = "h-10 w-auto" }: VCLLogoProps) {
  return (
    <img
      src={vclLogo}
      alt="VCL - Virtual Consulting Lab"
      className={className}
    />
  );
}
