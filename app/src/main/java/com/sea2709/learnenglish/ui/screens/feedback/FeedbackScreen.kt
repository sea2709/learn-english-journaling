package com.sea2709.learnenglish.ui.screens.feedback

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.sea2709.learnenglish.data.model.FeedbackSuggestion
import com.sea2709.learnenglish.data.model.JournalEntry
import com.sea2709.learnenglish.data.model.SuggestionCategory
import com.sea2709.learnenglish.data.model.WritingFeedback
import com.sea2709.learnenglish.data.repository.JournalRepository

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedbackScreen(
    entryId: Long,
    journalRepository: JournalRepository,
    onBack: () -> Unit,
    onWriteAgain: () -> Unit
) {
    var entry by remember { mutableStateOf<JournalEntry?>(null) }
    var feedback by remember { mutableStateOf<WritingFeedback?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(entryId) {
        isLoading = true
        errorMessage = null
        try {
            val loaded = journalRepository.getEntry(entryId)
            entry = loaded
            feedback = loaded?.let { journalRepository.parseFeedback(it) }
            if (loaded == null) {
                errorMessage = "Entry not found."
            }
        } catch (error: Exception) {
            errorMessage = error.message
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Writing feedback") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when {
            isLoading -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator()
                }
            }

            errorMessage != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(20.dp),
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(text = errorMessage ?: "Unknown error")
                }
            }

            entry != null && feedback != null -> {
                FeedbackContent(
                    entry = entry!!,
                    feedback = feedback!!,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 20.dp),
                    onWriteAgain = onWriteAgain
                )
            }
        }
    }
}

@Composable
private fun FeedbackContent(
    entry: JournalEntry,
    feedback: WritingFeedback,
    modifier: Modifier = Modifier,
    onWriteAgain: () -> Unit
) {
    Column(
        modifier = modifier.verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Spacer(modifier = Modifier.height(4.dp))

        SectionCard(title = "Your paragraph") {
            Text(text = entry.originalText, style = MaterialTheme.typography.bodyLarge)
        }

        SectionCard(title = "Suggested version") {
            Text(
                text = feedback.correctedParagraph,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
        }

        SectionCard(title = "Coach summary") {
            Text(text = feedback.overallSummary, style = MaterialTheme.typography.bodyMedium)
        }

        if (feedback.suggestions.isNotEmpty()) {
            Text(
                text = "Suggestions (${feedback.suggestions.size})",
                style = MaterialTheme.typography.titleLarge
            )

            feedback.suggestions.forEach { suggestion ->
                SuggestionCard(suggestion = suggestion)
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onWriteAgain,
                modifier = Modifier.weight(1f)
            ) {
                Text("Write again")
            }
            Button(
                onClick = onWriteAgain,
                modifier = Modifier.weight(1f)
            ) {
                Text("Done")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
    }
}

@Composable
private fun SectionCard(
    title: String,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(8.dp))
            content()
        }
    }
}

@Composable
private fun SuggestionCard(suggestion: FeedbackSuggestion) {
    val category = SuggestionCategory.fromRaw(suggestion.category)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = category.label,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelLarge
                )
            }

            Text(
                text = "\"${suggestion.original}\" → \"${suggestion.suggestion}\"",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = suggestion.explanation,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
