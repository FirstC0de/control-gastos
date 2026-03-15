export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">CG</span>
            </div>
            <span className="text-sm font-medium text-slate-700">ControlGastos</span>
          </div>
          <div className="flex items-center gap-6">
            {['Dashboard', 'Finanzas', 'Estadísticas'].map(item => (
              <span key={item} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">© 2025 ControlGastos. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}