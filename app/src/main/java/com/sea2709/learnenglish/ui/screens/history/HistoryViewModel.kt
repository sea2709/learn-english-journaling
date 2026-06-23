package com.sea2709.learnenglish.ui.screens.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.sea2709.learnenglish.data.model.JournalEntry
import com.sea2709.learnenglish.data.repository.JournalRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class HistoryViewModel(
    private val journalRepository: JournalRepository
) : ViewModel() {

    val entries: StateFlow<List<JournalEntry>> = journalRepository.observeEntries()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun deleteEntry(id: Long) {
        viewModelScope.launch {
            journalRepository.deleteEntry(id)
        }
    }

    companion object {
        fun factory(repository: JournalRepository): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HistoryViewModel(repository) as T
                }
            }
        }
    }
}
