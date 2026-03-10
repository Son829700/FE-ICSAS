import { useEffect, useRef } from "react";

interface Props {
  url: string;
  category: string;
}

export default function DashboardViewer({ url, category }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (category !== "ANALYTICS") return;

    const loadHtml = async () => {
      const res = await fetch(url);
      const html = await res.text();

      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      doc.open();
      doc.write(html);
      doc.close();
    };

    loadHtml();
  }, [url, category]);

  // 🔹 Analytics dashboard (HTML từ Supabase)
  if (category === "ANALYTICS") {
    return (
      <iframe
        ref={iframeRef}
        style={{ width: "100%", height: "100vh", border: "none" }}
        title="Analytics Dashboard"
        allowFullScreen
      />
    );
  }

  // 🔹 Dashboard dạng URL bình thường
  return (
    <iframe
      src={url}
      style={{ width: "100%", height: "100vh", border: "none" }}
      title="Dashboard"
      allowFullScreen
    />
  );
}