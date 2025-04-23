import { useMemo, useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  DialogTitle,
  Description,
  Button,
  DialogBackdrop,
} from "@headlessui/react";

import { IconCirclePlusFilled, IconX } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";

export function AddTags({ tags, selectedTags, handleTagUpdate }) {
  const [query, setQuery] = useState("");
  const [inputTags, setInputTags] = useState(selectedTags);
  const [isOpen, setIsOpen] = useState(false);

  const availableTags = useMemo(() => {
    if (!Array.isArray(tags)) return [];
    const currentSelectedTags = Array.isArray(inputTags) ? inputTags : [];
    const selectedTagIds = new Set(currentSelectedTags.map((tag) => tag?.id));
    return tags.filter((tag) => tag && !selectedTagIds.has(tag.id));
  }, [tags, inputTags]);

  const handleSelectTag = (tag) => {
    if (!tag || typeof tag !== "object") {
      console.error("Invalid tag selected:", tag);
      return;
    }

    const currentSelectedTags = Array.isArray(inputTags) ? inputTags : [];

    const isAlreadySelected = currentSelectedTags.some(
      (st) => st?.id === tag.id && tag.id !== "new"
    );

    if (!isAlreadySelected) {
      setInputTags([...currentSelectedTags, tag]);
    }
  };

  const filteredAvailableTags = useMemo(() => {
    const lowerCaseQuery = query.trim().toLowerCase();
    return availableTags.filter(
      (tag) => tag?.tag && tag.tag.toLowerCase().includes(lowerCaseQuery)
    );
  }, [availableTags, query]);

  const currentSelectedTags = Array.isArray(inputTags) ? inputTags : [];

  const handleRemoveTag = (tagToRemove) => {
    if (!tagToRemove) return;
    setInputTags(currentSelectedTags.filter((st) => st !== tagToRemove)); // Filter by object reference or ID
  };

  return (
    <>
      <button
        aria-label="Add tags"
        className="cursor-pointer p-1 -m-1"
        onClick={() => setIsOpen(true)}
      >
        <IconCirclePlusFilled className="fill-gray-400 h-5 hover:fill-gray-500" />
      </button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogBackdrop className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 z-10" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 z-100">
          <DialogPanel className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-lg max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow-lg duration-200 sm:max-w-3xl">
            <DialogTitle className="border-b px-6 py-4">Add Tags</DialogTitle>
            <div className="grid gap-4 px-6 py-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Tag</Label>
                <Combobox
                  as="div"
                  value={null}
                  className="col-span-3 relative"
                  onChange={handleSelectTag}
                  onClose={() => setQuery("")}
                >
                  <ComboboxInput
                    className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Find or create tag..."
                    value={query}
                    autoComplete="off" // Add this to prevent browser suggestions
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <ComboboxOptions
                    anchor="bottom start"
                    className="z-[6000] mt-1 w-[--input-width] max-h-60 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 empty:hidden"
                  >
                    {filteredAvailableTags.length === 0 && query !== "" ? (
                      <ComboboxOption
                        value={{ id: "new", tag: query }}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[focus]:bg-accent data-[focus]:text-accent-foreground"
                      >
                        Create "{query}"
                      </ComboboxOption>
                    ) : (
                      filteredAvailableTags.map((tag) => (
                        <ComboboxOption
                          key={tag.id}
                          value={tag}
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[focus]:bg-accent data-[focus]:text-accent-foreground"
                        >
                          {tag.tag}
                        </ComboboxOption>
                      ))
                    )}
                  </ComboboxOptions>
                </Combobox>
              </div>

              {currentSelectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentSelectedTags.map((tag) =>
                    tag ? (
                      <div
                        key={tag.id === "new" ? `new-${tag.tag}` : tag.id}
                        className="bg-gray-300 px-2 py-1 rounded-full text-xs flex items-center"
                      >
                        <span>{tag.tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)} // Use dedicated remove handler
                          className="ml-1.5 text-muted-foreground hover:text-foreground focus:outline-none leading-none"
                          aria-label={`Remove ${tag.tag} tag`}
                        >
                          <IconX className="h-3.5 w-3.5 stroke-gray-700 cursor-pointer" />
                        </button>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
            <div className="flex border-t px-6 py-4 justify-end gap-x-4">
              <Button
                className="bg-gray-50 rounded-md px-2 py-1.5 text-xs cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gray-500 text-gray-50 rounded-md px-2 py-1.5 text-xs cursor-pointer text-bold"
                onClick={() =>
                  handleTagUpdate({
                    inputTags: inputTags,
                  })
                }
              >
                Save changes
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
