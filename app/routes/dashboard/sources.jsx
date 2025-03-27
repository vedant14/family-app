import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export async function clientLoader({}) {
  const res = await fetch(`/api/fetch-sources`);
  const sources = await res.json();
  return sources;
}

// HydrateFallback is rendered while the client loader is running
export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Product({ loaderData }) {
  const sources = loaderData;
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Source Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-left">User</TableHead>
            <TableHead className="text-left">Query</TableHead>
            <TableHead className="text-left">Amount Regex</TableHead>
            <TableHead className="text-left">Amount Regex Backup</TableHead>
            <TableHead className="text-left">Payee Regex</TableHead>
            <TableHead className="text-left">Payee Regex Backup</TableHead>
            <TableHead className="text-center">...</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source, i) => (
            <TableRow
              key={source.id}
              className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <TableCell>{source.id}</TableCell>
              <TableCell>{source.sourceName}</TableCell>
              <TableCell>{source.sourceType}</TableCell>
              <TableCell>{source.user.email}</TableCell>
              <TableCell>{source.query}</TableCell>
              <TableCell>{source.payeeRegex}</TableCell>
              <TableCell>{source.payeeRegexBackup}</TableCell>
              <TableCell>{source.amountRegex}</TableCell>
              <TableCell>{source.amountRegexBackup}</TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" className="text-indigo-600 hover:text-indigo-900">
                  Edit
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
