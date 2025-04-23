import { useMemo, useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { IconX } from "~/components/ui/icons";

export function FilterTags({ tags, selectedTags, setSelectedTags }) {
  const [query, setQuery] = useState("");
  const handleSelectTag = (tag) => {
    if (tag && !selectedTags.some((st) => st.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setQuery("");
  };

  const filteredAvailableTags = useMemo(() => {
    if (!tags) {
      return [];
    }
    const lowerCaseQuery = query.trim().toLowerCase();
    if (lowerCaseQuery === "") {
      return tags;
    }
    return tags.filter((tag) => tag.tag.toLowerCase().includes(lowerCaseQuery));
  }, [tags, query]);

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag.id !== tagToRemove.id));
  };

  return (
    <div>
      <Combobox
        value={null}
        onChange={handleSelectTag}
        onClose={() => setQuery("")} // Clear query when the combobox closes
      >
        <ComboboxInput
          className="border w-48 px-2 py-1 rounded-md h-6 text-sm"
          placeholder="Search for tags"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxOptions
          anchor="bottom start"
          className="z-10 empty:hidden bg-white w-48 border border-gray-300 mt-1 rounded-md max-h-60 overflow-y-auto shadow-lg focus:outline-none"
        >
          {filteredAvailableTags.length === 0 && query !== "" ? (
            <ComboboxOption
              value={{ id: "new", tag: query }}
              className="px-3 py-1.5"
            >
              Create "{query}"
            </ComboboxOption>
          ) : (
            filteredAvailableTags.map((tag) => (
              <ComboboxOption
                key={tag.id}
                value={tag}
                className="relative cursor-pointer select-none px-3 py-1.5 text-gray-900 data-[focus]:bg-blue-500 data-[focus]:text-white"
              >
                {tag.tag}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-700"
              style={{ backgroundColor: tag.colorCode || "#dddeee" }}
            >
              {tag.tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="group relative -mr-1 h-3.5 w-3.5 rounded-sm"
              >
                <IconX className="h-3.5 w-3.5 stroke-gray-700" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
