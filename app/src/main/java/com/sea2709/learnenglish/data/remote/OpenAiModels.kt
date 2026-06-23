package com.sea2709.learnenglish.data.remote

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface OpenAiApi {
    @POST("v1/chat/completions")
    suspend fun createChatCompletion(
        @Header("Authorization") authorization: String,
        @Body request: ChatCompletionRequest
    ): ChatCompletionResponse
}

@JsonClass(generateAdapter = true)
data class ChatCompletionRequest(
    val model: String,
    val messages: List<ChatMessage>,
    @Json(name = "response_format") val responseFormat: ResponseFormat = ResponseFormat()
)

@JsonClass(generateAdapter = true)
data class ChatMessage(
    val role: String,
    val content: String
)

@JsonClass(generateAdapter = true)
data class ResponseFormat(
    val type: String = "json_object"
)

@JsonClass(generateAdapter = true)
data class ChatCompletionResponse(
    val choices: List<ChatChoice>
)

@JsonClass(generateAdapter = true)
data class ChatChoice(
    val message: ChatMessage
)
