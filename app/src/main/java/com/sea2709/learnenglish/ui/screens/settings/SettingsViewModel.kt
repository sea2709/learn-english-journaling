package com.sea2709.learnenglish.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.sea2709.learnenglish.data.preferences.SettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsUiState(
    val apiKey: String = "",
    val isSaving: Boolean = false,
    val savedMessage: String? = null
)

class SettingsViewModel(
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            settingsRepository.apiKey.collect { key ->
                _uiState.update { it.copy(apiKey = key) }
            }
        }
    }

    fun onApiKeyChange(value: String) {
        _uiState.update { it.copy(apiKey = value, savedMessage = null) }
    }

    fun saveApiKey() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            settingsRepository.saveApiKey(_uiState.value.apiKey)
            _uiState.update {
                it.copy(
                    isSaving = false,
                    savedMessage = if (it.apiKey.isBlank()) "API key cleared." else "API key saved on this device."
                )
            }
        }
    }

    fun clearSavedMessage() {
        _uiState.update { it.copy(savedMessage = null) }
    }

    companion object {
        fun factory(repository: SettingsRepository): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return SettingsViewModel(repository) as T
                }
            }
        }
    }
}
