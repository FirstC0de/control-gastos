import RegisterForm from "../../components/Auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-center">Crear Cuenta</h2>
        <RegisterForm />
        
        <div className="mt-6">
          <p className="text-center">
            ¿Ya tienes cuenta?{' '}
            <a href="/auth/login" className="text-blue-600 hover:underline">
              Inicia Sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}