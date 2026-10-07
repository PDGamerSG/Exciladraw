import assert from "node:assert/strict";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware, rateLimit } from "../src/middleware";
import { changePassword } from "../src/password";

test("password change verifies identity, validates replacements, hashes secrets and rejects stale requests", async (t) => {
    const original = "legacy";
    const replacement = "test-only river valley 73";
    let hash = await bcrypt.hash(original, 4);
    let writes = 0;
    const app = express();
    app.use(express.json());
    app.post("/me/password", middleware, rateLimit({ windowMs: 60_000, max: 20 }), changePassword({
        findHash: async (id) => id === "account-one" ? hash : null,
        replaceHash: async (id, previous, next) => {
            assert.equal(id, "account-one");
            if (hash !== previous) return false;
            hash = next;
            writes++;
            return true;
        },
    }));
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/me/password`;
    const token = jwt.sign({ userId: "account-one" }, JWT_SECRET, { expiresIn: "1m" });
    const post = (body: unknown, authorization = `Bearer ${token}`) => fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: authorization }, body: JSON.stringify(body),
    });
    try {
        await t.test("rejects missing and expired authentication before changing anything", async () => {
            assert.equal((await post({ currentPassword: original, newPassword: replacement }, "")).status, 403);
            const expired = jwt.sign({ userId: "account-one" }, JWT_SECRET, { expiresIn: -1 });
            assert.equal((await post({ currentPassword: original, newPassword: replacement }, `Bearer ${expired}`)).status, 403);
            assert.equal(writes, 0);
        });
        await t.test("rejects wrong current passwords, short passwords and bcrypt byte truncation", async () => {
            for (const body of [
                { currentPassword: "wrong", newPassword: replacement },
                { currentPassword: original, newPassword: "short" },
                { currentPassword: original, newPassword: "🌿".repeat(19) },
            ]) assert.equal((await post(body)).status, 400);
            assert.equal(writes, 0);
        });
        await t.test("updates only the signed-in account and stores a hash instead of the password", async () => {
            const response = await post({ userId: "another-account", currentPassword: original, newPassword: replacement });
            assert.equal(response.status, 200);
            assert.equal(writes, 1);
            assert.notEqual(hash, replacement);
            assert.equal(await bcrypt.compare(replacement, hash), true);
            assert.equal(await bcrypt.compare(original, hash), false);
            assert.ok(!(await response.text()).includes(hash));
            assert.equal((await post({ currentPassword: replacement, newPassword: replacement })).status, 400);
        });
        await t.test("only one concurrent request using the old password can succeed", async () => {
            const results = await Promise.all([
                post({ currentPassword: replacement, newPassword: "test-only forest trail 86" }),
                post({ currentPassword: replacement, newPassword: "test-only mountain lake 94" }),
            ]);
            assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
            assert.equal(writes, 2);
        });
        await t.test("limits repeated attempts", async () => {
            let status = 0;
            for (let i = 0; i < 22; i++) status = (await post({})).status;
            assert.equal(status, 429);
            assert.equal(writes, 2);
        });
    } finally {
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
});
