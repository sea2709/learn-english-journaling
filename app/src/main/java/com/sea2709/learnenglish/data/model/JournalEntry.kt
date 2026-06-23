package com.sea2709.learnenglish.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "journal_entries")
data class JournalEntry(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val originalText: String,
    val correctedText: String? = null,
    val feedbackJson: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
