import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | Internal System"
        description="Embedded analytics dashboard"
      />

        {/* Embedded Looker Studio */}
        <div className="relative w-full  overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
          <iframe
            src="https://lookerstudio.google.com/embed/reporting/f1837c75-6dd4-4355-9966-ca1785d14302/page/4OrWB"
            className="h-[80vh] w-full"
            frameBorder="0"
            style={{ border: 0 }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
    </>
  );
}
