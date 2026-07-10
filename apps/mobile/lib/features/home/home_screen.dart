import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shopAsync = ref.watch(shopProvider);
    final statsAsync = ref.watch(analyticsProvider);

    return Scaffold(
      appBar: AppBar(
        title: shopAsync.when(
          data: (s) => Text(s.name.isEmpty ? 'ویلینک' : s.name),
          loading: () => const Text('ویلینک'),
          error: (_, __) => const Text('ویلینک'),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(shopProvider);
          ref.invalidate(analyticsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            statsAsync.when(
              data: (s) => _StatsGrid(stats: s),
              loading: () => const _StatsSkeleton(),
              error: (e, _) => _ErrorBox(message: e.toString()),
            ),
            const SizedBox(height: 24),
            Text('پرکلیک‌ترین لینک‌ها', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            statsAsync.when(
              data: (s) => s.topBlocks.isEmpty
                  ? const _EmptyHint(text: 'هنوز کلیکی ثبت نشده')
                  : Column(
                      children: [
                        for (final b in s.topBlocks.take(5))
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: GlassCard(
                              child: Row(
                                children: [
                                  const Icon(Icons.link_rounded, color: AppColors.accent, size: 18),
                                  const SizedBox(width: 10),
                                  Expanded(child: Text(b['label']?.toString() ?? '—', overflow: TextOverflow.ellipsis)),
                                  Text('${b['clickCount'] ?? 0}', style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
              loading: () => const SizedBox(),
              error: (_, __) => const SizedBox(),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final AnalyticsSummary stats;
  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    final items = [
      (icon: Icons.visibility_rounded, label: 'بازدید (۳۰ روز)', value: '${stats.pageViews}', color: AppColors.info),
      (icon: Icons.touch_app_rounded, label: 'کلیک روی لینک‌ها', value: '${stats.blockClicks}', color: AppColors.accent),
      (icon: Icons.receipt_rounded, label: 'سفارش‌ها', value: '${stats.orderCount}', color: AppColors.success),
      (icon: Icons.payments_rounded, label: 'درآمد (تومان)', value: _formatToman(stats.revenue), color: AppColors.warning),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        for (var i = 0; i < items.length; i++)
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(items[i].icon, color: items[i].color, size: 22),
                const Spacer(),
                Text(items[i].value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                const SizedBox(height: 2),
                Text(items[i].label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ).animate().fadeIn(delay: (i * 80).ms).slideY(begin: 0.1, end: 0),
      ],
    );
  }

  String _formatToman(num v) {
    final s = v.toStringAsFixed(0);
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }
}

class _StatsSkeleton extends StatelessWidget {
  const _StatsSkeleton();
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: List.generate(
        4,
        (i) => Container(
          decoration: BoxDecoration(color: AppColors.surfaceGlass, borderRadius: BorderRadius.circular(20)),
        ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 1200.ms, color: AppColors.border),
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  final String text;
  const _EmptyHint({required this.text});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Center(child: Text(text, style: const TextStyle(color: AppColors.textMuted))),
      );
}

class _ErrorBox extends StatelessWidget {
  final String message;
  const _ErrorBox({required this.message});
  @override
  Widget build(BuildContext context) => GlassCard(
        child: Row(children: [
          const Icon(Icons.error_outline_rounded, color: AppColors.danger),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: const TextStyle(color: AppColors.danger))),
        ]),
      );
}
