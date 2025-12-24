import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useSyncBcvRate } from '../hooks/useSyncBcvRate';
import { useSyncUsdtRate } from '../hooks/useSyncUsdtRate';
import { RatesQueryForm } from '../components/RatesQueryForm';

interface HomeContainerProps {
    children: React.ReactNode;
}

export function HomeContainer({ children }: HomeContainerProps) {
    const { sync, loading, error, result } = useSyncBcvRate();
    const { sync: syncUsdt, loading: loadingUsdt, error: errorUsdt, result: resultUsdt } = useSyncUsdtRate();
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1">
                {/* <div className="flex flex-col items-center gap-4 py-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            className="px-4 py-2 rounded bg-bcv text-white font-semibold disabled:opacity-60"
                            onClick={sync}
                            disabled={loading}
                        >
                            {loading ? 'Sincronizando...' : 'Sincronizar tasa BCV'}
                        </button>
                        <button
                            className="px-4 py-2 rounded bg-paralelo text-white font-semibold disabled:opacity-60"
                            onClick={syncUsdt}
                            disabled={loadingUsdt}
                        >
                            {loadingUsdt ? 'Sincronizando...' : 'Sincronizar tasa USDT'}
                        </button>
                    </div>
                    {(error || errorUsdt) && <div className="text-red-500 text-sm">{error || errorUsdt}</div>}
                    {(result || resultUsdt) && (
                        <div className="text-green-600 text-sm">
                            {result && (result.actualizado && 'Tasa BCV actualizada correctamente.')}
                            {result && (result.creado && 'Tasa BCV creada correctamente.')}
                            {resultUsdt && (resultUsdt.actualizado && 'Tasa USDT actualizada correctamente.')}
                            {resultUsdt && (resultUsdt.creado && 'Tasa USDT creada correctamente.')}
                            {((result && !result.actualizado && !result.creado) || (resultUsdt && !resultUsdt.actualizado && !resultUsdt.creado)) && 'No hubo cambios.'}
                        </div>
                    )}
                </div>
                <div className="container mx-auto max-w-3xl px-2 sm:px-4 mt-6">
                    <RatesQueryForm />
                </div> */}
                {children}
            </main>

            <Footer />
        </div>
    );
}
