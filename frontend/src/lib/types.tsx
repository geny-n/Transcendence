import { z } from "zod"
import { PasswordRegex, ForbidenRegex } from "./regex";

export const connexionForm = z.object({
  email: z.string().email({message: "Email invalide"}),
  password: z.string().min(10, "Mot de passe invalide")
});

export type T_connexionForm = z.infer<typeof connexionForm>;

export const inscriptionForm = z.object({
  email: z.string().email({message: "Email valide requis"}),
  password: z
  .string()
  .min(10, "Ne peux contenir moins de 10 caracteres")
  .max(24, "Ne peux contenir plus de 24 caracteres")
  .regex(PasswordRegex, "Doit inclure minuscule, majuscule, chiffre et caractere special")
  .regex(ForbidenRegex, "Characteres speciaux autorises: !@#$%&*()_-+="),
  confirmPass: z.string()
}).refine(data => data.password === data.confirmPass, {
    message: "Les mots de passes doivent etre similaires",
    path: ["confirmPass"]
  })

export type T_inscriptionForm = z.infer<typeof inscriptionForm>;