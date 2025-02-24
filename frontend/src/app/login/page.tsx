"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegistering ? "/register" : "/login";
    const payload = isRegistering ? { name, email, password } : { email, password };

    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    alert(isRegistering ? "Registration successful!" : "Login successful!");
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h1 className="text-xl font-bold mb-4">
          {isRegistering ? "Register" : "Login"}
        </h1>

        {error && <p className="text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {
            isRegistering &&
              <div className="flex flex-col gap-3">
                <label>{"Name"}</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border p-2 rounded"
                  required
                />
              </div>
          }
          <label>{"Email"}</label>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" required />
          <label>{"Password"}</label>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 rounded" required />
          <button className="bg-blue-500 text-white p-2 rounded">
            { isRegistering ? "Register" : "Login" }
          </button>
        </form>
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
          className="text-blue-500 mt-3"
        >
          {isRegistering ? "Already have an account? Login" : "Create an account"}
        </button>
      </div>
      <button
        onClick={handleGoogleLogin}
        className="bg-red-500 text-white p-2 rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
}
