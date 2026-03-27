import { TopAppBar } from '../components/layout/TopAppBar';
import { BottomNav } from '../components/layout/BottomNav';
import { Penguin } from '../components/penguin/Penguin';

export function StatsPage() {
  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar title="Stats" />
      
      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <section className="text-center space-y-4 py-8">
          <div className="w-20 h-20 mx-auto bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">leaderboard</span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Tus Estadísticas</h1>
          <p className="text-on-surface-variant text-sm">
            Próximamente podrás ver gráficos de rendimiento, historial de depósitos y más.
          </p>
        </section>

        {/* Placeholder Stats Cards */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-high p-6 rounded-xl text-center">
            <p className="text-on-surface-variant text-xs uppercase tracking-wider mb-2">Total Guardado</p>
            <p className="font-headline text-2xl font-bold text-primary">$12,450</p>
          </div>
          <div className="bg-surface-container-high p-6 rounded-xl text-center">
            <p className="text-on-surface-variant text-xs uppercase tracking-wider mb-2">Racha Actual</p>
            <p className="font-headline text-2xl font-bold text-primary">5 meses</p>
          </div>
          <div className="bg-surface-container-high p-6 rounded-xl text-center">
            <p className="text-on-surface-variant text-xs uppercase tracking-wider mb-2">Yield Generado</p>
            <p className="font-headline text-2xl font-bold text-primary">$245</p>
          </div>
          <div className="bg-surface-container-high p-6 rounded-xl text-center">
            <p className="text-on-surface-variant text-xs uppercase tracking-wider mb-2">Nivel</p>
            <p className="font-headline text-2xl font-bold text-secondary">Saver</p>
          </div>
        </section>

        {/* Penguin */}
        <div className="flex justify-center pt-8">
          <Penguin mood="idle" size="lg" />
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
