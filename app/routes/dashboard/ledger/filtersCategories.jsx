import { useMemo, useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { IconX } from "~/components/ui/icons";
export function CategoryFilter({
  categories,
  selectedCategories,
  setSelectedCategories,
}) {
  const [query, setQuery] = useState("");
  const handleSelectCategory = (category) => {
    if (category && !selectedCategories.some((sc) => sc.id === category.id)) {
      setSelectedCategories([...selectedCategories, category]);
    }
    setQuery("");
  };

  const filteredAvailableCategories = useMemo(() => {
    const selectedCategoryIds = new Set(
      selectedCategories.map((cat) => cat.id)
    );
    const available = categories.filter(
      (category) => !selectedCategoryIds.has(category.id)
    );

    if (query === "") {
      return available;
    } else {
      return available.filter((category) =>
        category.categoryName.toLowerCase().includes(query.toLowerCase())
      );
    }
  }, [query, selectedCategories]);

  const handleRemoveCategory = (categoryToRemove) => {
    setSelectedCategories(
      selectedCategories.filter(
        (category) => category.id !== categoryToRemove.id
      )
    );
  };

  return (
    <div>
      <div className="">
        <Combobox
          value={null}
          onChange={handleSelectCategory}
          onClose={() => setQuery("")}
        >
          <ComboboxInput
            className="border w-48 px-2 py-1 rounded-md h-6 text-sm"
            placeholder="Search for categories"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxOptions
            anchor="bottom start"
            className="empty:invisible bg-white w-48 divide-y-1 border mt-1 rounded-md max-h-60 overflow-y-auto shadow-lg"
          >
            {filteredAvailableCategories.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                Nothing found.
              </div>
            ) : (
              filteredAvailableCategories.map((category) => (
                <ComboboxOption
                  key={category.id}
                  value={category}
                  className="data-[focus]:bg-blue-100 px-2 py-1 cursor-pointer"
                >
                  {category.categoryName}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Combobox>
      </div>
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {selectedCategories.map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-700"
              style={{ backgroundColor: category.colorCode || "#808080" }}
            >
              {category.categoryName}
              <button
                type="button"
                onClick={() => handleRemoveCategory(category)}
                className="group relative -mr-1 h-3.5 w-3.5 rounded-sm"
              >
                <IconX
                  className="h-3.5 w-3.5 stroke-gray-700"
                />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
