package com.sea2709.learnenglish.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

class SettingsRepository(private val context: Context) {
    val apiKey: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[API_KEY] ?: ""
    }

    suspend fun saveApiKey(value: String) {
        context.dataStore.edit { preferences ->
            preferences[API_KEY] = value.trim()
        }
    }

    companion object {
        private val API_KEY = stringPreferencesKey("openai_api_key")
    }
}
