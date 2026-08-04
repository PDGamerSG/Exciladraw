import {z} from "zod";

// the sign in / sign up form collects an email address, and it is stored as
// the user's email — a 20 character cap rejected most real addresses
const email = z.email().max(255);
const password = z.string().min(6).max(100);

export const CreateUserSchema = z.object({
    username: email,
    password,
    name: z.string().min(1).max(50)
})

export const SigninSchema = z.object({
    username: email,
    password: z.string()
})
export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20)
})
