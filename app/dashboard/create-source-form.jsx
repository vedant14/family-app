import { useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useDialogStore } from "~/utils/store";

export function SourceForm({ categories }) {
  const formLayout = [
    {
      fields: [
        { id: "sourceName", label: "Source Name", type: "text" },
        {
          id: "sourceType",
          label: "Source Type",
          type: "select",
          options: ["MAIL", "API"],
        },
      ],
    },
    {
      fields: [
        {
          id: "defaultType",
          label: "Income or Expense",
          type: "select",
          options: ["EXPENSE", "INCOME"],
        },
        {
          id: "categoryId",
          label: "Default category for this expense/income",
          type: "category",
          options: categories,
        },
      ],
    },
    {
      fields: [
        { id: "subject", label: "Subject (for email)", type: "text" },
        { id: "label", label: "Label (for email)", type: "text" },
      ],
    },
    {
      fields: [
        { id: "fromEmail", label: "From Email (for email)", type: "text" },
      ],
    },
    {
      fields: [
        { id: "amountRegex", label: "Amount Regex", type: "text" },
        { id: "amountRegexBackup", label: "Amount Regex Backup", type: "text" },
      ],
    },
    {
      fields: [
        { id: "payeeRegex", label: "Payee Regex", type: "text" },
        { id: "payeeRegexBackup", label: "Payee Regex Backup", type: "text" },
      ],
    },
  ];
  const toggleOpen = useDialogStore((state) => state.toggleOpen);
  const [formData, setFormData] = useState(() => {
    const initialState = {};
    formLayout.forEach((row) => {
      row.fields.forEach((field) => {
        initialState[field.id] =
          field.type === "select" ? field.options[0] : ""; // Default to first option for select
      });
    });
    return initialState;
  });

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <DialogContent className="!w-[800px]">
      <DialogHeader>
        <DialogTitle>Create a new source</DialogTitle>
        <DialogDescription>
          Criteria for adding a new transaction
        </DialogDescription>
      </DialogHeader>
      <Form method="post">
        <div className="grid gap-4 py-4">
          {formLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-2 gap-4">
              {row.fields.map(({ id, label, type, options }) => (
                <div key={id} className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor={id} className="text-left col-span-2">
                    {label}
                  </Label>
                  {type === "select" || type === "category" ? (
                    <select
                      id={id}
                      name={id}
                      className="col-span-3 border border-gray-300 rounded p-2"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select an option
                      </option>
                      {options.map((option) => (
                        <option
                          key={option.id || option}
                          value={option.id || option}
                        >
                          {option.categoryName || option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={id}
                      name={id}
                      type={type}
                      className="col-span-3"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="submit">Create Source</Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  );
}
