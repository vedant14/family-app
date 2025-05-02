// fix_tag_case.ts
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// --- Configuration ---
const TARGET_TEAM_ID = 2; // <--- Set the correct teamId here
const INCORRECT_TAG_NAME = "as";
const CORRECT_TAG_NAME = "VEDANT";
// --- End Configuration ---

async function main() {
  console.log(
    `Starting tag merge for team ${TARGET_TEAM_ID}: "${INCORRECT_TAG_NAME}" -> "${CORRECT_TAG_NAME}"`
  );

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Step 1 & 2: Find tags, handle missing ones
        const incorrectTag = await tx.tag.findUnique({
          where: {
            teamId_tag: { teamId: TARGET_TEAM_ID, tag: INCORRECT_TAG_NAME },
          },
        });

        if (!incorrectTag) {
          console.log(
            `Incorrect tag "${INCORRECT_TAG_NAME}" not found for team ${TARGET_TEAM_ID}. Nothing to do.`
          );
          // Returning null or a specific message to indicate no action needed
          return { message: "Incorrect tag not found, no changes made." };
        }

        // Find or create the correct tag (upsert ensures it exists)
        const correctTag = await tx.tag.upsert({
          where: {
            teamId_tag: { teamId: TARGET_TEAM_ID, tag: CORRECT_TAG_NAME },
          },
          create: { tag: CORRECT_TAG_NAME, teamId: TARGET_TEAM_ID },
          update: {}, // No update needed if found
        });

        console.log(
          `Found incorrect tag: ID ${incorrectTag.id} ("${INCORRECT_TAG_NAME}")`
        );
        console.log(
          `Found/Ensured correct tag: ID ${correctTag.id} ("${CORRECT_TAG_NAME}")`
        );

        if (incorrectTag.id === correctTag.id) {
          console.log(
            "Correct and incorrect tags are the same. No action needed."
          );
          return { message: "Tags are already the same." };
        }

        // Step 3: Identify conflicting links (Ledgers linked to both)
        // Find ledgerIds linked to the INCORRECT tag
        const incorrectLinks = await tx.tagsOnLedgers.findMany({
          where: { tagId: incorrectTag.id },
          select: { ledgerId: true },
        });
        const incorrectLedgerIds = incorrectLinks.map((link) => link.ledgerId);

        // Find ledgerIds linked to the CORRECT tag
        const correctLinks = await tx.tagsOnLedgers.findMany({
          where: { tagId: correctTag.id, ledgerId: { in: incorrectLedgerIds } }, // Optimization: only check ledgers already linked to incorrect tag
          select: { ledgerId: true },
        });
        const conflictingLedgerIds = new Set(
          correctLinks.map((link) => link.ledgerId)
        ); // Use a Set for efficient lookup

        console.log(
          `Found ${incorrectLedgerIds.length} ledgers linked to incorrect tag "${INCORRECT_TAG_NAME}".`
        );
        console.log(
          `Found ${conflictingLedgerIds.size} ledgers also linked to correct tag "${CORRECT_TAG_NAME}" (conflicts).`
        );

        // Step 4: Delete conflicting "Goa" links
        let deletedLinksCount = 0;
        if (conflictingLedgerIds.size > 0) {
          const deleteResult = await tx.tagsOnLedgers.deleteMany({
            where: {
              tagId: incorrectTag.id,
              ledgerId: { in: Array.from(conflictingLedgerIds) }, // Convert Set to Array
            },
          });
          deletedLinksCount = deleteResult.count;
          console.log(
            `Deleted ${deletedLinksCount} conflicting link(s) for tag "${INCORRECT_TAG_NAME}".`
          );
        }

        // Step 5: Update remaining "Goa" links to point to "goa"
        const updateResult = await tx.tagsOnLedgers.updateMany({
          where: {
            tagId: incorrectTag.id,
            // Avoid updating ledgers we just deleted links for (optional, but safer)
            // ledgerId: { notIn: Array.from(conflictingLedgerIds) }
            // More simply, just update where tagId matches, SQL should handle the rest
          },
          data: {
            tagId: correctTag.id, // Change tagId to the correct one
          },
        });
        console.log(
          `Updated ${updateResult.count} remaining link(s) from tag "${INCORRECT_TAG_NAME}" to "${CORRECT_TAG_NAME}".`
        );

        // Step 6: Delete the "Goa" tag record
        await tx.tag.delete({
          where: { id: incorrectTag.id },
        });
        console.log(
          `Deleted incorrect tag record: ID ${incorrectTag.id} ("${INCORRECT_TAG_NAME}")`
        );

        // Return summary from transaction
        return {
          deletedIncorrectLinks: deletedLinksCount,
          updatedLinks: updateResult.count,
          deletedTagName: INCORRECT_TAG_NAME,
          finalTagName: CORRECT_TAG_NAME,
        };
      },
      {
        // Optional: Adjust transaction timeout if needed for large operations
        // timeout: 30000, // milliseconds
      }
    );

    console.log("Tag merge process completed successfully.");
    console.log("Summary:", result);
  } catch (error) {
    console.error("Tag merge process failed:", error);
    // Specific error handling if needed
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Prisma Error Code: ${error.code}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
