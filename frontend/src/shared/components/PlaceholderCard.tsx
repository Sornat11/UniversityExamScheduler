type Props = {
    title: string;
};

export function PlaceholderCard({ title }: Props) {
    return (
        <div className="bg-white border rounded-2xl p-6">
            <div className="text-slate-900 font-semibold">{title}</div>
            <div className="text-sm text-slate-600 mt-2">Widok do zrobienia wg Figmy.</div>
        </div>
    );
}
