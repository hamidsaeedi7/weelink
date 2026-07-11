import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/theme.dart';

class CouponsScreen extends ConsumerWidget {
  const CouponsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final couponsAsync = ref.watch(couponsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('کدهای تخفیف')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: couponsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (coupons) {
          if (coupons.isEmpty) {
            return const Center(child: Text('هنوز کد تخفیفی نساخته‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: coupons.length,
            itemBuilder: (context, i) {
              final c = coupons[i];
              final valueLabel = c.type == 'percent' ? '${c.value}%' : '${c.value.toStringAsFixed(0)} ت';
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  onTap: () => ref.read(couponsProvider.notifier).deleteItem(c.id),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                        child: Text(valueLabel, style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(c.code, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1), textDirection: TextDirection.ltr),
                            Text('${c.usedCount} استفاده${c.maxUses != null ? ' از ${c.maxUses}' : ''}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                          ],
                        ),
                      ),
                      const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.danger),
                    ],
                  ),
                ).animate().fadeIn(delay: (i * 50).ms),
              );
            },
          );
        },
      ),
    );
  }

  void _showSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _CouponCreateSheet(),
    );
  }
}

class _CouponCreateSheet extends ConsumerStatefulWidget {
  const _CouponCreateSheet();
  @override
  ConsumerState<_CouponCreateSheet> createState() => _CouponCreateSheetState();
}

class _CouponCreateSheetState extends ConsumerState<_CouponCreateSheet> {
  final _codeCtrl = TextEditingController();
  final _valueCtrl = TextEditingController();
  final _maxUsesCtrl = TextEditingController();
  String _type = 'percent';
  bool _saving = false;

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(couponsProvider.notifier).create({
        'code': _codeCtrl.text.trim().toUpperCase(),
        'type': _type,
        'value': num.tryParse(_valueCtrl.text) ?? 0,
        if (_maxUsesCtrl.text.trim().isNotEmpty) 'maxUses': int.tryParse(_maxUsesCtrl.text),
        'scopeType': 'ALL',
      });
      if (mounted) Navigator.pop(context);
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
          const Text('کد تخفیف جدید', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          TextField(controller: _codeCtrl, textDirection: TextDirection.ltr, decoration: const InputDecoration(hintText: 'کد تخفیف (مثلاً OFF20)')),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ChoiceChip(
                  label: const Text('درصدی'),
                  selected: _type == 'percent',
                  onSelected: (_) => setState(() => _type = 'percent'),
                  selectedColor: AppColors.accent,
                  labelStyle: TextStyle(color: _type == 'percent' ? Colors.white : AppColors.textSecondary),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ChoiceChip(
                  label: const Text('مبلغ ثابت'),
                  selected: _type == 'fixed',
                  onSelected: (_) => setState(() => _type = 'fixed'),
                  selectedColor: AppColors.accent,
                  labelStyle: TextStyle(color: _type == 'fixed' ? Colors.white : AppColors.textSecondary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(controller: _valueCtrl, keyboardType: TextInputType.number, decoration: InputDecoration(hintText: _type == 'percent' ? 'درصد تخفیف' : 'مبلغ تخفیف (تومان)')),
          const SizedBox(height: 12),
          TextField(controller: _maxUsesCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'حداکثر تعداد استفاده (اختیاری)')),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ساخت کد تخفیف'),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
