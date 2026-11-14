"use client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function GraficoHora({ dados }: { dados: { hora: number; qtd: number }[] }) {
  return (
    <div className="h-48" role="img" aria-label="Gráfico de chamados por hora do dia">
      <ResponsiveContainer><BarChart data={dados}><XAxis dataKey="hora" tickFormatter={(h) => `${h}h`} fontSize={11} /><YAxis allowDecimals={false} width={28} fontSize={11} /><Tooltip labelFormatter={(h) => `${h}h`} /><Bar dataKey="qtd" name="Chamados" fill="#C9962B" /></BarChart></ResponsiveContainer>
    </div>
  );
}
