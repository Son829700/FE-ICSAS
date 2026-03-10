import { useEffect, useRef } from "react";

export default function DashboardTest() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dashboardUrl =
    "https://nfijbjnazggdnogufwmi.supabase.co/storage/v1/object/sign/dashboard/olist_2016_centralize.html?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81YzAyNWRjZC0xZmU4LTRjODYtOWRkYy1hNTM3ODhjMmI5MTkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkYXNoYm9hcmQvb2xpc3RfMjAxNl9jZW50cmFsaXplLmh0bWwiLCJpYXQiOjE3NzI3NzAwOTAsImV4cCI6MTgwNDMwNjA5MH0.NgLui8SgTUPgHEANyj7c8SujskfgFNvfBUmG0AXIgvc";

  useEffect(() => {
    fetch(dashboardUrl)
      .then((res) => res.text())
      .then((html) => {
        const iframe = iframeRef.current;

        if (!iframe) return;

        const doc = iframe.contentDocument || iframe.contentWindow?.document;

        if (!doc) return;

        doc.open();
        doc.write(html);
        doc.close();
      });
  }, []);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
      }}
      title="Dashboard"
    />
  );
}