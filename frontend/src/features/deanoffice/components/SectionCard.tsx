type Props = {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
};

export function SectionCard({ title, icon, children }: Props) {
    return (
        <div className="bg-white border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <span className="w-5 h-5 text-emerald-600">{icon}</span>
                <span>{title}</span>
            </div>
            {children}
        </div>
    );
}
