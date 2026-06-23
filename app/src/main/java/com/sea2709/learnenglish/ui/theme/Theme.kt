package com.sea2709.learnenglish.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = ForestGreen,
    onPrimary = Color.White,
    primaryContainer = Sage,
    onPrimaryContainer = Ink,
    secondary = ForestGreenLight,
    onSecondary = Color.White,
    background = Cream,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    surfaceVariant = Color(0xFFE8EFE9),
    onSurfaceVariant = MutedInk,
    outline = Color(0xFFB8C7BC)
)

private val DarkColors = darkColorScheme(
    primary = Sage,
    onPrimary = Ink,
    primaryContainer = ForestGreen,
    onPrimaryContainer = Color.White,
    secondary = ForestGreenLight,
    onSecondary = Color.White,
    background = Color(0xFF121A15),
    onBackground = Color(0xFFE8EFE9),
    surface = Color(0xFF1A241E),
    onSurface = Color(0xFFE8EFE9),
    surfaceVariant = Color(0xFF273329),
    onSurfaceVariant = Color(0xFFB8C7BC),
    outline = Color(0xFF4A5A50)
)

@Composable
fun LearnEnglishTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = Typography,
        content = content
    )
}
