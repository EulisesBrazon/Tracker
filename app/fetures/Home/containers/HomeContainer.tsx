import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface HomeContainerProps {
    children: React.ReactNode;
}

export function HomeContainer({ children }: HomeContainerProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1">
                {children}
            </main>

            <Footer />
        </div>
    );
}
