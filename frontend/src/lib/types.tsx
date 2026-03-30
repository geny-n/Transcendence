import { z } from "zod"
import { PasswordRegex, ForbidenRegex, UserNameRegex } from "./regex";
import type { TFunction } from "i18next";

export const connexionForm = (t: TFunction) => z.object({
  email: z.string().email({message: t('types.connexion.email')}),
  password: z
  .string()
  .min(10, t('types.connexion.mdp'))
  .max(24, t('types.connexion.mdp'))
  .regex(PasswordRegex, t('types.connexion.mdp'))
  .regex(ForbidenRegex, t('types.connexion.mdp'))
});

export type T_connexionForm = z.infer<ReturnType<typeof connexionForm>>;

export const inscriptionForm = (t: TFunction) => z.object({
  username : z
  .string()
  .min(3, t('types.min.3'))
  .max(24, t('types.max.24'))
  .regex(UserNameRegex, t('types.allowed_chars')),
  email: z
  .string()
  .email({message: t('types.email')}),
  password: z
  .string()
  .min(10, t('types.min.10'))
  .max(24, t('types.max.24'))
  .regex(PasswordRegex, t('types.mdp.char'))
  .regex(ForbidenRegex, t('types.mdp.allow')),
  confirmPass: z.string()
}).refine(data => data.password === data.confirmPass, {
    message: t('types.inscription.mdp.similar'),
    path: ["confirmPass"]
  })

export type T_inscriptionForm = z.infer<ReturnType<typeof inscriptionForm>>;


export const updateForm = (t: TFunction) => z.object({
  username : z
  .string()
  .min(3, t('types.min.3'))
  .max(24, t('types.max.24'))
  .regex(UserNameRegex, t('types.allowed_chars'))
  .optional().or(z.literal('')),
  email: z
  .string()
  .email({message: t('types.email')})
  .optional().or(z.literal('')),
  currentPassword: z.string().optional().or(z.literal('')),
  newPassword: z
  .string()
  .min(10, t('types.min.10'))
  .max(24, t('types.max.24'))
  .regex(PasswordRegex, t('types.mdp.char'))
  .regex(ForbidenRegex, t('types.mdp.allow'))
  .optional().or(z.literal('')),
});

export type T_updateForm = z.infer<ReturnType<typeof updateForm>>;
 