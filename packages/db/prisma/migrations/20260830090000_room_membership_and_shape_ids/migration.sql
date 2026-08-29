-- Room invite codes. Added nullable first so existing rooms can be backfilled
-- with a code before the NOT NULL constraint goes on.
ALTER TABLE "Room" ADD COLUMN "inviteCode" TEXT;
UPDATE "Room" SET "inviteCode" = gen_random_uuid()::text WHERE "inviteCode" IS NULL;
ALTER TABLE "Room" ALTER COLUMN "inviteCode" SET NOT NULL;

-- AlterTable. Shapes drawn before this migration have no id inside their JSON,
-- so each existing row is given one here — the client reads the id off the row
-- and can then select, move or erase an old shape like any other.
ALTER TABLE "Chat" ADD COLUMN "shapeId" TEXT;
ALTER TABLE "Chat" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Chat" SET "shapeId" = gen_random_uuid()::text WHERE "shapeId" IS NULL;

-- CreateTable
CREATE TABLE "RoomMember" (
    "roomId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("roomId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_inviteCode_key" ON "Room"("inviteCode");
CREATE INDEX "RoomMember_userId_idx" ON "RoomMember"("userId");
CREATE INDEX "Chat_roomId_id_idx" ON "Chat"("roomId", "id");
CREATE UNIQUE INDEX "Chat_roomId_shapeId_key" ON "Chat"("roomId", "shapeId");

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rooms and chats now cascade, so deleting a room cleans up after itself
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_roomId_fkey";
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Everyone who already owns a room is a member of it
INSERT INTO "RoomMember" ("roomId", "userId")
SELECT "id", "adminId" FROM "Room"
ON CONFLICT DO NOTHING;
