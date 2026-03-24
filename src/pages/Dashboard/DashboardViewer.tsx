import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import AppLoading from "../OtherPage/AppLoading";

interface Props {
  url: string;
  category: string;
}

export default function DashboardViewer({ url, category }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  /* Fullscreen toggle */
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-white dark:bg-black"
      style={{ height: isFullscreen ? "100vh" : "calc(100vh - 80px)" }}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-black z-50">
          <AppLoading />
        </div>
      )}

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-40 flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md backdrop-blur-sm hover:bg-white transition dark:bg-gray-900/90 dark:text-gray-300 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-700"
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="size-3.5" />
            Exit Fullscreen
          </>
        ) : (
          <>
            <Maximize2 className="size-3.5" />
            Fullscreen
          </>
        )}
      </button>

      {/* Iframe */}
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
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          onLoad={() => setLoading(false)}
          style={{
            overflow: "auto",
          }}
        />
      )}
    </div>
  );
}