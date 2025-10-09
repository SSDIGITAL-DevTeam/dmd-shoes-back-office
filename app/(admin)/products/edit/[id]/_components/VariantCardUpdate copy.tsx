"use client";

import React from "react";
import { DeleteButton as DeleteIcon } from "@/components/ui/DeleteIcon";

interface LangText {
  id: string;
  en: string;
}

interface Variant {
  id: number;
  name: LangText;
  options: LangText[];
}

interface VariantCardProps {
  language: "id" | "en";
  variants: Variant[];
  pricingType: "single" | "per_variant";
  groupPrices: { [group: string]: string };
  individualPrices: { [key: string]: string };
  validVariantCount: number;
  groupedCombinations: () => { [key: string]: string[][] };
  isGroupOpen: (first: string) => boolean;
  toggleGroup: (first: string) => void;
  isSubOpen: (first: string, second: string) => boolean;
  toggleSub: (first: string, second: string) => void;
  handleAddVariant: () => void;
  handleRemoveVariant: (id: number) => void;
  handleVariantNameChange: (id: number, value: string, lang: "id" | "en") => void;
  handleOptionChange: (
    variantId: number,
    optionIndex: number,
    value: string,
    lang: "id" | "en"
  ) => void;
  handleRemoveOption: (variantId: number, optionIndex: number) => void;
  setPricingType: (type: "single" | "individual") => void;
  setGroupPrices: React.Dispatch<React.SetStateAction<{ [group: string]: string }>>;
  handleIndividualPriceChange: (key: string, price: string) => void;
}

export default function VariantCard({
  language,
  variants,
  pricingType,
  groupPrices,
  individualPrices,
  validVariantCount,
  groupedCombinations,
  isGroupOpen,
  toggleGroup,
  isSubOpen,
  toggleSub,
  handleAddVariant,
  handleRemoveVariant,
  handleVariantNameChange,
  handleOptionChange,
  handleRemoveOption,
  setPricingType,
  setGroupPrices,
  handleIndividualPriceChange,
}: VariantCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header Add Variant */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Variant</h2>
        <button
          type="button"
          onClick={handleAddVariant}
          disabled={variants.length >= 3}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            variants.length >= 3
              ? "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
              : "text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100"
          }`}
        >
          Add Variant {variants.length >= 3 ? "(Max 3)" : ""}
        </button>
      </div>

      {/* Variant Builder */}
      <div className="space-y-4 mb-8">
        {variants.map((variant, variantIndex) => (
          <div
            key={variant.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Variant {variantIndex + 1}
                </span>
                <input
                  type="text"
                  value={
                    language === "id" ? variant.name.id || "" : variant.name.en || ""
                  }
                  onChange={(e) =>
                    handleVariantNameChange(variant.id, e.target.value, language)
                  }
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white"
                  placeholder={
                    language === "id"
                      ? "Nama varian (Indonesia)"
                      : "Variant name (English)"
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveVariant(variant.id)}
                className="text-gray-400 hover:text-red-600 text-lg"
              >
                ×
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Option
              </label>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={
                        language === "id" ? option.id || "" : option.en || ""
                      }
                      onChange={(e) =>
                        handleOptionChange(
                          variant.id,
                          optionIndex,
                          e.target.value,
                          language
                        )
                      }
                      className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white w-24"
                      placeholder={
                        optionIndex === variant.options.length - 1
                          ? language === "id"
                            ? "Isi di sini"
                            : "Input here"
                          : "Option"
                      }
                    />
               
                    {variant.options.length > 1 &&
                      (option.id || option.en).trim() !== "" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveOption(variant.id, optionIndex)
                          }
                          className="text-red-500 hover:text-red-700 text-sm w-4 h-4 flex items-center justify-center"
                        >
                          <DeleteIcon
                            label=""
                            onClick={() =>
                              handleRemoveOption(variant.id, optionIndex)
                            }
                            className="w-4 h-4"
                          />
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Mode */}
      {variants.some((v) => v.options.some((o) => (o.id || o.en).trim() !== "")) && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Product Variant
          </h3>

          {/* Pricing Type */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Set Pricing
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pricingType"
                  value="single"
                  checked={pricingType === "per_variant"}
                  onChange={(e) =>
                    setPricingType(e.target.value as "single" | "individual")
                  }
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  Single Price for All Variant
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pricingType"
                  value="individual"
                  checked={pricingType === "single"}
                  onChange={(e) =>
                    setPricingType(e.target.value as "single" | "individual")
                  }
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Set Individual Prices</span>
              </label>
            </div>
          </div>
     
          {/* Group Pricing (1D variant) */}
          {pricingType === "single" && validVariantCount === 1 && (
            <div className="space-y-4">
              {Object.keys(groupedCombinations()).map((firstOption) => (
                <div key={firstOption} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">{firstOption}</h5>
                    <button
                      type="button"
                      onClick={() => toggleGroup(firstOption)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isGroupOpen(firstOption) ? "" : "rotate-180"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {isGroupOpen(firstOption) && (
                    <div className="p-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600">Rp</span>
                        <input
                          type="number"
                          value={groupPrices[firstOption] ?? ""}
                          onChange={(e) =>
                            setGroupPrices((prev) => ({
                              ...prev,
                              [firstOption]: e.target.value,
                            }))
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm text-black w-32"
                          placeholder="0"
                          min={0}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        {JSON.stringify(groupedCombinations())}
          {/* Combination Pricing (≥2D variant) */}
          {pricingType === "per_variant" && (
          //{pricingType === "per_variant" && validVariantCount >= 2 && (
           
            <div className="space-y-4">
              {Object.entries(groupedCombinations()).map(
                ([firstOption, combinations]) => (
                  <div
                    key={firstOption}
                    className="border border-gray-200 rounded-lg"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">{firstOption}</h5>
                      <button
                        type="button"
                        onClick={() => toggleGroup(firstOption)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isGroupOpen(firstOption) ? "" : "rotate-180"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    {isGroupOpen(firstOption) && (
                      <div className="p-4">
                        {Array.from(new Set(combinations.map((c) => c[1])))
                          .filter(Boolean)
                          .map((secondOption) => (
                            <div key={secondOption} className="mb-4">
                              <div className="bg-gray-100 px-3 py-2 border rounded flex items-center justify-between">
                                <h6 className="font-medium text-gray-800">
                                  {secondOption}
                                </h6>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSub(firstOption, String(secondOption))
                                  }
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <svg
                                    className={`w-4 h-4 transition-transform ${
                                      isSubOpen(firstOption, String(secondOption))
                                        ? ""
                                        : "rotate-180"
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>
                              </div>

                              {isSubOpen(firstOption, String(secondOption)) && (
                                <div className="mt-2 space-y-2">
                                  {combinations
                                    .filter((c) => c[1] === secondOption)
                                    .map((combination, idx) => {
                                      const key = combination.join("-");
                                      const thirdOption = combination[2];
                                      return (
                                        <div
                                          key={`${key}-${idx}`}
                                          className="flex items-center gap-3 text-sm"
                                        >
                                          <span className="w-24 text-gray-600">
                                            {thirdOption || "Price"}
                                          </span>
                                          <span className="text-gray-500">Rp</span>
                                          <input
                                            type="number"
                                            value={individualPrices[key] || ""}
                                            onChange={(e) =>
                                              handleIndividualPriceChange(
                                                key,
                                                e.target.value
                                              )
                                            }
                                            className="px-2 py-1 border border-gray-300 rounded text-sm text-black w-32"
                                            placeholder="0"
                                            min={0}
                                          />
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
