"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type CurrentStore = {
  id: string;
  name: string;
  code: string;
  active: boolean;
};

type StoreContextValue = {
  storeId: string | null;
  store: CurrentStore | null;
  stores: CurrentStore[];
  loading: boolean;
  errorMessage: string | null;
  setStoreId: (
    storeId: string
  ) => void;
};

const MY_STORES = gql`
  query CurrentStoreOptions {
    myStores {
      id
      name
      code
      active
    }
  }
`;

const StoreContext =
  createContext<
    StoreContextValue | undefined
  >(undefined);

const STORAGE_KEY =
  "retailops-current-store-id";

export function CurrentStoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [
    storeId,
    setStoreIdState
  ] = useState<
    string | null
  >(null);

  const {
    data,
    loading,
    error
  } = useQuery<{
    myStores:
      CurrentStore[];
  }>(MY_STORES, {
    fetchPolicy:
      "network-only"
  });

  const stores =
    useMemo(
      () =>
        (
          data?.myStores ??
          []
        ).filter(
          (store) =>
            store.active
        ),
      [data?.myStores]
    );

  useEffect(() => {
    if (
      loading ||
      !stores.length
    ) {
      return;
    }

    const currentIsValid =
      storeId &&
      stores.some(
        (store) =>
          store.id ===
          storeId
      );

    if (currentIsValid) {
      return;
    }

    let stored:
      string | null =
      null;

    try {
      stored =
        window.localStorage.getItem(
          STORAGE_KEY
        );
    } catch {
      stored =
        null;
    }

    const next =
      stores.find(
        (store) =>
          store.id ===
          stored
      )?.id ??
      stores[0].id;

    setStoreIdState(
      next
    );

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        next
      );
    } catch {
      // localStorage is optional.
    }
  }, [
    loading,
    stores,
    storeId
  ]);

  function setStoreId(
    next: string
  ) {
    if (
      !stores.some(
        (store) =>
          store.id ===
          next
      )
    ) {
      return;
    }

    setStoreIdState(
      next
    );

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        next
      );
    } catch {
      // localStorage is optional.
    }
  }

  const store =
    stores.find(
      (row) =>
        row.id ===
        storeId
    ) ??
    null;

  return (
    <StoreContext.Provider
      value={{
        storeId,
        store,
        stores,
        loading,
        errorMessage:
          error?.message ??
          null,
        setStoreId
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useCurrentStore() {
  const value =
    useContext(
      StoreContext
    );

  if (!value) {
    throw new Error(
      "useCurrentStore must be used inside CurrentStoreProvider"
    );
  }

  return value;
}
