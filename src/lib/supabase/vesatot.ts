/**
 * שירותי API לניהול אירועי וסת
 */

import { supabase } from './client';
import { VesetEvent, HefsekhTahara, VesetHistory } from '@/types';

/**
 * הוספת אירוע וסת חדש
 */
export async function addVesetEvent(
  userId: string,
  date: Date,
  time: string | undefined,
  onah: 'day' | 'night',
  notes?: string
): Promise<VesetEvent> {
  const { data, error } = await (supabase
    .from('veset_events') as any)
    .insert({
      user_id: userId,
      event_date: date.toISOString().split('T')[0],
      event_time: time || null,
      onah,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding veset event:', error);
    throw new Error('Failed to add veset event');
  }

  return {
    id: data.id,
    userId: data.user_id,
    date: new Date(data.event_date),
    time: data.event_time || undefined,
    onah: data.onah as 'day' | 'night',
    notes: data.notes || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * קבלת כל אירועי הווסת של משתמש
 */
export async function getUserVesetEvents(
  userId: string
): Promise<VesetEvent[]> {
  const { data, error } = await (supabase
    .from('veset_events') as any)
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching veset events:', error);
    throw new Error('Failed to fetch veset events');
  }

  return data.map((event: any) => ({
    id: event.id,
    userId: event.user_id,
    date: new Date(event.event_date),
    time: event.event_time || undefined,
    onah: event.onah as 'day' | 'night',
    notes: event.notes || undefined,
    createdAt: new Date(event.created_at),
    updatedAt: new Date(event.updated_at),
  }));
}

/**
 * מחיקת אירוע וסת
 */
export async function deleteVesetEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('veset_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting veset event:', error);
    throw new Error('Failed to delete veset event');
  }
}

/**
 * הוספת הפסק טהרה
 */
export async function addHefsekhTahara(
  userId: string,
  vesetEventId: string,
  date: Date,
  time: string | undefined,
  onah: 'day' | 'night'
): Promise<HefsekhTahara> {
  const { data, error } = await (supabase
    .from('hefsek_tahara') as any)
    .insert({
      user_id: userId,
      veset_event_id: vesetEventId,
      hefsek_date: date.toISOString().split('T')[0],
      hefsek_time: time || null,
      onah,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding hefsek tahara:', error);
    throw new Error('Failed to add hefsek tahara');
  }

  return {
    id: data.id,
    userId: data.user_id,
    vesetEventId: data.veset_event_id,
    date: new Date(data.hefsek_date),
    time: data.hefsek_time || undefined,
    onah: data.onah as 'day' | 'night',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * קבלת כל הפסקי הטהרה של משתמש
 */
export async function getUserHefsekhTahara(
  userId: string
): Promise<HefsekhTahara[]> {
  const { data, error } = await (supabase
    .from('hefsek_tahara') as any)
    .select('*')
    .eq('user_id', userId)
    .order('hefsek_date', { ascending: false });

  if (error) {
    console.error('Error fetching hefsek tahara:', error);
    throw new Error('Failed to fetch hefsek tahara');
  }

  return data.map((hefsek: any) => ({
    id: hefsek.id,
    userId: hefsek.user_id,
    vesetEventId: hefsek.veset_event_id,
    date: new Date(hefsek.hefsek_date),
    time: hefsek.hefsek_time || undefined,
    onah: hefsek.onah as 'day' | 'night',
    createdAt: new Date(hefsek.created_at),
    updatedAt: new Date(hefsek.updated_at),
  }));
}

/**
 * קבלת כל ההיסטוריה של משתמש
 */
export async function getUserHistory(userId: string): Promise<VesetHistory> {
  const [events, hefsekhTaharot] = await Promise.all([
    getUserVesetEvents(userId),
    getUserHefsekhTahara(userId),
  ]);

  return {
    events,
    hefsekhTaharot,
  };
}

/**
 * עדכון אירוע וסת
 */
export async function updateVesetEvent(
  eventId: string,
  updates: {
    date?: Date;
    time?: string;
    onah?: 'day' | 'night';
    notes?: string;
  }
): Promise<VesetEvent> {
  const updateData: any = {};

  if (updates.date) {
    updateData.event_date = updates.date.toISOString().split('T')[0];
  }
  if (updates.time !== undefined) {
    updateData.event_time = updates.time || null;
  }
  if (updates.onah) {
    updateData.onah = updates.onah;
  }
  if (updates.notes !== undefined) {
    updateData.notes = updates.notes || null;
  }

  const { data, error } = await (supabase
    .from('veset_events') as any)
    .update(updateData)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating veset event:', error);
    throw new Error('Failed to update veset event');
  }

  return {
    id: data.id,
    userId: data.user_id,
    date: new Date(data.event_date),
    time: data.event_time || undefined,
    onah: data.onah as 'day' | 'night',
    notes: data.notes || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * קבלת אירוע וסת אחרון
 */
export async function getLatestVesetEvent(
  userId: string
): Promise<VesetEvent | null> {
  const { data, error } = await (supabase
    .from('veset_events') as any)
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching latest veset event:', error);
    throw new Error('Failed to fetch latest veset event');
  }

  return {
    id: data.id,
    userId: data.user_id,
    date: new Date(data.event_date),
    time: data.event_time || undefined,
    onah: data.onah as 'day' | 'night',
    notes: data.notes || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
