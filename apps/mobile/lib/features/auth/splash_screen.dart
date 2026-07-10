import 'package:flutter/material.dart';
import '../../core/theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Icon(Icons.link_rounded, color: AppColors.accent, size: 48),
      ),
    );
  }
}
