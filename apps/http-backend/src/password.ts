import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { ChangePasswordSchema } from "@repo/common/types";

type PasswordStore = {
    findHash: (userId: string) => Promise<string | null>;
    replaceHash: (userId: string, previousHash: string, nextHash: string) => Promise<boolean>;
};

/** The authenticated user can change only their own password after rechecking it. */
export function changePassword(store: PasswordStore) {
    return async (req: Request, res: Response) => {
        if (!req.userId) return res.status(401).json({ message: "Sign in before changing your password." });
        const parsed = ChangePasswordSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Check your password details." });

        const hash = await store.findHash(req.userId);
        if (!hash) return res.status(401).json({ message: "Sign in again before changing your password." });
        if (!(await bcrypt.compare(parsed.data.currentPassword, hash))) {
            return res.status(400).json({ message: "Your current password is incorrect." });
        }
        if (await bcrypt.compare(parsed.data.newPassword, hash)) {
            return res.status(400).json({ message: "Choose a different password from your current one." });
        }
        const nextHash = await bcrypt.hash(parsed.data.newPassword, 12);
        // Compare-and-swap prevents a second simultaneous request using the old
        // password from overwriting a change that has already succeeded.
        if (!(await store.replaceHash(req.userId, hash, nextHash))) {
            return res.status(409).json({ message: "Your password has already changed. Try again with the current password." });
        }
        return res.json({ message: "Password changed. Update the saved password in your password manager." });
    };
}
