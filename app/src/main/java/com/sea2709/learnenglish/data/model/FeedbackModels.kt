package com.sea2709.learnenglish.data.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class WritingFeedback(
    @Json(name = "corrected_paragraph") val correctedParagraph: String,
    @Json(name = "overall_summary") val overallSummary: String,
    val suggestions: List<FeedbackSuggestion> = emptyList()
)

@JsonClass(generateAdapter = true)
data class FeedbackSuggestion(
    val category: String,
    val original: String,
    val suggestion: String,
    val explanation: String
)

enum class SuggestionCategory(val label: String) {
    GRAMMAR("Grammar"),
    WORD_USAGE("Word usage"),
    TONE("Tone"),
    NATURALNESS("Naturalness"),
    OTHER("Other");

    companion object {
        fun fromRaw(value: String): SuggestionCategory {
            return entries.find { it.name.equals(value, ignoreCase = true) || it.label.equals(value, ignoreCase = true) }
                ?: OTHER
        }
    }
}
