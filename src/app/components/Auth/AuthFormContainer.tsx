// components/Auth/AuthFormContainer.tsx
import Link from 'next/link';

type Props = {
  title: string; subtitle: string; children: React.ReactNode;
  footerText: string; footerLink: string; footerLinkText: string;
};

export default function AuthFormContainer({ title, subtitle, children, footerText, footerLink, footerLinkText }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">CG</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-110">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-8 py-10">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          {footerText}{' '}
          <Link href={footerLink} className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}