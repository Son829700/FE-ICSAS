import { useEffect, useRef, useState } from "react";
import AppLoading from "../OtherPage/AppLoading";

interface Props {
  url: string;
  category: string;
}

export default function DashboardViewer({ url, category }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category !== "ANALYTICS") return;

    const loadHtml = async () => {
      try {
        setLoading(true);

        const res = await fetch(url);
        const html = await res.text();

        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(html);
        doc.close();

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadHtml();
  }, [url, category]);

  return (
    <div className="relative w-full h-[100vh]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <AppLoading />
        </div>
      )}

      {category === "ANALYTICS" ? (
        <iframe
          key={url}
          ref={iframeRef}
          className="w-full h-full border-none"
          title="Analytics Dashboard"
          allowFullScreen
        />
      ) : (
        <iframe
          key={url}
          src={url}
          className="w-full h-full border-none"
          title="Dashboard"
          allowFullScreen
          onLoad={() => setLoading(false)}
        />
      )}
    </div>
  );
}