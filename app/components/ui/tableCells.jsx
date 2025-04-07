import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export const TableCells = {
  Input: ({ formId, name, defaultValue, type = "text", className = "" }) => (
    <TableCell className="p-0 w-96">
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        form={formId}
        className={`h-full px-4 min-h-7 border-0 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-md focus:ring-inset ${className}`}
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
