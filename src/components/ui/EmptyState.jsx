export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          <Icon size={26} />
        </div>
      )}
      <p className="font-medium text-slate-700 mb-1">{title}</p>
      {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
    </div>
  )
}
