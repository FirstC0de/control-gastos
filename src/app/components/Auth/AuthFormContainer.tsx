// app/components/auth/AuthFormContainer.tsx
import Link from 'next/link';

type AuthFormContainerProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
};

export default function AuthFormContainer({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLinkText,
}: AuthFormContainerProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {children}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          {footerText}{' '}
          <Link
            href={footerLink}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}