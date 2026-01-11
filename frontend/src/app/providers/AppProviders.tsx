import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../features/auth/context/AuthProvider";

type Props = {
    children: ReactNode;
};

export function AppProviders({ children }: Props) {
    return (
        <AuthProvider>
            <BrowserRouter>{children}</BrowserRouter>
        </AuthProvider>
    );
}
