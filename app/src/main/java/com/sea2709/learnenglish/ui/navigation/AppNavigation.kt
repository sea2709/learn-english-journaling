package com.sea2709.learnenglish.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.sea2709.learnenglish.LearnEnglishApp
import com.sea2709.learnenglish.ui.screens.feedback.FeedbackScreen
import com.sea2709.learnenglish.ui.screens.history.HistoryScreen
import com.sea2709.learnenglish.ui.screens.history.HistoryViewModel
import com.sea2709.learnenglish.ui.screens.settings.SettingsScreen
import com.sea2709.learnenglish.ui.screens.settings.SettingsViewModel
import com.sea2709.learnenglish.ui.screens.write.WriteScreen
import com.sea2709.learnenglish.ui.screens.write.WriteViewModel

object Routes {
    const val WRITE = "write"
    const val HISTORY = "history"
    const val SETTINGS = "settings"
    const val FEEDBACK = "feedback/{entryId}"

    fun feedback(entryId: Long) = "feedback/$entryId"
}

@Composable
fun AppNavHost(
    navController: NavHostController,
    app: LearnEnglishApp,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Routes.WRITE,
        modifier = modifier
    ) {
        composable(Routes.WRITE) {
            val viewModel: WriteViewModel = viewModel(
                factory = WriteViewModel.factory(app.journalRepository)
            )
            WriteScreen(
                viewModel = viewModel,
                onFeedbackReady = { entryId ->
                    navController.navigate(Routes.feedback(entryId))
                },
                onOpenHistory = { navController.navigate(Routes.HISTORY) },
                onOpenSettings = { navController.navigate(Routes.SETTINGS) }
            )
        }

        composable(Routes.HISTORY) {
            val viewModel: HistoryViewModel = viewModel(
                factory = HistoryViewModel.factory(app.journalRepository)
            )
            HistoryScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onOpenEntry = { entryId ->
                    navController.navigate(Routes.feedback(entryId))
                }
            )
        }

        composable(Routes.SETTINGS) {
            val viewModel: SettingsViewModel = viewModel(
                factory = SettingsViewModel.factory(app.settingsRepository)
            )
            SettingsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Routes.FEEDBACK,
            arguments = listOf(navArgument("entryId") { type = NavType.LongType })
        ) { backStackEntry ->
            val entryId = backStackEntry.arguments?.getLong("entryId") ?: return@composable
            FeedbackScreen(
                entryId = entryId,
                journalRepository = app.journalRepository,
                onBack = { navController.popBackStack() },
                onWriteAgain = {
                    navController.popBackStack(Routes.WRITE, inclusive = false)
                }
            )
        }
    }
}
