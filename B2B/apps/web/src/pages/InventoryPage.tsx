import type { ReactElement } from "react";
import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { listProducts, deleteProduct, updateProduct } from "../api/products";
import { fetchMe } from "../api/profile.api";
import { ProductForm } from "../components/ProductForm";
import type { ProductResponse } from "../api/products";

export function InventoryPage(): ReactElement {
  const qc = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const [editing, setEditing] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  async function load() {
    if (!meQuery.data) return;
    const owner = meQuery.data.organization.id || meQuery.data.organization._id;
    const res = await listProducts(owner, 0, 100);
    setProducts(res as ProductResponse[]);
  }

  useEffect(() => { void load(); }, [meQuery.data]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    await deleteProduct(id);
    await load();
    qc.invalidateQueries(["me"]);
  }

  const sortedProducts = [...products].sort((a, b) => {
    let compareA: any;
    let compareB: any;

    if (sortBy === "name") {
      compareA = a.name.toLowerCase();
      compareB = b.name.toLowerCase();
    } else if (sortBy === "price") {
      compareA = a.pricePerUnit || 0;
      compareB = b.pricePerUnit || 0;
    } else {
      compareA = a.stock || 0;
      compareB = b.stock || 0;
    }

    if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
    if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (column: "name" | "price" | "stock") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your product listings and stock</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((s) => !s)}
          className="btn-primary"
        >
          ➕ Add Product
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="rounded-xl border border-border bg-white app-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Add New Product</h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <ProductForm onSuccess={() => { setShowAddForm(false); void load(); }} />
        </div>
      )}

      {/* Edit Product Form */}
      {editing && (
        <div className="rounded-xl border border-border bg-white app-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Product</h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <ProductForm
            initialValues={{
              id: editing._id,
              name: editing.name,
              description: editing.description,
              moq: editing.moq,
              unit: editing.unit,
              pricePerUnit: editing.pricePerUnit,
            }}
            onSuccess={() => { setEditing(null); void load(); }}
          />
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-card">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">No products yet</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-primary hover:underline font-medium"
            >
              Add your first product →
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      <button
                        type="button"
                        onClick={() => handleSort("name")}
                        className="hover:text-primary transition-colors"
                      >
                        Product {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      <button
                        type="button"
                        onClick={() => handleSort("stock")}
                        className="hover:text-primary transition-colors"
                      >
                        Stock {sortBy === "stock" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      MOQ
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      <button
                        type="button"
                        onClick={() => handleSort("price")}
                        className="hover:text-primary transition-colors"
                      >
                        Price {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{product._id?.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            (product.stock || 0) > 20
                              ? "bg-emerald-100 text-emerald-800"
                              : (product.stock || 0) > 5
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{product.moq || 1}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{product.pricePerUnit} / {product.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(product)}
                            className="text-primary hover:bg-primary/10 rounded-lg px-3 py-1 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(product._id)}
                            className="text-red-600 hover:bg-red-50 rounded-lg px-3 py-1 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {sortedProducts.map((product) => (
                <div key={product._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-600">{product.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(product)}
                        className="text-primary hover:bg-primary/10 rounded px-2 py-1 text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product._id)}
                        className="text-red-600 hover:bg-red-50 rounded px-2 py-1 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Stock</p>
                      <p className="font-semibold">{product.stock || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">MOQ</p>
                      <p className="font-semibold">{product.moq || 1}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Price</p>
                      <p className="font-semibold">₹{product.pricePerUnit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Unit</p>
                      <p className="font-semibold">{product.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
