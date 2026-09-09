export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
