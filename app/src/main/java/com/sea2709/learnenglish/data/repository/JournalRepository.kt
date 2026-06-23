package com.sea2709.learnenglish.data.repository

import com.sea2709.learnenglish.data.local.JournalDao
import com.sea2709.learnenglish.data.model.JournalEntry
import com.sea2709.learnenglish.data.model.WritingFeedback
import com.sea2709.learnenglish.data.preferences.SettingsRepository
import com.sea2709.learnenglish.data.remote.FeedbackService
import com.squareup.moshi.Moshi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

class JournalRepository(
    private val journalDao: JournalDao,
    private val feedbackService: FeedbackService,
    private val settingsRepository: SettingsRepository,
    private val moshi: Moshi
) {
    fun observeEntries(): Flow<List<JournalEntry>> = journalDao.observeAll()

    suspend fun getEntry(id: Long): JournalEntry? = journalDao.getById(id)

    suspend fun deleteEntry(id: Long) = journalDao.deleteById(id)

    suspend fun analyzeAndSave(paragraph: String): Pair<Long, WritingFeedback> {
        val apiKey = settingsRepository.apiKey.first()
        require(apiKey.isNotBlank()) { "Add your OpenAI API key in Settings before checking your writing." }

        val feedback = feedbackService.analyzeParagraph(paragraph, apiKey)
        val feedbackJson = moshi.adapter(WritingFeedback::class.java).toJson(feedback)

        val entryId = journalDao.insert(
            JournalEntry(
                originalText = paragraph,
                correctedText = feedback.correctedParagraph,
                feedbackJson = feedbackJson
            )
        )

        return entryId to feedback
    }

    fun parseFeedback(entry: JournalEntry): WritingFeedback? {
        val json = entry.feedbackJson ?: return null
        return moshi.adapter(WritingFeedback::class.java).fromJson(json)
    }
}
