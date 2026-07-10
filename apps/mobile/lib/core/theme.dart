import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// پالت رنگی هماهنگ با داشبورد وب (dark mode) — پس‌زمینه سرمه‌ای تیره + نارنجی تاکیدی
class AppColors {
  static const bg = Color(0xFF0A0A0F);
  static const surface = Color(0xFF13131A);
  static const surfaceGlass = Color(0x0DFFFFFF); // white @ 5%
  static const border = Color(0x1AFFFFFF); // white @ 10%
  static const accent = Color(0xFFF97316);
  static const accentGlow = Color(0x33F97316);
  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFF9CA3AF);
  static const textMuted = Color(0xFF6B7280);
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFEAB308);
  static const danger = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);
}

ThemeData buildAppTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  final textTheme = GoogleFonts.vazirmatnTextTheme(base.textTheme).apply(
    bodyColor: AppColors.textPrimary,
    displayColor: AppColors.textPrimary,
  );

  return base.copyWith(
    scaffoldBackgroundColor: AppColors.bg,
    primaryColor: AppColors.accent,
    textTheme: textTheme,
    colorScheme: base.colorScheme.copyWith(
      primary: AppColors.accent,
      secondary: AppColors.accent,
      surface: AppColors.surface,
      error: AppColors.danger,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.bg,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
      iconTheme: const IconThemeData(color: AppColors.textPrimary),
    ),
    cardTheme: CardThemeData(
      color: AppColors.surfaceGlass,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.border),
      ),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surfaceGlass,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
      ),
      hintStyle: const TextStyle(color: AppColors.textMuted),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.surface,
      selectedItemColor: AppColors.accent,
      unselectedItemColor: AppColors.textMuted,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
    dividerTheme: const DividerThemeData(color: AppColors.border, thickness: 1),
    splashFactory: InkRipple.splashFactory,
  );
}

/// باکس شیشه‌ای (glassmorphism) — معادل کلاس glass-card در وب
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const GlassCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.onTap});

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surfaceGlass,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(borderRadius: BorderRadius.circular(20), onTap: onTap, child: card),
    );
  }
}
