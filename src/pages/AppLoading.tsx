export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm dark:bg-gray-800">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400" />
        </div>

        {/* Text */}
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Loading , please wait...
        </p>

        {/* Skeleton */}
        <div className="mt-6 space-y-4">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}
