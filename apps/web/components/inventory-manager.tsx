"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import {
  useMemo,
  useState
} from "react";
import { useCurrentStore } from "@/components/store-context";

type Product = {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  categoryName: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  stock: number;
  active: boolean;
};

const INVENTORY = gql`
  query StoreInventory(
    $storeId: String!
  ) {
    products(
      storeId: $storeId
      active: true
    ) {
      id
      name
      barcode
      sku
      categoryName
      costPrice
      sellingPrice
      minimumStock
      stock
      active
    }
  }
`;

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",
      currency:
        "USD"
    }
  ).format(value);
}

function stockStatus(
  product: Product
) {
  if (
    product.stock <=
    0
  ) {
    return "OUT OF STOCK";
  }

  if (
    product.stock <=
    product.minimumStock
  ) {
    return "LOW STOCK";
  }

  return "IN STOCK";
}

export function InventoryManager() {
  const {
    storeId,
    store
  } = useCurrentStore();

  const [
    search,
    setSearch
  ] = useState("");

  const [
    status,
    setStatus
  ] = useState(
    "ALL"
  );

  const {
    data,
    loading,
    error,
    refetch
  } = useQuery<{
    products:
      Product[];
  }>(
    INVENTORY,
    {
      variables: {
        storeId:
          storeId ??
          ""
      },
      skip:
        !storeId,
      fetchPolicy:
        "network-only"
    }
  );

  const products =
    data?.products ??
    [];

  const rows =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const currentStatus =
            stockStatus(
              product
            );

          const matchesSearch =
            !value ||
            product.name
              .toLowerCase()
              .includes(
                value
              ) ||
            product.barcode
              .toLowerCase()
              .includes(
                value
              ) ||
            product.sku
              .toLowerCase()
              .includes(
                value
              );

          const matchesStatus =
            status ===
              "ALL" ||
            currentStatus ===
              status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      products,
      search,
      status
    ]);

  const stats =
    useMemo(() => {
      const totalUnits =
        products.reduce(
          (
            sum,
            product
          ) =>
            sum +
            product.stock,
          0
        );

      const costValue =
        products.reduce(
          (
            sum,
            product
          ) =>
            sum +
            product.stock *
              product.costPrice,
          0
        );

      const low =
        products.filter(
          (product) =>
            product.stock >
              0 &&
            product.stock <=
              product.minimumStock
        ).length;

      const out =
        products.filter(
          (product) =>
            product.stock <=
            0
        ).length;

      return {
        totalUnits,
        costValue,
        low,
        out
      };
    }, [
      products
    ]);

  if (error) {
    return (
      <section className="panel shift-error">
        Failed to load
        inventory:{" "}
        {error.message}
      </section>
    );
  }

  return (
    <>
      <section className="store-page-banner">
        <div>
          <span>
            INVENTORY LOCATION
          </span>

          <strong>
            {store?.name}
          </strong>

          <small>
            {store?.code}
          </small>
        </div>

        <button
          className="button secondary"
          type="button"
          onClick={() =>
            void refetch()
          }
        >
          Refresh
        </button>
      </section>

      <section className="inventory-kpi-grid">
        <article>
          <span>
            Products
          </span>
          <strong>
            {
              products.length
            }
          </strong>
        </article>

        <article>
          <span>
            Total Units
          </span>
          <strong>
            {
              stats.totalUnits
            }
          </strong>
        </article>

        <article>
          <span>
            Low Stock
          </span>
          <strong>
            {stats.low}
          </strong>
        </article>

        <article>
          <span>
            Out of Stock
          </span>
          <strong>
            {stats.out}
          </strong>
        </article>

        <article>
          <span>
            Inventory Cost
          </span>
          <strong>
            {money(
              stats.costValue
            )}
          </strong>
        </article>
      </section>

      <section className="panel">
        <div className="toolbar inventory-toolbar">
          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event
                  .target
                  .value
              )
            }
            placeholder="Search product, barcode or SKU"
          />

          <select
            value={
              status
            }
            onChange={(
              event
            ) =>
              setStatus(
                event
                  .target
                  .value
              )
            }
          >
            <option value="ALL">
              All stock
            </option>
            <option value="IN STOCK">
              In stock
            </option>
            <option value="LOW STOCK">
              Low stock
            </option>
            <option value="OUT OF STOCK">
              Out of stock
            </option>
          </select>

          <Link
            href="/manager/products"
            className="button primary"
          >
            Manage Products
          </Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Product
                </th>
                <th>
                  Barcode / SKU
                </th>
                <th>
                  Category
                </th>
                <th>
                  Stock
                </th>
                <th>
                  Minimum
                </th>
                <th>
                  Status
                </th>
                <th>
                  Cost
                </th>
                <th>
                  Retail
                </th>
                <th>
                  Stock Value
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={
                      9
                    }
                  >
                    Loading
                    inventory…
                  </td>
                </tr>
              )}

              {!loading &&
                rows.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={
                        9
                      }
                      style={{
                        textAlign:
                          "center",
                        padding:
                          34
                      }}
                    >
                      No inventory
                      matches this
                      filter.
                    </td>
                  </tr>
                )}

              {rows.map(
                (product) => {
                  const currentStatus =
                    stockStatus(
                      product
                    );

                  return (
                    <tr
                      key={
                        product.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            product.name
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          product.barcode
                        }

                        <div className="table-secondary">
                          {
                            product.sku
                          }
                        </div>
                      </td>

                      <td>
                        {
                          product.categoryName
                        }
                      </td>

                      <td>
                        <strong>
                          {
                            product.stock
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          product.minimumStock
                        }
                      </td>

                      <td>
                        <span
                          className={`store-stock-status stock-${currentStatus
                            .toLowerCase()
                            .replaceAll(
                              " ",
                              "-"
                            )}`}
                        >
                          {
                            currentStatus
                          }
                        </span>
                      </td>

                      <td>
                        {money(
                          product.costPrice
                        )}
                      </td>

                      <td>
                        {money(
                          product.sellingPrice
                        )}
                      </td>

                      <td>
                        {money(
                          product.stock *
                            product.costPrice
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
