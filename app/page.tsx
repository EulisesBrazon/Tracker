"use client";

import { DateRangeProvider } from "./fetures/ExchangeMonitor/context/DateRangeContext";
import { ExchangeMonitorContainer } from "./fetures/ExchangeMonitor/container/ExchangeMonitorContainer";

export default function Home() {
  return (
    <div id="root" className="min-h-screen bg-background font-sans antialiased">
      <DateRangeProvider>
        <ExchangeMonitorContainer />
      </DateRangeProvider>
    </div>
  );
}
