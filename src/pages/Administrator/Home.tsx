import PageMeta from "../../components/common/PageMeta";

export default function AdminHome() {
  return (
    <>
      <PageMeta
        title="Administrator | Home"
        description="Embedded analytics dashboard"
      />

      {/* Embedded Looker Studio */}
      <div className="relative w-full  overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <iframe
          src="https://lookerstudio.google.com/embed/reporting/6b470c33-3d42-4ef6-9bef-af3e3872628b/page/OW6mF"
          className="h-[100vh] w-full"
          frameBorder="0"
          style={{ border: 0 }}
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </>
  );
}
