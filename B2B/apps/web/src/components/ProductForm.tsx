import { useMutation } from "@tanstack/react-query";
import type { FormEvent, ReactElement } from "react";
import { useState, useEffect } from "react";

import { createProduct, type CreateProductInput, updateProduct } from "../api/products";
import { getHttpErrorMessage } from "../lib/errors";

type ProductFormProps = {
  onSuccess?: () => void;
  initialValues?: Partial<CreateProductInput> & { id?: string };
};

const INITIAL_VALUES: CreateProductInput = {
  name: "",
  description: "",
  moq: 1,
  unit: "",
  pricePerUnit: 0,
};

export function ProductForm({ onSuccess, initialValues }: ProductFormProps): ReactElement {
  const [form, setForm] = useState<CreateProductInput>(() => ({ ...INITIAL_VALUES, ...(initialValues ?? {}) } as CreateProductInput));
  // Keep form in sync if initialValues change after mount
  useEffect(() => {
    if (initialValues) {
      setForm((current) => ({ ...INITIAL_VALUES, ...initialValues } as CreateProductInput));
    }
  }, [initialValues]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      setSuccessMessage("Product saved successfully.");
      setForm(INITIAL_VALUES);
      onSuccess?.();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateProductInput & { id: string }) => updateProduct(data.id, {
      name: data.name,
      description: data.description,
      moq: data.moq,
      unit: data.unit,
      pricePerUnit: data.pricePerUnit,
    }),
    onSuccess: () => {
      setSuccessMessage("Product updated successfully.");
      onSuccess?.();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSuccessMessage(null);
    if (initialValues?.id) {
      updateMutation.mutate({ ...(form as CreateProductInput), id: initialValues.id });
    } else {
      createMutation.mutate(form);
    }
  }

  function updateField<K extends keyof CreateProductInput>(field: K, value: CreateProductInput[K]): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage = createMutation.isError || updateMutation.isError ? getHttpErrorMessage(createMutation.error || updateMutation.error, "Could not save product.") : null;

  const isEditing = Boolean(initialValues?.id);

  return (
    <form className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm" onSubmit={handleSubmit} noValidate>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900">{isEditing ? "Edit product" : "Add product"}</h2>
        <p className="mt-1 text-sm text-gray-600">{isEditing ? "Update your wholesale listing." : "Create a wholesale listing with the fields shared across the marketplace."}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-900" htmlFor="name">
            Product name
          </label>
          <input
            id="name"
            name="name"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-black focus:border-black bg-white"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-900" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-black focus:border-black bg-white"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900" htmlFor="moq">
            MOQ
          </label>
          <input
            id="moq"
            name="moq"
            type="number"
            min={1}
            step={1}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-black focus:border-black bg-white"
            value={form.moq}
            onChange={(event) => updateField("moq", Number(event.target.value))}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900" htmlFor="unit">
            Unit
          </label>
          <input
            id="unit"
            name="unit"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-black focus:border-black bg-white"
            placeholder="cartons, sets, kg"
            value={form.unit}
            onChange={(event) => updateField("unit", event.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-900" htmlFor="pricePerUnit">
            Price per unit
          </label>
          <input
            id="pricePerUnit"
            name="pricePerUnit"
            type="number"
            min={0}
            step="any"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-black focus:border-black bg-white"
            value={form.pricePerUnit}
            onChange={(event) => updateField("pricePerUnit", Number(event.target.value))}
            disabled={isPending}
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || form.name.trim().length === 0 || form.description.trim().length === 0 || form.unit.trim().length === 0 || form.moq < 1}
        className="w-full bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium py-3 mt-4 transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
      >
        {isPending ? "Saving…" : isEditing ? "Update product" : "Create product"}
      </button>
    </form>
  );
}
