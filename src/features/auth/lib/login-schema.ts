import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'メールアドレスを入力してください')
    .email({ error: 'メールアドレスの形式が正しくありません' }),
  password: z.string().min(1, 'パスワードを入力してください'),
})

export type LoginInput = z.infer<typeof loginSchema>
