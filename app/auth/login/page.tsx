export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <form className="card flex flex-col gap-6 p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Logga in</h2>
        <input type="email" placeholder="E-post" className="input" />
        <input type="password" placeholder="Lösenord" className="input" />
        <button type="submit" className="btn-primary">Logga in</button>
        <a href="/auth/signup" className="text-primary text-center text-sm hover:underline">Skapa konto</a>
      </form>
    </div>
  );
}
