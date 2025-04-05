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
    <TableCell className="p-0">
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        form={formId}
        className={`h-full px-4 min-h-7 border-0 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-md focus:ring-inset w-full ${className}`}
      />
    </TableCell>
  ),
  Text: ({ children, className = "" }) => (
    <TableCell className={`px-4 py-2 ${className}`}>{children}</TableCell>
  ),
  Select: ({ formId, name, value, className = "", children }) => (
    <TableCell className={`p-0 ${className}`}>
      <select
        name={name}
        form={formId}
        defaultValue={value}
        className={`h-full min-h-[38px] px-4 py-2 w-full border-0 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-md focus:ring-inset ${className}`}
      >
        {children}
      </select>
    </TableCell>
  ),
};
