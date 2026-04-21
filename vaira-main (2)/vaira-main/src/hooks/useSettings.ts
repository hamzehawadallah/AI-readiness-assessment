import { useState, useEffect } from "react";
import { settingsApi } from "@/lib/apiClient";

export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

// Shape returned by the admin GET
type AdminSettings = Record<string, string>;

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getAdmin();
      if (res.success && res.settings) {
        // Convert flat object to Setting[] for API compatibility
        const mapped: Setting[] = Object.entries(res.settings).map(([key, value]) => ({
          id: key,
          key,
          value: value ?? '',
          description: null,
        }));
        setSettings(mapped);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const getSetting = (key: string, fallback = ''): string => {
    const s = settings.find(s => s.key === key);
    return s?.value || fallback;
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await settingsApi.update({ [key]: value });
      await fetchSettings();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  return { settings, loading, getSetting, updateSetting, refetch: fetchSettings };
}

// Standalone — used in AssessmentFlow and ReportDelivery
export async function getWebhookUrls() {
  try {
    const data = await settingsApi.getPublic();
    return {
      webhookUrl:          data.webhook_url          || '/api/analyze.php',
      deliveryWebhookUrl:  data.delivery_webhook_url || '/api/send-email.php',
      whatsappEnabled:     data.whatsapp_enabled !== 'false',
    };
  } catch {
    return {
      webhookUrl:         '/api/analyze.php',
      deliveryWebhookUrl: '/api/send-email.php',
      whatsappEnabled:    true,
    };
  }
}
