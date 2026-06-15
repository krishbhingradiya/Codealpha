/**
 * ============================================
 * ShortLink Pro — URL Model (Data Access Layer)
 * ============================================
 */

const { supabase } = require('../config/database');
const TABLE = 'urls';

async function create(urlData) {
  const { data, error } = await supabase.from(TABLE).insert([urlData]).select().single();
  if (error) throw error;
  return data;
}

async function findByShortCode(shortCode) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('short_code', shortCode).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function findById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function findAll(userId, limit = 10, offset = 0, sort = 'created_at_desc', filter = 'all') {
  let queryBuilder = supabase.from(TABLE).select('*', { count: 'exact' }).eq('user_id', userId);

  // Apply filters
  const now = new Date().toISOString();
  if (filter === 'active') {
    queryBuilder = queryBuilder.eq('is_active', true).or(`expires_at.gt.${now},expires_at.is.null`);
  } else if (filter === 'expired') {
    queryBuilder = queryBuilder.lte('expires_at', now);
  } else if (filter === 'inactive') {
    queryBuilder = queryBuilder.eq('is_active', false);
  }

  // Parse sorting option
  let sortField = 'created_at';
  let ascending = false;
  if (sort === 'created_at_asc') {
    sortField = 'created_at';
    ascending = true;
  } else if (sort === 'click_count_desc') {
    sortField = 'click_count';
    ascending = false;
  } else if (sort === 'click_count_asc') {
    sortField = 'click_count';
    ascending = true;
  } else if (sort === 'short_code_asc') {
    sortField = 'short_code';
    ascending = true;
  } else if (sort === 'short_code_desc') {
    sortField = 'short_code';
    ascending = false;
  }

  const { data, error, count } = await queryBuilder
    .order(sortField, { ascending })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

async function update(id, updates) {
  const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function remove(id) {
  const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function incrementClickCount(id) {
  const { data: current, error: fetchError } = await supabase
    .from(TABLE).select('click_count').eq('id', id).single();
  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from(TABLE)
    .update({ click_count: (current.click_count || 0) + 1, last_visited: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function search(userId, query, limit = 10, offset = 0, sort = 'created_at_desc', filter = 'all') {
  const searchTerm = `%${query}%`;
  let queryBuilder = supabase.from(TABLE).select('*', { count: 'exact' })
    .eq('user_id', userId)
    .or(`original_url.ilike.${searchTerm},short_code.ilike.${searchTerm}`);

  // Apply filters
  const now = new Date().toISOString();
  if (filter === 'active') {
    queryBuilder = queryBuilder.eq('is_active', true).or(`expires_at.gt.${now},expires_at.is.null`);
  } else if (filter === 'expired') {
    queryBuilder = queryBuilder.lte('expires_at', now);
  } else if (filter === 'inactive') {
    queryBuilder = queryBuilder.eq('is_active', false);
  }

  // Parse sorting option
  let sortField = 'created_at';
  let ascending = false;
  if (sort === 'created_at_asc') {
    sortField = 'created_at';
    ascending = true;
  } else if (sort === 'click_count_desc') {
    sortField = 'click_count';
    ascending = false;
  } else if (sort === 'click_count_asc') {
    sortField = 'click_count';
    ascending = true;
  } else if (sort === 'short_code_asc') {
    sortField = 'short_code';
    ascending = true;
  } else if (sort === 'short_code_desc') {
    sortField = 'short_code';
    ascending = false;
  }

  const { data, error, count } = await queryBuilder
    .order(sortField, { ascending })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

async function shortCodeExists(shortCode) {
  const { data, error } = await supabase.from(TABLE).select('id').eq('short_code', shortCode).single();
  if (error && error.code === 'PGRST116') return false;
  if (error) throw error;
  return !!data;
}

module.exports = {
  create, findByShortCode, findById, findAll,
  update, remove, incrementClickCount, search, shortCodeExists,
};
