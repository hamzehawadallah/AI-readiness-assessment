import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadApi } from "@/lib/apiClient";
import { toast } from "sonner";
import { Loader2, Upload, Image, Trash2, CheckCircle } from "lucide-react";

export function LogoUpload() {
  const [uploading, setUploading] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkExistingLogo(); }, []);

  const checkExistingLogo = async () => {
    setLoading(true);
    try {
      const { exists, url } = await uploadApi.checkLogo();
      setCurrentLogoUrl(exists && url ? url + `?t=${Date.now()}` : null);
    } catch (err) {
      console.error('Error checking logo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (PNG, JPG, SVG, etc.)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadApi.uploadLogo(file);
      setCurrentLogoUrl(url + `?t=${Date.now()}`);
      toast.success("Logo uploaded successfully! It will be used in email reports.");
    } catch (err) {
      console.error('Upload error:', err);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setUploading(true);
    try {
      await uploadApi.deleteLogo();
      setCurrentLogoUrl(null);
      toast.success("Logo removed. Default logo will be used for emails.");
    } catch (err) {
      toast.error("Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />Email Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />Email Logo</CardTitle>
        <CardDescription>
          Upload a logo to be displayed in email report templates. Recommended size: 200x50 pixels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLogoUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />Custom logo is active
            </div>
            <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
              <img src={currentLogoUrl} alt="Current logo" className="max-h-16 max-w-full object-contain" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Replace Logo
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">No custom logo uploaded. Default VCL logo will be used.</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload Logo
              </Button>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <p className="text-xs text-muted-foreground">Supported formats: PNG, JPG, SVG. Max file size: 2MB.</p>
      </CardContent>
    </Card>
  );
}
