import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      (icon: Icons.storefront_rounded, label: 'پروفایل فروشگاه', route: '/more/shop'),
      (icon: Icons.workspace_premium_rounded, label: 'اشتراک و پلن‌ها', route: '/more/plans'),
      (icon: Icons.person_outline_rounded, label: 'حساب کاربری', route: '/more/account'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('بیشتر')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, i) {
          final it = items[i];
          return GlassCard(
            onTap: () => context.push(it.route),
            child: Row(
              children: [
                Icon(it.icon, color: AppColors.accent),
                const SizedBox(width: 12),
                Expanded(child: Text(it.label, style: const TextStyle(fontWeight: FontWeight.w700))),
                const Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: AppColors.textMuted),
              ],
            ),
          );
        },
      ),
    );
  }
}
