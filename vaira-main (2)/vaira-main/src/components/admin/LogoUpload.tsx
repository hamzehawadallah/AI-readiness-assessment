import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "lucide-react";

const VCL_LOGO_URL = 'https://ai.vcl.solutions/assets/vcl-logo-BtsGNwH1.svg';

export function LogoUpload() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />Email Logo</CardTitle>
        <CardDescription>
          Logo displayed in email report templates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
          <img src={VCL_LOGO_URL} alt="VCL Logo" className="max-h-16 max-w-full object-contain" />
        </div>
      </CardContent>
    </Card>
  );
}
