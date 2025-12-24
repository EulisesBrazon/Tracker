"use client";

import { DateRangeProvider } from "./fetures/ExchangeMonitor/context/DateRangeContext";
import { ExchangeMonitorContainer } from "./fetures/ExchangeMonitor/container/ExchangeMonitorContainer";
import AuthProvider from "./fetures/Auth/context/AuthProvider";
import { HomeContainer } from "./fetures/Home/containers/HomeContainer";

export default function Home() {
  return (
    <AuthProvider>
      <DateRangeProvider>
        <HomeContainer />
      </DateRangeProvider>
    </AuthProvider>
  );
}
