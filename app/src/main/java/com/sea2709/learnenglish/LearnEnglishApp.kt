package com.sea2709.learnenglish

import android.app.Application
import com.sea2709.learnenglish.data.local.AppDatabase
import com.sea2709.learnenglish.data.preferences.SettingsRepository
import com.sea2709.learnenglish.data.remote.FeedbackService
import com.sea2709.learnenglish.data.repository.JournalRepository
import com.squareup.moshi.Moshi

class LearnEnglishApp : Application() {
    val moshi: Moshi by lazy { Moshi.Builder().build() }

    val settingsRepository: SettingsRepository by lazy {
        SettingsRepository(this)
    }

    val journalRepository: JournalRepository by lazy {
        JournalRepository(
            journalDao = AppDatabase.getInstance(this).journalDao(),
            feedbackService = FeedbackService.create(),
            settingsRepository = settingsRepository,
            moshi = moshi
        )
    }
}
