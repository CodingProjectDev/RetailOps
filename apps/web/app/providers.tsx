"use client";

import { ApolloProvider } from "@apollo/client/react";
import { Provider as ReduxProvider } from "react-redux";
import { apolloClient } from "@/lib/apollo";
import { store } from "@/store/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </ReduxProvider>
  );
}
