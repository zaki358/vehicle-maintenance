import { isRedirect } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { requireUser } from './require-user'

describe('requireUser', () => {
  it('ユーザーがいればそのまま返す', () => {
    const user = { id: 'user-1', email: 'owner@example.com' }

    expect(requireUser(user, '/vehicles')).toBe(user)
  })

  it('ユーザーが null なら /login へのリダイレクトを投げる', () => {
    expect.assertions(3)

    try {
      requireUser(null, '/vehicles')
    } catch (thrown) {
      expect(isRedirect(thrown)).toBe(true)
      const options = (thrown as { options: { to: string; search: { redirect: string } } }).options
      expect(options.to).toBe('/login')
      expect(options.search.redirect).toBe('/vehicles')
    }
  })
})
