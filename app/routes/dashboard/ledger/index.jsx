import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useLoaderData, useParams } from "react-router";
import prisma from "~/utils/prismaClient";
import { endOfMonthUTC, startOfMonthUTC } from "~/utils/dateHelpers";
import {
  format,
  addDays,
  subMonths,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isDate,
} from "date-fns"; // Date manipulation
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover"; 
import { Calendar } from "~/components/ui/calendar"; 
import { Button } from "~/components/ui/button"; 
import { cn } from "~/lib/utils"; 
import { CategoryFilter } from "./filtersCategories";
import { FilterTags } from "./filterTags";
import { LedgerTable } from "./ledgerRow";
function getInitialDateRange() {
  const nowUTC = new Date();
  const nowForUTC = new Date(nowUTC.toISOString());
  return {
    startDate: startOfMonthUTC(nowForUTC),
    endDate: endOfMonthUTC(nowForUTC),
  };
}

const today = new Date();
const getRangeLastDays = (days) => {
  const end = new Date(today);
  const start = addDays(end, -days + 1);
  return { startDate: start, endDate: end };
};
const getRangeThisMonth = () => {
  const nowUTC = new Date();
  const nowForUTC = new Date(nowUTC.toISOString());
  return {
    startDate: startOfMonthUTC(nowForUTC),
    endDate: endOfMonthUTC(nowForUTC),
  };
};
const getRangeLastMonth = () => {
  const endOfLastMonth = addDays(startOfMonth(today), -1);
  const startOfLastMonth = startOfMonth(endOfLastMonth);
  // Ensure start and end are Date objects
  return { startDate: startOfLastMonth, endDate: endOfLastMonth };
};
const getRangeLast90Days = () => getRangeLastDays(90); // Reuse helper
const getRangeLastYear = () => {
  const endOfLastYear = endOfYear(subYears(today, 1));
  const startOfLastYear = startOfYear(subYears(today, 1));
  // Ensure start and end are Date objects
  return { startDate: startOfLastYear, endDate: endOfLastYear };
};

// Helper to format the displayed date range string
const formatRangeDisplay = (range) => {
  if (!range?.startDate) return "Select Date Range";
  // Use 'isDate' to check if it's a valid Date object before formatting
  const start = isDate(range.startDate)
    ? format(range.startDate, "LLL dd, y")
    : "Invalid Date";
  if (!range.endDate || !isDate(range.endDate)) return `${start} - ...`;
  const end = isDate(range.endDate)
    ? format(range.endDate, "LLL dd, y")
    : "Invalid Date";
  return `${start} - ${end}`;
};
// ------------------------------------------------------------------------------

export async function loader({ params }) {
  const thisMonthRange = getInitialDateRange();

  const teamId = Number(params.teamId);
  if (isNaN(teamId)) {
    console.error("Invalid teamId in loader params:", params.teamId);
    return {
      transactions: [],
      categories: [],
      tags: [],
      initialDateRange: thisMonthRange,
    };
  }

  const transactions = await prisma.ledger.findMany({
    select: {
      id: true,
      date: true,
      transactionTypeExtract: true,
      emailId: true,
      emailSubject: true,
      tags: {
        // Corrected select
        select: {
          tag: {
            select: {
              id: true,
              tag: true,
            },
          },
        },
      },
      amountExtract: true,
      categoryId: true,
      payeeExtract: true,
      category: {
        select: { id: true, colorCode: true, categoryName: true },
      },
      user: {
        select: { user: { select: { email: true, name: true } } },
      },
      source: {
        select: { sourceName: true },
      },
    },
    where: {
      user: { teamId: { equals: teamId } },
      status: { in: ["CREATED", "EXTRACTED", "MANUAL"] },
      date: { gte: thisMonthRange.startDate, lte: thisMonthRange.endDate },
    },
    orderBy: { date: "desc" },
  });

  const categories = await prisma.category.findMany({
    where: { teamId: { equals: teamId } },
    orderBy: { createdAt: "asc" },
  });

  const tags = await prisma.tag.findMany({
    where: { teamId: { equals: teamId } },
    orderBy: { createdAt: "asc" },
  });

  return { transactions, categories, tags, initialDateRange: thisMonthRange };
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const ledgerId = Number(formData.get("id"));

  const teamId = Number(params.teamId);
  if (isNaN(teamId)) {
    console.error("Invalid teamId in action params:", params.teamId);
    return new Response("Invalid team ID", { status: 400 });
  }

  const updateData = {
    edit: async () => {
      const {
        transactionTypeExtract,
        amountExtract,
        payeeExtract,
        categoryId,
      } = Object.fromEntries(formData);
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: {
          status: "MANUAL",
          transactionTypeExtract,
          categoryId: Number(categoryId),
          amountExtract: Number(amountExtract),
          payeeExtract,
        },
      });
    },
    ignore: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { status: "IGNORE" },
      }),
    income: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { transactionTypeExtract: "INCOME" },
      }),
    expense: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { transactionTypeExtract: "EXPENSE" },
      }),
    duplicate: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { status: "DUPLICATE" },
      }),
    junk: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { status: "JUNK" },
      }),
    updateTags: async () => {
      const tagIds = formData.getAll("tagIds").map(Number);
      const newTags = formData.getAll("newTags").filter(Boolean);
      await prisma.tagsOnLedgers.deleteMany({ where: { ledgerId: ledgerId } });

      const newTagPromises = newTags.map(async (tag) => {
        const existingTag = await prisma.tag.findFirst({
          where: { tag, teamId },
        });
        return existingTag
          ? existingTag.id
          : (await prisma.tag.create({ data: { tag, teamId } })).id;
      });

      const newTagIds = await Promise.all(newTagPromises);
      const allTagIds = [...tagIds, ...newTagIds];

      const createTagsOnLedgersPromises = allTagIds.map(async (tagId) => {
        await prisma.tagsOnLedgers.create({ data: { ledgerId, tagId } });
      });
      await Promise.all(createTagsOnLedgersPromises);
    },
  };

  if (updateData[intent]) {
    await updateData[intent]();
  }
  return new Response("OK", { status: 200 });
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

const fetchTransactionsFromServer = async (teamId, dateRange) => {
  try {
    // Ensure dateRange exists and dates are valid Date objects before toISOString
    const startDateString =
      dateRange?.startDate && isDate(dateRange.startDate)
        ? dateRange.startDate.toISOString()
        : "";
    const endDateString =
      dateRange?.endDate && isDate(dateRange.endDate)
        ? dateRange.endDate.toISOString()
        : "";

    if (!startDateString || !endDateString) {
      console.warn("Attempted fetch with invalid date range:", dateRange);
      // Depending on API, you might return [] or throw here if range is required
      // Assuming API needs valid range, throw or return empty result structure
      return { transactions: [] }; // Return empty if range is invalid
      // throw new Error("Invalid date range provided for fetch.");
    }

    const url = `/api/${teamId}/fetch-transactions/${startDateString}/${endDateString}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch transactions: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return data; // Expecting { transactions: [...] }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export default function Transactions() {
  const params = useParams();
  const teamId = params.teamId ? Number(params.teamId) : undefined;

  if (teamId === undefined || isNaN(teamId)) {
    console.error("Team ID is missing or invalid in URL");
    return <div>Error: Invalid Team ID.</div>;
  }

  const {
    transactions: initialTransactions,
    categories,
    tags,
    initialDateRange,
  } = useLoaderData();

  // State for the *actual* date range used for fetching/filtering
  const [transactionDates, setTransactionDates] = useState([initialDateRange]);

  // State for category and tag filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // State for the currently loaded transactions (based on transactionDates)
  const [transactions, setTransactions] = useState(initialTransactions || []);
  const [isLoading, setIsLoading] = useState(false);

  // State to control the Popover visibility
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // State for the date picker *within* the popover (temp selection)
  const [datePickerRange, setDatePickerRange] = useState({
    from: transactionDates[0]?.startDate,
    to: transactionDates[0]?.endDate,
  });

  // Sync internal date picker state when transactionDates changes externally (e.g., by preset buttons)
  useEffect(() => {
    setDatePickerRange({
      from: transactionDates[0]?.startDate,
      to: transactionDates[0]?.endDate,
    });
  }, [transactionDates]);

  const location = useLocation();
  const isInitialMount = useRef(true);

  // Sync filters from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    const tagParam = params.get("tag");

    if (categoryParam) {
      const categoryIds = categoryParam.split(",").map(Number);
      const initialSelectedCategories = categories.filter((cat) =>
        categoryIds.includes(cat.id)
      );
      setSelectedCategories(initialSelectedCategories);
    }
    if (tagParam) {
      const tagIds = tagParam.split(",").map(Number);
      const initialSelectedTags = tags.filter((tag) => tagIds.includes(tag.id));
      setSelectedTags(initialSelectedTags);
    }
  }, [location.search, categories, tags, teamId]);

  // Fetch transactions when transactionDates changes (client-side)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Skip initial fetch as loader data exists
      return;
    }

    // Only fetch if a valid date range and teamId are available
    if (
      !transactionDates?.[0]?.startDate ||
      !transactionDates?.[0]?.endDate ||
      !teamId ||
      isNaN(teamId)
    ) {
      // console.log("Skipping fetch due to incomplete date range or missing teamId");
      // Optionally clear transactions if range becomes invalid
      // setTransactions([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTransactionsFromServer(
          teamId,
          transactionDates[0]
        );
        // Validate fetched data
        if (data && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        } else {
          console.warn(
            "Fetched data did not contain a valid transactions array:",
            data
          );
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [transactionDates, teamId]); // Dependencies: Fetch when date range or teamId changes

  // Memoize filtered transactions (applies category/tag filters to the fetched data)
  const filteredTransactions = useMemo(() => {
    // Ensure transactions is an array
    let filtered = Array.isArray(transactions) ? transactions : [];

    // NOTE: Date filtering is primarily handled by the fetch useEffect now.
    // However, keeping the date filter here ensures initial loader data is
    // correctly filtered by the initialDateRange state if needed, and
    // acts as a safeguard if the 'transactions' state ever contains data
    // outside the currently selected date range.
    if (transactionDates.length > 0) {
      const dateRange = transactionDates[0];
      if (
        dateRange &&
        isDate(dateRange.startDate) &&
        isDate(dateRange.endDate)
      ) {
        filtered = filtered.filter((transaction) => {
          const transactionDate = transaction.date
            ? new Date(transaction.date)
            : null;
          return (
            transactionDate &&
            transactionDate >= dateRange.startDate &&
            transactionDate <= dateRange.endDate
          );
        });
      }
    }

    // Apply category filter (defensive check)
    if (selectedCategories.length > 0) {
      const selectedCategoryIds = new Set(
        Array.isArray(selectedCategories)
          ? selectedCategories.map((cat) => cat.id)
          : []
      );
      filtered = filtered.filter(
        (transaction) =>
          transaction.categoryId != null &&
          selectedCategoryIds.has(transaction.categoryId)
      );
    }

    // Apply tag filter (defensive checks)
    if (selectedTags.length > 0) {
      const selectedTagIds = new Set(
        Array.isArray(selectedTags) ? selectedTags.map((tag) => tag.id) : []
      );
      filtered = filtered.filter(
        (transaction) =>
          // Ensure transaction.tags is an array and check nested properties
          Array.isArray(transaction.tags) &&
          transaction.tags.some(
            (tagEntry) =>
              tagEntry && tagEntry.tag && selectedTagIds.has(tagEntry.tag.id)
          )
      );
    }

    return filtered;
  }, [transactions, selectedCategories, selectedTags, transactionDates]); // Include transactionDates in dependencies

  // --- Handlers for the Date Range Picker UI ---

  // Handler for clicking preset buttons
  const handlePresetClick = (range) => {
    setTransactionDates([range]); // Update the main state
    setIsPopoverOpen(false); // Close the popover
  };

  const handleDatePickerChange = (range) => {
    setDatePickerRange(range); // Update the internal picker state
    if (range?.from && range?.to) {
      setTransactionDates([{ startDate: range.from, endDate: range.to }]);
      setIsPopoverOpen(false); // Close after selection
    }
  };
  // ----------------------------------------------

  return (
    <div className="p-4">
      <div className="flex mb-4 justify-between items-start">
        <div className="flex justify-start items-start gap-x-2">
          <CategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />
          <FilterTags
            tags={tags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
        </div>
        <div className="flex items-center">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !transactionDates?.[0]?.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatRangeDisplay(transactionDates?.[0])}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-4 bg-white shadow-md rounded-md z-[120]"
              align="end"
            >
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handlePresetClick(getRangeLastDays(10))}
                  >
                    Last 10 Days
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handlePresetClick(getRangeThisMonth())}
                  >
                    This Month
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handlePresetClick(getRangeLastMonth())}
                  >
                    Last Month
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handlePresetClick(getRangeLast90Days())}
                  >
                    Last 90 Days
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handlePresetClick(getRangeLastYear())}
                  >
                    Last Year
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading && <p>Loading transactions...</p>}
      {!isLoading &&
        Array.isArray(filteredTransactions) &&
        filteredTransactions.length > 0 && (
          <LedgerTable
            transactions={filteredTransactions}
            categories={categories}
            tags={tags}
          />
        )}
      {!isLoading &&
        Array.isArray(filteredTransactions) &&
        filteredTransactions.length === 0 && (
          <p>No transactions found for the selected filters.</p>
        )}
      {!isLoading && !Array.isArray(filteredTransactions) && (
        <p>Error displaying transactions.</p>
      )}
    </div>
  );
}
