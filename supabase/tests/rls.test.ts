import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  createAdminClient,
  createAnonClient,
  deleteTestUser,
  provisionTestUser,
} from './support/test-clients'
import type { TestUser } from './support/test-clients'

/**
 * vehicles / maintenance_records の RLS を、開発用 Supabase プロジェクトに対して
 * 直接検証する統合テスト。Docker を使わない方針のため、ローカルの Postgres ではなく
 * 実際のネットワーク越しに実行する。`npm test` には含めず `npm run test:rls` で
 * 明示的に実行する(secret key が必要・実ネットワーク通信を伴うため)。
 */
describe('RLS: vehicles / maintenance_records', () => {
  const admin: SupabaseClient = createAdminClient()
  let userA: TestUser
  let userB: TestUser

  beforeAll(async () => {
    userA = await provisionTestUser(admin, 'a')
    userB = await provisionTestUser(admin, 'b')
  })

  afterAll(async () => {
    await deleteTestUser(admin, userA.id)
    await deleteTestUser(admin, userB.id)
  })

  it('自分の車両は取得でき、他人からは空で返る', async () => {
    const { data: vehicle, error: insertError } = await userA.client
      .from('vehicles')
      .insert({ name: 'Aの車', vehicle_type: 'car' })
      .select()
      .single()

    expect(insertError).toBeNull()
    expect(vehicle?.user_id).toBe(userA.id)

    const { data: ownView, error: ownError } = await userA.client
      .from('vehicles')
      .select()
      .eq('id', vehicle!.id)

    expect(ownError).toBeNull()
    expect(ownView).toHaveLength(1)

    const { data: otherView, error: otherError } = await userB.client
      .from('vehicles')
      .select()
      .eq('id', vehicle!.id)

    // 権限自体はあるので「拒否エラー」にはならず、RLS が対象行を除外して0件で返る。
    expect(otherError).toBeNull()
    expect(otherView).toHaveLength(0)
  })

  it('自分の車両のuser_idを他人に書き換えて譲渡できない(WITH CHECK)', async () => {
    const { data: vehicle } = await userA.client
      .from('vehicles')
      .insert({ name: 'Aの車(譲渡テスト用)', vehicle_type: 'car' })
      .select()
      .single()

    const { data: updated, error } = await userA.client
      .from('vehicles')
      .update({ user_id: userB.id })
      .eq('id', vehicle!.id)
      .select()

    // using は自分の行なので通るが、更新後の行が自分のものでなくなるため
    // with check に弾かれてエラーになる。
    expect(error).not.toBeNull()
    expect(updated).toBeNull()

    const { data: stillOwned } = await userA.client
      .from('vehicles')
      .select()
      .eq('id', vehicle!.id)
      .single()
    expect(stillOwned?.user_id).toBe(userA.id)
  })

  it('他人のvehicle_idを使って自分名義の記録を挿入できない(複合FK)', async () => {
    const { data: bVehicle } = await userB.client
      .from('vehicles')
      .insert({ name: 'Bの車', vehicle_type: 'car' })
      .select()
      .single()

    const { data: record, error } = await userA.client.from('maintenance_records').insert({
      vehicle_id: bVehicle!.id,
      performed_on: '2026-01-01',
      work_type: 'engine_oil',
    })

    // RLSのINSERTポリシー自体はuser_id=自分なので通るが、
    // (vehicle_id, user_id) の複合外部キーがBの車両とAのuser_idの組み合わせを
    // 拒否するため、外部キー違反でエラーになる。
    expect(error).not.toBeNull()
    expect(record).toBeNull()
  })

  it('自分の整備記録のvehicle_idを他人の車両IDに書き換えられない(複合FK・UPDATE経由)', async () => {
    const { data: aVehicle } = await userA.client
      .from('vehicles')
      .insert({ name: 'Aの車(UPDATE FKテスト用)', vehicle_type: 'car' })
      .select()
      .single()
    const { data: bVehicle } = await userB.client
      .from('vehicles')
      .insert({ name: 'Bの車(UPDATE FKテスト用)', vehicle_type: 'car' })
      .select()
      .single()
    const { data: record } = await userA.client
      .from('maintenance_records')
      .insert({ vehicle_id: aVehicle!.id, performed_on: '2026-01-01', work_type: 'engine_oil' })
      .select()
      .single()

    const { data: updated, error } = await userA.client
      .from('maintenance_records')
      .update({ vehicle_id: bVehicle!.id })
      .eq('id', record!.id)
      .select()

    // INSERT時と同じ複合FKがUPDATEでも効くため、Bの車両IDへの付け替えは拒否される。
    expect(error).not.toBeNull()
    expect(updated).toBeNull()
  })

  it('自分の整備記録のuser_idを他人に書き換えて譲渡できない(WITH CHECK)', async () => {
    const { data: vehicle } = await userA.client
      .from('vehicles')
      .insert({ name: 'Aの車(記録譲渡テスト用)', vehicle_type: 'car' })
      .select()
      .single()
    const { data: record } = await userA.client
      .from('maintenance_records')
      .insert({ vehicle_id: vehicle!.id, performed_on: '2026-01-01', work_type: 'tire' })
      .select()
      .single()

    const { data: updated, error } = await userA.client
      .from('maintenance_records')
      .update({ user_id: userB.id })
      .eq('id', record!.id)
      .select()

    // vehicles と同じ理由: using は自分の行なので通るが、更新後の行が
    // 自分のものでなくなるため with check に弾かれてエラーになる。
    expect(error).not.toBeNull()
    expect(updated).toBeNull()

    const { data: stillOwned } = await userA.client
      .from('maintenance_records')
      .select()
      .eq('id', record!.id)
      .single()
    expect(stillOwned?.user_id).toBe(userA.id)
  })

  it('complete_shaken: 自分の車両なら整備記録の追加と満了日更新が1回のRPCで両方反映される', async () => {
    const { data: vehicle } = await userA.client
      .from('vehicles')
      .insert({ name: 'Aの車(車検RPCテスト用)', vehicle_type: 'car', shaken_expiry_date: '2026-01-01' })
      .select()
      .single()

    const { data: result, error } = await userA.client.rpc('complete_shaken', {
      p_vehicle_id: vehicle!.id,
      p_performed_on: '2026-01-01',
      p_new_expiry_date: '2028-01-01',
      p_odometer_km: 12345,
    })

    expect(error).toBeNull()
    expect(result?.work_type).toBe('shaken')
    expect(result?.vehicle_id).toBe(vehicle!.id)

    const { data: updatedVehicle } = await userA.client
      .from('vehicles')
      .select('shaken_expiry_date')
      .eq('id', vehicle!.id)
      .single()
    expect(updatedVehicle?.shaken_expiry_date).toBe('2028-01-01')
  })

  it('complete_shaken: 他人の車両IDを渡すと拒否され、記録も満了日もどちらも変化しない', async () => {
    const { data: bVehicle } = await userB.client
      .from('vehicles')
      .insert({ name: 'Bの車(車検RPC拒否テスト用)', vehicle_type: 'car', shaken_expiry_date: '2026-01-01' })
      .select()
      .single()

    const { data: result, error } = await userA.client.rpc('complete_shaken', {
      p_vehicle_id: bVehicle!.id,
      p_performed_on: '2026-01-01',
      p_new_expiry_date: '2028-01-01',
    })

    expect(error).not.toBeNull()
    expect(result).toBeNull()
    // 2026-09-19のマイグレーション(insertより前に所有権チェックを追加)適用後は、
    // 複合FK違反の生メッセージではなく、意図したメッセージで拒否されるはず。
    expect(error?.message).toContain('vehicle not found or not owned by current user')

    const { data: untouchedVehicle } = await userB.client
      .from('vehicles')
      .select('shaken_expiry_date')
      .eq('id', bVehicle!.id)
      .single()
    expect(untouchedVehicle?.shaken_expiry_date).toBe('2026-01-01')
  })

  it('未ログイン(anon)は両テーブルとも拒否される', async () => {
    const anon = createAnonClient()

    const { data: vehiclesData, error: vehiclesError } = await anon.from('vehicles').select()
    expect(vehiclesError).not.toBeNull()
    expect(vehiclesData).toBeNull()

    const { data: recordsData, error: recordsError } = await anon
      .from('maintenance_records')
      .select()
    expect(recordsError).not.toBeNull()
    expect(recordsData).toBeNull()
  })

  it('車両を削除すると整備記録もカスケード削除される', async () => {
    const { data: vehicle } = await userA.client
      .from('vehicles')
      .insert({ name: 'Aの車(削除テスト用)', vehicle_type: 'car' })
      .select()
      .single()

    await userA.client.from('maintenance_records').insert({
      vehicle_id: vehicle!.id,
      performed_on: '2026-01-01',
      work_type: 'tire',
    })

    const { error: deleteError } = await userA.client
      .from('vehicles')
      .delete()
      .eq('id', vehicle!.id)
    expect(deleteError).toBeNull()

    const { data: remaining } = await userA.client
      .from('maintenance_records')
      .select()
      .eq('vehicle_id', vehicle!.id)
    expect(remaining).toHaveLength(0)
  })
})
