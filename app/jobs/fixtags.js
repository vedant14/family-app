// fix_tags.js
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- Get arguments from command line ---
// process.argv[0] is node executable path
// process.argv[1] is the script path
const INCORRECT_TAG_NAME = process.argv[2];
const CORRECT_TAG_NAME = process.argv[3];
const teamIdArg = process.argv[4];
// --- End argument retrieval ---


async function main() {
    // --- Validate arguments ---
    if (!INCORRECT_TAG_NAME || !CORRECT_TAG_NAME || !teamIdArg) {
        console.error("Usage: node fix_tags.js <incorrectTagName> <correctTagName> <teamId>");
        console.error("Example: node fix_tags.js Goa goa 2");
        process.exit(1); // Exit with an error code
    }

    const TARGET_TEAM_ID = Number(teamIdArg);
    if (isNaN(TARGET_TEAM_ID)) {
        console.error(`Error: Invalid teamId provided: '${teamIdArg}'. Must be a number.`);
        process.exit(1);
    }
    // --- End validation ---


    console.log(`Starting tag merge for team ${TARGET_TEAM_ID}: "${INCORRECT_TAG_NAME}" -> "${CORRECT_TAG_NAME}"`);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const incorrectTag = await tx.tag.findUnique({
                where: { teamId_tag: { teamId: TARGET_TEAM_ID, tag: INCORRECT_TAG_NAME } },
            });

            if (!incorrectTag) {
                // Changed to throw an error to stop the transaction cleanly
                throw new Error(`Incorrect tag "${INCORRECT_TAG_NAME}" not found for team ${TARGET_TEAM_ID}. Aborting.`);
            }

            const correctTag = await tx.tag.upsert({
                where: { teamId_tag: { teamId: TARGET_TEAM_ID, tag: CORRECT_TAG_NAME } },
                create: { tag: CORRECT_TAG_NAME, teamId: TARGET_TEAM_ID },
                update: {},
            });

            console.log(`Found incorrect tag: ID ${incorrectTag.id} ("${INCORRECT_TAG_NAME}")`);
            console.log(`Found/Ensured correct tag: ID ${correctTag.id} ("${CORRECT_TAG_NAME}")`);

            if (incorrectTag.id === correctTag.id) {
                // Changed to throw an error to stop the transaction cleanly
                 throw new Error("Correct and incorrect tags are the same. Aborting.");
            }

            const incorrectLinks = await tx.tagsOnLedgers.findMany({
                where: { tagId: incorrectTag.id },
                select: { ledgerId: true }
            });
            const incorrectLedgerIds = incorrectLinks.map(link => link.ledgerId);

            const correctLinks = await tx.tagsOnLedgers.findMany({
                where: { tagId: correctTag.id, ledgerId: { in: incorrectLedgerIds } },
                select: { ledgerId: true }
            });
            const conflictingLedgerIds = new Set(correctLinks.map(link => link.ledgerId));

            console.log(`Found ${incorrectLedgerIds.length} ledgers linked to incorrect tag "${INCORRECT_TAG_NAME}".`);
            console.log(`Found ${conflictingLedgerIds.size} ledgers also linked to correct tag "${CORRECT_TAG_NAME}" (conflicts).`);

            let deletedLinksCount = 0;
            if (conflictingLedgerIds.size > 0) {
                const deleteResult = await tx.tagsOnLedgers.deleteMany({
                    where: {
                        tagId: incorrectTag.id,
                        ledgerId: { in: Array.from(conflictingLedgerIds) }
                    }
                });
                deletedLinksCount = deleteResult.count;
                console.log(`Deleted ${deletedLinksCount} conflicting link(s) for tag "${INCORRECT_TAG_NAME}".`);
            }

            const updateResult = await tx.tagsOnLedgers.updateMany({
                where: { tagId: incorrectTag.id },
                data: { tagId: correctTag.id }
            });
            console.log(`Updated ${updateResult.count} remaining link(s) from tag "${INCORRECT_TAG_NAME}" to "${CORRECT_TAG_NAME}".`);

            await tx.tag.delete({
                where: { id: incorrectTag.id },
            });
            console.log(`Deleted incorrect tag record: ID ${incorrectTag.id} ("${INCORRECT_TAG_NAME}")`);

            return {
                deletedIncorrectLinks: deletedLinksCount,
                updatedLinks: updateResult.count,
                deletedTagName: INCORRECT_TAG_NAME,
                finalTagName: CORRECT_TAG_NAME
            };

        }, {
             // timeout: 30000,
        });

        console.log("Tag merge process completed successfully.");
        console.log("Summary:", result);

    } catch (error) {
        console.error("Tag merge process failed:");
        // More specific error logging
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             console.error(`Prisma Error Code: ${error.code}`);
        }
        console.error(error.message); // Log the specific error message that aborted the transaction or occurred outside it
        process.exitCode = 1; // Set exit code to indicate failure
    } finally {
        await prisma.$disconnect();
    }
}

main();