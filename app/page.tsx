"use client";

import { DateRangeProvider } from "./fetures/ExchangeMonitor/context/DateRangeContext";
import { ExchangeMonitorContainer } from "./fetures/ExchangeMonitor/container/ExchangeMonitorContainer";

export default function Home() {
  return (
    <DateRangeProvider>
      <ExchangeMonitorContainer />
    </DateRangeProvider>
  );
}
