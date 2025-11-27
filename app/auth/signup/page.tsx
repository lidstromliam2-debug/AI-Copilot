export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <form className="card flex flex-col gap-6 p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Skapa konto</h2>
        <input type="email" placeholder="E-post" className="input" />
        <input type="password" placeholder="Lösenord" className="input" />
        <input type="password" placeholder="Upprepa lösenord" className="input" />
        <button type="submit" className="btn-primary">Skapa konto</button>
        <a href="/auth/login" className="text-primary text-center text-sm hover:underline">Redan medlem? Logga in</a>
      </form>
    </div>
  );
}
