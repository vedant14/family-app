import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { classNames } from "~/utils/helperFunctions";

export const TableCells = {
  Input: ({
    formId,
    name,
    placeholder,
    defaultValue,
    type = "text",
    className = "",
    checked,
  }) => (
    <TableCell className={`p-0 ${className}`}>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        form={formId}
        placeholder={placeholder}
        checked={checked}
        className="px-2 w-full border-0 focus:outline-none rounded-md focus:ring-none min-h-7"
      />
    </TableCell>
  ),
  Check: ({ formId, name, defaultChecked, className = "", children }) => (
    <TableCell className={`p-0 ${className}`}>
      <input
        type="checkbox"
        name={name}
        form={formId}
        defaultChecked={defaultChecked}
        className="px-2 w-full border-0 focus:outline-none rounded-md focus:ring-none min-h-5 accent-neutral-500 hover:accent-neutral-700"
      />
    </TableCell>
  ),
  Text: ({ children, className = "" }) => (
    <TableCell className={`px-4 ${className}`}>{children}</TableCell>
  ),
  Select: ({ formId, name, value, className = "", children }) => (
    <TableCell className={`p-0 ${className}`}>
      <select
        name={name}
        form={formId}
        defaultValue={value}
        className={`h-full px-4 border-0 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-md focus:ring-inset ${className}`}
      >
        {children}
      </select>
    </TableCell>
  ),
};
