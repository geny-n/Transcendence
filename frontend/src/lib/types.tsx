import { z } from "zod"
import { PasswordRegex } from "./regex";

export const connexionForm = z.object({
  email: z.string().email({message: "Email invalide"}),
  password: z.string().min(10, "Mot de passe invalide")
});

export type T_connexionForm = z.infer<typeof connexionForm>;

export const inscriptionForm = z.object({
  email: z.string().email({message: "Email valide requis"}),
  password: z
  .string()
  .min(10, "minimum 10 characteres requis")
  .regex(PasswordRegex, "1 minuscule, 1 majuscule, 1 chiffre et 1 charactere special requis "),
  confirmPass: z.string()
}).refine(data => data.password === data.confirmPass, {
    message: "Les mots de passes doivent etre similaires",
    path: ["confirmPass"]
  })

export type T_inscriptionForm = z.infer<typeof inscriptionForm>;