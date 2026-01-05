import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import {useAuth} from "../auth/AuthContext.tsx";

type DemoUser = { login: string; label: string };

export default function LoginPage() {
    const navigate = useNavigate();

    const demoUsers: DemoUser[] = useMemo(
        () => [
            { login: "student", label: "student (Student)" },
            { login: "starosta", label: "starosta (Starosta)" },
            { login: "prowadzacy", label: "prowadzacy (Prowadzący)" },
            { login: "dziekanat", label: "dziekanat (Dziekanat)" },
        ],
        []
    );

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login: doLogin, user } = useAuth();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await doLogin(login, password);
        
        const u = user ?? JSON.parse(localStorage.getItem("ues_auth_user") ?? "null");
        console.log(u)
         navigate("/app", { replace: true });
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
            {/* “telefon” */}
            <div className="w-98.25 h-213 rounded-[44px] bg-emerald-50 shadow-[0_24px_70px_rgba(16,185,129,0.25)] p-6 relative overflow-hidden">
                {/* delikatne plamy tła */}
                <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-100/60 blur-2xl" />
                <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-100/60 blur-2xl" />

                {/* karta */}
                <div className="relative bg-white rounded-[28px] shadow-xl px-8 py-10 h-full flex flex-col">
                    {/* ikonka */}
                    <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                            <LogIn className="w-6 h-6 text-emerald-500" />
                        </div>
                    </div>

                    {/* nagłówek */}
                    <div className="text-center mt-4">
                        <div className="text-emerald-600 font-medium">System Egzaminacyjny</div>
                        <div className="text-sm text-slate-600 mt-1">Zaloguj się do systemu</div>
                    </div>

                    {/* formularz */}
                    <form onSubmit={onSubmit} className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-700" htmlFor="login">
                                Login
                            </label>
                            <input
                                id="login"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="Wprowadź login"
                                autoComplete="username"
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-700" htmlFor="password">
                                Hasło
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Wprowadź hasło"
                                autoComplete="current-password"
                                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-11 rounded-lg bg-emerald-600! text-white! opacity-100! disabled:opacity-70! border border-emerald-800 shadow-md font-semibold"
                        >
                            Zaloguj
                        </button>
                    </form>

                    {/* demo box */}
                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm">
                        <div className="text-emerald-700 font-medium">Demo - użyj jednego z loginów:</div>

                        <ul className="mt-2 space-y-1 text-emerald-600">
                            {demoUsers.map((u) => (
                                <li key={u.login}>
                                    <button
                                        type="button"
                                        onClick={() => setLogin(u.login)}
                                        className="hover:underline"
                                        title={`Ustaw login: ${u.login}`}
                                    >
                                        • <span className="font-semibold">{u.login}</span>{" "}
                                        <span className="text-emerald-500">
                      {u.label.replace(u.login, "").trim()}
                    </span>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-2 text-emerald-500">Hasło: dowolne</div>
                    </div>

                    {/* pasek “home” */}
                    <div className="mt-auto flex justify-center pt-6">
                        <div className="w-28 h-1.5 rounded-full bg-slate-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}
