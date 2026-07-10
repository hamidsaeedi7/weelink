import 'package:flutter/material.dart';
import '../core/theme.dart';

class ShellScaffold extends StatelessWidget {
  final Widget child;
  final int currentIndex;
  final ValueChanged<int> onTap;

  const ShellScaffold({super.key, required this.child, required this.currentIndex, required this.onTap});

  static const _items = [
    (icon: Icons.home_rounded, label: 'خانه'),
    (icon: Icons.link_rounded, label: 'لینک‌ها'),
    (icon: Icons.storefront_rounded, label: 'محصولات'),
    (icon: Icons.receipt_long_rounded, label: 'سفارش‌ها'),
    (icon: Icons.menu_rounded, label: 'بیشتر'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: onTap,
          items: [
            for (final it in _items) BottomNavigationBarItem(icon: Icon(it.icon), label: it.label),
          ],
        ),
      ),
    );
  }
}
