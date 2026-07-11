import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/data_providers.dart';
import '../../core/theme.dart';

class AbTestingScreen extends ConsumerWidget {
  const AbTestingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final testsAsync = ref.watch(abTestsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('تست A/B')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: testsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (tests) {
          if (tests.isEmpty) {
            return const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('تست A/B به شما کمک می‌کند دو نسخه از صفحه بیو خود را مقایسه کنید تا بفهمید کدام بازدهی بهتری دارد.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted))),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: tests.length,
            itemBuilder: (context, i) {
              final t = tests[i];
              final rateA = t.impressionA > 0 ? (t.conversionA / t.impressionA * 100) : 0.0;
              final rateB = t.impressionB > 0 ? (t.conversionB / t.impressionB * 100) : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Expanded(child: Text(t.name, style: const TextStyle(fontWeight: FontWeight.w700))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (t.status == 'RUNNING' ? AppColors.success : t.status == 'COMPLETED' ? AppColors.info : AppColors.warning).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            t.status == 'RUNNING' ? 'در حال اجرا' : t.status == 'COMPLETED' ? 'پایان‌یافته' : 'متوقف',
                            style: TextStyle(fontSize: 10, color: t.status == 'RUNNING' ? AppColors.success : t.status == 'COMPLETED' ? AppColors.info : AppColors.warning, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 10),
                      Row(children: [
                        Expanded(child: _VariantStat(label: 'نسخه A', impressions: t.impressionA, rate: rateA, isWinner: t.winner == 'A')),
                        const SizedBox(width: 8),
                        Expanded(child: _VariantStat(label: 'نسخه B', impressions: t.impressionB, rate: rateB, isWinner: t.winner == 'B')),
                      ]),
                      if (t.status == 'RUNNING') ...[
                        const SizedBox(height: 10),
                        Row(children: [
                          Expanded(child: OutlinedButton(onPressed: () async { await pauseAbTest(t.id); ref.invalidate(abTestsProvider); }, child: const Text('توقف', style: TextStyle(fontSize: 12)))),
                          const SizedBox(width: 8),
                          Expanded(child: OutlinedButton(onPressed: () async { await endAbTest(t.id, rateA >= rateB ? 'A' : 'B'); ref.invalidate(abTestsProvider); }, child: const Text('پایان و اعمال برنده', style: TextStyle(fontSize: 11)))),
                        ]),
                      ],
                    ],
                  ),
                ).animate().fadeIn(delay: (i * 60).ms),
              );
            },
          );
        },
      ),
    );
  }

  void _showCreateSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _CreateTestSheet(),
    );
  }
}

class _VariantStat extends StatelessWidget {
  final String label;
  final int impressions;
  final double rate;
  final bool isWinner;
  const _VariantStat({required this.label, required this.impressions, required this.rate, required this.isWinner});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isWinner ? AppColors.success.withValues(alpha: 0.1) : AppColors.surfaceGlass,
        borderRadius: BorderRadius.circular(12),
        border: isWinner ? Border.all(color: AppColors.success) : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            if (isWinner) const Padding(padding: EdgeInsets.only(right: 4), child: Icon(Icons.emoji_events_rounded, size: 12, color: AppColors.success)),
          ]),
          Text('${impressions} بازدید', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
          Text('${rate.toStringAsFixed(1)}٪ تبدیل', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.accent)),
        ],
      ),
    );
  }
}

class _CreateTestSheet extends ConsumerStatefulWidget {
  const _CreateTestSheet();
  @override
  ConsumerState<_CreateTestSheet> createState() => _CreateTestSheetState();
}

class _CreateTestSheetState extends ConsumerState<_CreateTestSheet> {
  final _nameCtrl = TextEditingController();
  bool _saving = false;
  String? _error;

  Future<void> _save() async {
    setState(() { _saving = true; _error = null; });
    try {
      await createAbTest(_nameCtrl.text.trim());
      ref.invalidate(abTestsProvider);
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      setState(() => _error = e.code == 'PRO_REQUIRED' ? 'این ویژگی نیاز به اشتراک PRO دارد' : e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('تست A/B جدید', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          const Text('نسخه A از وضعیت فعلی صفحه بیو شما گرفته می‌شود. برای ویرایش نسخه B فعلاً از پنل وب استفاده کنید.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 16),
          TextField(controller: _nameCtrl, decoration: const InputDecoration(hintText: 'نام تست')),
          if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: AppColors.danger))),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('شروع تست'),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
