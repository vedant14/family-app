import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { parseCookies } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";
import { endOfMonthUTC, startOfMonthUTC } from "~/utils/dateHelpers";
import { useDialogStore } from "~/utils/store";
import { LedgerTable } from "./ledger/ledgerRow";
import { CategoryFilter } from "./ledger/filtersCategories";
import { FilterTags } from "./ledger/filterTags";

export async function loader({ params }) {
  const nowUTC = new Date(); // This will be in the server's local timezone initially
  const nowForUTC = new Date(nowUTC.toISOString()); // Convert to a UTC Date object

  const thisMonthRange = {
    gte: startOfMonthUTC(nowForUTC),
    lte: endOfMonthUTC(nowForUTC),
  };

  const transactions = await prisma.ledger.findMany({
    select: {
      id: true,
      date: true,
      transactionTypeExtract: true,
      emailId: true,
      emailSubject: true,
      tags: {
        select: {
          tag: true,
        },
      },
      amountExtract: true,
      categoryId: true,
      payeeExtract: true,
      category: {
        select: {
          id: true,
          colorCode: true,
          categoryName: true,
        },
      },
      user: {
        select: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
      source: {
        select: {
          sourceName: true,
        },
      },
    },
    where: {
      user: {
        teamId: {
          equals: Number(params.teamId),
        },
      },
      status: {
        in: ["CREATED", "EXTRACTED", "MANUAL"],
      },
      date: thisMonthRange,
    },
    orderBy: {
      date: "desc",
    },
  });
  const categories = await prisma.category.findMany({
    where: {
      teamId: {
        equals: Number(params.teamId),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const tags = await prisma.tag.findMany({
    where: {
      teamId: {
        equals: Number(params.teamId),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return { transactions, categories, tags };
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const ledgerId = Number(formData.get("id"));
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

      const teamId = Number(params.teamId);
      await prisma.tagsOnLedgers.deleteMany({
        where: {
          ledgerId: ledgerId,
        },
      });

      const newTagPromises = newTags.map(async (tag) => {
        const existingTag = await prisma.tag.findFirst({
          where: { tag, teamId },
        });
        if (existingTag) {
          return existingTag.id;
        } else {
          const createdTag = await prisma.tag.create({
            data: { tag, teamId },
          });
          return createdTag.id;
        }
      });

      const newTagIds = await Promise.all(newTagPromises);
      const allTagIds = [...tagIds, ...newTagIds];

      // Create new TagsOnLedgers entries
      const createTagsOnLedgersPromises = allTagIds.map(async (tagId) => {
        await prisma.tagsOnLedgers.create({
          data: { ledgerId, tagId },
        });
      });

      await Promise.all(createTagsOnLedgersPromises);
    },
  };

  if (updateData[intent]) {
    await updateData[intent]();
  }
}
export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Transactions({ loaderData }) {
  const { transactions, categories, tags } = loaderData;
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredTransactions, setFilteredTransactions] =
    useState(transactions);
  const location = useLocation();
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
  }, [location.search, categories, tags]);

  useEffect(() => {
    let filtered = transactions;

    if (selectedCategories.length > 0) {
      const selectedCategoryIds = new Set(
        selectedCategories.map((cat) => cat.id)
      );
      filtered = filtered.filter((transaction) =>
        selectedCategoryIds.has(transaction.categoryId)
      );
    }

    if (selectedTags.length > 0) {
      const selectedTagIds = new Set(selectedTags.map((tag) => tag.id));
      filtered = filtered.filter((transaction) =>
        transaction.tags.some((tag) => selectedTagIds.has(tag.tag.id))
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedCategories, selectedTags]);

  return (
    <div>
      <div className="flex mb-4 justify-start items-start gap-x-2">
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
      <LedgerTable
        transactions={transactions}
        filteredTransactions={filteredTransactions}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
