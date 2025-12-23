export function Footer() {
    return (
        <footer className="border-t border-border py-4 mt-8">
            <div className="container mx-auto max-w-7xl px-2 sm:px-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                    Datos actualizados diariamente. Última actualización: {new Date().toLocaleDateString('es-VE')}
                </p>
                <p className="text-xs text-muted-foreground/80">
                    <strong>Descargo de responsabilidad:</strong> Esta plataforma recopila y muestra información de tasas de cambio de fuentes públicas de referencia.
                    Los datos presentados son únicamente informativos y no son generados por este sitio.
                    No nos hacemos responsables por la exactitud, actualidad o uso de la información mostrada.
                    Consulte siempre fuentes oficiales para decisiones financieras.
                </p>
            </div>
        </footer>
    );
}
