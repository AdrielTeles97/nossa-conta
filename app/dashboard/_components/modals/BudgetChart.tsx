'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartProps {
    data: { category?: string; value: number | unknown }[];
    type: string;
}

export function BudgetChart({ data, type }: ChartProps) {
    // Agrupa os dados por categoria e soma os valores
    const groupedData = data.reduce(
        (acc, curr) => {
            const existing = acc.find(
                item => item.name === (curr.category || 'Geral')
            );
            if (existing) {
                existing.value += Number(curr.value);
            } else {
                acc.push({
                    name: curr.category || 'Geral',
                    value: Number(curr.value),
                });
            }
            return acc;
        },
        [] as { name: string; value: number }[]
    );

    const total = groupedData.reduce((acc, curr) => acc + curr.value, 0) || 1;
    const chartData = groupedData.sort((a, b) => b.value - a.value);

    // Paleta variada igual referência (azul, verde, laranja, roxo...)
    const palette: { solid: string; light: string }[] = [
        { solid: '#1E4DB7', light: '#E8EEFB' }, // azul 51% Aluguel
        { solid: '#2E7D32', light: '#E6F2E8' }, // verde 41% Financiamento
        { solid: '#F59E0B', light: '#FFF4E0' }, // laranja 6%
        { solid: '#6D28D9', light: '#F0E9FF' }, // roxo 3%
        { solid: '#0E7490', light: '#E0F2F7' },
        { solid: '#BE123C', light: '#FFE4E6' },
        { solid: '#047857', light: '#D1FAE5' },
        { solid: '#7C3AED', light: '#EDE9FE' },
    ];
    const colors = palette.map((p) => p.solid);

    if (chartData.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-[#8A8D82] text-sm h-[200px]">
                Sem dados para exibir no momento.
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-[300px]">
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="65%"
                            outerRadius="90%"
                            paddingAngle={2}
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: unknown) =>
                                Number(value as number).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                })
                            }
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 max-h-[120px] overflow-y-auto pr-1">
                {chartData.map((d, i) => {
                    const p = palette[i % palette.length];
                    const pct = Math.round((d.value / total) * 100);
                    return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.solid }} />
                            <span
                                className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ backgroundColor: p.light, color: p.solid }}
                            >
                                {pct}%
                            </span>
                            <span className="text-[#4A5160] font-medium truncate" title={d.name}>
                                {d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
