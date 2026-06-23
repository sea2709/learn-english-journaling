# English Journal

An Android app that helps you learn English by journaling. Write a paragraph about your day or thoughts, and an AI coach reviews your writing for grammar, tone, word usage, and naturalness — then suggests corrections to help you sound more natural.

## Features

- **Journal writing** — A calm, focused editor for daily paragraphs
- **AI writing coach** — Checks grammar, tone, word choice, and naturalness
- **Structured feedback** — See a corrected version, a summary, and item-by-item suggestions
- **History** — Browse and revisit past entries stored on your device
- **Private API key** — Your OpenAI key is saved locally and never leaves your phone except when calling the API

## Screenshots

| Write | Feedback | History |
|-------|----------|---------|
| Compose a paragraph and tap "Check my writing" | Review corrections and explanations | Revisit past journal entries |

## Getting started

### Prerequisites

- Android Studio Ladybug (2024.2.1) or newer
- Android SDK 35
- JDK 17+
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Run the app

1. Clone the repository:
   ```bash
   git clone https://github.com/sea2709/learn-english-journaling.git
   cd learn-english-journaling
   ```

2. Open the project in Android Studio.

3. Sync Gradle and run on an emulator or physical device (API 26+).

4. On first launch, open **Settings** and paste your OpenAI API key.

5. Write a paragraph on the home screen and tap **Check my writing**.

### Build from the command line

```bash
./gradlew assembleDebug
```

The APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

## How it works

1. You write a journal paragraph in the app.
2. The app sends your text to OpenAI (`gpt-4o-mini`) with a structured prompt asking for JSON feedback.
3. The AI returns:
   - A fully corrected, natural-sounding version
   - An encouraging summary
   - 3–8 targeted suggestions (grammar, word usage, tone, naturalness)
4. The entry is saved locally with Room so you can review it later.

## Tech stack

- **Kotlin** + **Jetpack Compose** (Material 3)
- **Navigation Compose** for screen flow
- **Room** for on-device journal storage
- **DataStore** for settings (API key)
- **Retrofit** + **Moshi** for OpenAI API calls
- **ViewModel** + **StateFlow** for UI state

## Project structure

```
app/src/main/java/com/sea2709/learnenglish/
├── data/
│   ├── local/          # Room database
│   ├── model/          # Entities and feedback models
│   ├── preferences/    # DataStore settings
│   ├── remote/         # OpenAI API client
│   └── repository/     # Journal repository
├── ui/
│   ├── navigation/     # NavHost routes
│   ├── screens/        # Write, Feedback, History, Settings
│   └── theme/          # Colors and typography
├── LearnEnglishApp.kt
└── MainActivity.kt
```

## Privacy

- Journal entries are stored only on your device.
- Your OpenAI API key is stored in Android DataStore on your device.
- Text is sent to OpenAI only when you tap "Check my writing".

## License

MIT
