import Link from 'next/link';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
};

export default function AuthFormContainer({
  title, subtitle, children, footerText, footerLink, footerLinkText
}: Props) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-blue-500 transition-colors">
              <span className="text-white font-bold text-lg">$</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Controlados <span className="text-blue-400">$</span>
            </span>
          </Link>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-2 text-center text-sm text-slate-400">{subtitle}</p>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl px-8 py-10">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          {footerText}{' '}
          <Link href={footerLink} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
