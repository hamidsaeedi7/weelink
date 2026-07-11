import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/theme.dart';
import 'templates_data.dart';

class TemplatesScreen extends ConsumerWidget {
  const TemplatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('قالب‌های آماده')),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        // ارتفاع ثابت (نه نسبت‌محور) تا روی هر عرض صفحه‌ای کارت‌ها اندازه‌ی منطقی داشته باشند
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(maxCrossAxisExtent: 200, mainAxisSpacing: 12, crossAxisSpacing: 12, mainAxisExtent: 150),
        itemCount: kBioTemplates.length,
        itemBuilder: (context, i) {
          final t = kBioTemplates[i];
          final color = Color(t.accentColor);
          return GlassCard(
            padding: const EdgeInsets.all(14),
            onTap: () => _confirmApply(context, ref, t),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
                  child: Center(child: Text(t.emoji, style: const TextStyle(fontSize: 22))),
                ),
                const Spacer(),
                Text(t.label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(t.desc, style: const TextStyle(color: AppColors.textMuted, fontSize: 10), maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
            ),
          ).animate().fadeIn(delay: (i * 30).ms).scale(begin: const Offset(0.92, 0.92));
        },
      ),
    );
  }

  void _confirmApply(BuildContext context, WidgetRef ref, BioTemplate t) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text('اعمال قالب «${t.label}»؟'),
        content: const Text('همه‌ی لینک‌های فعلی شما حذف و با لینک‌های این قالب جایگزین می‌شوند. این کار قابل بازگشت نیست.', style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await _applyTemplate(context, ref, t);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.accent),
            child: const Text('اعمال کن'),
          ),
        ],
      ),
    );
  }

  Future<void> _applyTemplate(BuildContext context, WidgetRef ref, BioTemplate t) async {
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    try {
      final notifier = ref.read(blocksProvider.notifier);
      final current = ref.read(blocksProvider).value ?? [];
      for (final b in current) {
        await notifier.deleteBlock(b.id);
      }
      for (final b in t.blocks) {
        await notifier.createBlock(type: b.type, label: b.label, url: b.url);
      }
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('قالب اعمال شد')));
      }
    } finally {
      if (context.mounted && Navigator.canPop(context)) Navigator.pop(context);
    }
  }
}
