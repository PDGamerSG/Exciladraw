"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { ChangePasswordSchema } from "@repo/common/types";
import { api, errorMessage } from "@/lib/api";
import { Modal } from "./ui/modal";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const pending = useRef(false);
    const close = useCallback(() => { if (!pending.current) onClose(); }, [onClose]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (pending.current) return;
        setError("");
        const parsed = ChangePasswordSchema.safeParse({ currentPassword, newPassword });
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your password details."); return; }
        if (newPassword !== confirmation) { setError("The new passwords do not match."); return; }
        pending.current = true;
        setSaving(true);
        try {
            await api.post("/me/password", parsed.data);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmation("");
            setDone(true);
        } catch (err) {
            setError(errorMessage(err, "Could not change your password. Try again."));
        } finally {
            pending.current = false;
            setSaving(false);
        }
    }

    return (
        <Modal open onClose={close} title="Change password" description={done ? undefined : "Use a unique password you haven’t used on another website."}
            className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            {done ? (
                <div>
                    <p role="status" className="flex items-start gap-3 text-sm leading-relaxed text-chalk-100">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-pen-green" />
                        Password changed. Update the saved password in your browser or password manager.
                    </p>
                    <button type="button" onClick={close} className="mt-6 h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary-hover">Done</button>
                </div>
            ) : (
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current password</Label>
                        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required maxLength={100}
                            value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New password</Label>
                        <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={72}
                            aria-describedby="new-password-hint" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={saving} />
                        <p id="new-password-hint" className="text-xs leading-relaxed text-chalk-500">At least 12 characters. A password manager can generate a strong, unique password for you.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm new password</Label>
                        <Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={72}
                            value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={saving} />
                    </div>
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    <button type="submit" disabled={saving} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? "Changing password…" : "Change password"}
                    </button>
                </form>
            )}
        </Modal>
    );
}
