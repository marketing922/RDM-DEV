export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FEF9E9] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#DCD8C7] border-t-[#A2211E] rounded-full animate-spin" />
        <p className="text-sm text-[#712E2F]/50">Chargement...</p>
      </div>
    </div>
  )
}
