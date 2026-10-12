import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'multihazard_local_predictions';

function getLocalPredictions() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setLocalPredictions(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Save a prediction to the database (or localStorage fallback).
 */
export async function savePrediction(predictionData) {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .insert([predictionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch {
    const localList = getLocalPredictions();
    const newRecord = {
      ...predictionData,
      id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString()
    };
    localList.unshift(newRecord);
    setLocalPredictions(localList);
    return newRecord;
  }
}

/**
 * Fetch all predictions for the current user, sorted by newest first.
 */
export async function getUserPredictions() {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch {
    return getLocalPredictions();
  }
}

/**
 * Delete a prediction by ID.
 */
export async function deletePrediction(id) {
  try {
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch {
    const localList = getLocalPredictions();
    const updated = localList.filter((item) => item.id !== id);
    setLocalPredictions(updated);
  }
}

