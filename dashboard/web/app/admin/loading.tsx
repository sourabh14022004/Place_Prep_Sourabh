export default function AppLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500 font-medium">Loading portal...</span>
      </div>
    </div>
  );
}
