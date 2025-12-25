import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useSyncBcvRate } from '../hooks/useSyncBcvRate';
import { useSyncUsdtRate } from '../hooks/useSyncUsdtRate';
import { ExchangeMonitorContainer } from '../../ExchangeMonitor/container/ExchangeMonitorContainer';
import LoginContainer from '../../Auth/containers/loginContainer';
import { useAuth } from '../../Auth/context/AuthProvider';

export function HomeContainer() {
    const { sync, loading, error, result } = useSyncBcvRate();
    const { sync: syncUsdt, loading: loadingUsdt, error: errorUsdt, result: resultUsdt } = useSyncUsdtRate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 flex">
                {!user ? (
                    <div className="flex flex-1 items-center justify-center">
                        <LoginContainer />
                    </div>
                ) : (
                    <ExchangeMonitorContainer />
                )}
            </main>

            <Footer />
        </div>
    );
}
