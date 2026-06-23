package com.sea2709.learnenglish.data.remote

import com.sea2709.learnenglish.data.model.WritingFeedback
import com.squareup.moshi.Moshi
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

class FeedbackService(
  private val api: OpenAiApi,
  private val moshi: Moshi
) {
    suspend fun analyzeParagraph(paragraph: String, apiKey: String): WritingFeedback {
        val request = ChatCompletionRequest(
            model = "gpt-4o-mini",
            messages = listOf(
                ChatMessage(
                    role = "system",
                    content = SYSTEM_PROMPT
                ),
                ChatMessage(
                    role = "user",
                    content = paragraph
                )
            )
        )

        val response = api.createChatCompletion(
            authorization = "Bearer $apiKey",
            request = request
        )

        val content = response.choices.firstOrNull()?.message?.content
            ?: throw IllegalStateException("No response from AI")

        val adapter = moshi.adapter(WritingFeedback::class.java)
        return adapter.fromJson(content)
            ?: throw IllegalStateException("Could not parse AI feedback")
    }

    companion object {
        private const val SYSTEM_PROMPT = """
You are an expert English writing coach helping non-native speakers improve their journal writing.
Review the user's paragraph for grammar, tone, word usage, and naturalness.

Respond ONLY with valid JSON matching this schema:
{
  "corrected_paragraph": "A fully corrected, natural-sounding version of the paragraph",
  "overall_summary": "2-3 encouraging sentences summarizing strengths and areas to improve",
  "suggestions": [
    {
      "category": "Grammar | Word usage | Tone | Naturalness | Other",
      "original": "the exact phrase from the user's text",
      "suggestion": "the improved phrase",
      "explanation": "brief, friendly explanation of why the change helps"
    }
  ]
}

Rules:
- Keep the user's intended meaning and voice
- Limit suggestions to the most helpful 3-8 items
- Be encouraging, not harsh
- If the paragraph is already excellent, say so and return minimal suggestions
"""

        fun create(): FeedbackService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }

            val client = OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build()

            val moshi = Moshi.Builder().build()

            val retrofit = Retrofit.Builder()
                .baseUrl("https://api.openai.com/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .build()

            return FeedbackService(
                api = retrofit.create(OpenAiApi::class.java),
                moshi = moshi
            )
        }
    }
}
