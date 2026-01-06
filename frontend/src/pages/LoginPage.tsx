import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthContext.tsx";

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
    const { login: doLogin } = useAuth();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await doLogin(login, password);
            navigate("/app", { replace: true });
        } catch (err: any) {
            alert(err?.message ?? "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 px-8 py-10">
                <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>

                <div className="text-center mt-4">
                    <div className="text-emerald-700 font-semibold text-lg">System Egzaminacyjny</div>
                    <div className="text-sm text-slate-600 mt-1">Zaloguj się do systemu</div>
                </div>

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
                            className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
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
                            className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 rounded-lg bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 transition disabled:opacity-70"
                    >
                        Zaloguj
                    </button>
                </form>

                <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm">
                    <div className="text-emerald-700 font-medium">Demo - użyj jednego z loginów:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {demoUsers.map((u) => (
                            <button
                                key={u.login}
                                type="button"
                                onClick={() => setLogin(u.login)}
                                className="text-left px-3 py-2 rounded-lg bg-white border border-emerald-100 text-emerald-700 hover:border-emerald-300 transition"
                                title={`Ustaw login: ${u.login}`}
                            >
                                <span className="font-semibold">{u.login}</span>{" "}
                                <span className="text-emerald-500">{u.label.replace(u.login, "").trim()}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 text-emerald-500">Hasło: dowolne</div>
                </div>
            </div>
        </div>
    );
}
