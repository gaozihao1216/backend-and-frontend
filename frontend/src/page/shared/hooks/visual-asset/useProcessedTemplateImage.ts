import { useEffect, useState } from "react";
import { processTemplateImage } from "../../function/ui-design/template-image-utils.js";

export const useProcessedTemplateImage = (sourceDataUrl: string | undefined): string => {
  const [processedUrl, setProcessedUrl] = useState(sourceDataUrl ?? "");

  useEffect(() => {
    if (!sourceDataUrl) {
      setProcessedUrl("");
      return;
    }

    let cancelled = false;
    setProcessedUrl(sourceDataUrl);

    void processTemplateImage(sourceDataUrl).then((nextUrl) => {
      if (!cancelled) {
        setProcessedUrl(nextUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sourceDataUrl]);

  return processedUrl;
};
