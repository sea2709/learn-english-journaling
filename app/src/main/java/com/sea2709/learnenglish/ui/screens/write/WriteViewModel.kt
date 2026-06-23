package com.sea2709.learnenglish.ui.screens.write

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.sea2709.learnenglish.data.repository.JournalRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WriteUiState(
    val paragraph: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class WriteViewModel(
    private val journalRepository: JournalRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WriteUiState())
    val uiState: StateFlow<WriteUiState> = _uiState.asStateFlow()

    fun onParagraphChange(value: String) {
        _uiState.update { it.copy(paragraph = value, errorMessage = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun checkWriting(onSuccess: (Long) -> Unit) {
        val paragraph = _uiState.value.paragraph.trim()
        if (paragraph.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Write a paragraph before checking.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val (entryId, _) = journalRepository.analyzeAndSave(paragraph)
                _uiState.update { it.copy(isLoading = false, paragraph = "") }
                onSuccess(entryId)
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Something went wrong. Please try again."
                    )
                }
            }
        }
    }

    companion object {
        fun factory(repository: JournalRepository): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return WriteViewModel(repository) as T
                }
            }
        }
    }
}
