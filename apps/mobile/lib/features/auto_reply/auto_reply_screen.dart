import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

const _platforms = [('telegram', 'تلگرام', Color(0xFF2AABEE)), ('bale', 'بله', Color(0xFF00A652))];

class AutoReplyScreen extends ConsumerWidget {
  const AutoReplyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rulesAsync = ref.watch(autoReplyProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('پاسخ خودکار')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: rulesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (rules) {
          if (rules.isEmpty) {
            return const Center(child: Text('هنوز قانونی اضافه نکرده‌اید', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: rules.length,
            itemBuilder: (context, i) {
              final r = rules[i];
              final platform = _platforms.firstWhere((p) => p.$1 == r.platform, orElse: () => _platforms[0]);
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  onTap: () => _showSheet(context, ref, rule: r),
                  child: Row(
                    children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(color: platform.$3.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                        child: Icon(Icons.send_rounded, color: platform.$3, size: 18),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('کلیدواژه: ${r.keyword}', style: const TextStyle(fontWeight: FontWeight.w700)),
                            Text(r.reply, style: const TextStyle(color: AppColors.textMuted, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                      Switch(
                        value: r.isActive,
                        activeColor: AppColors.accent,
                        onChanged: (v) => ref.read(autoReplyProvider.notifier).updateItem(r.id, {'isActive': v}),
                      ),
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

  void _showSheet(BuildContext context, WidgetRef ref, {AutoReplyRule? rule}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _AutoReplyEditSheet(rule: rule),
    );
  }
}

class _AutoReplyEditSheet extends ConsumerStatefulWidget {
  final AutoReplyRule? rule;
  const _AutoReplyEditSheet({this.rule});
  @override
  ConsumerState<_AutoReplyEditSheet> createState() => _AutoReplyEditSheetState();
}

class _AutoReplyEditSheetState extends ConsumerState<_AutoReplyEditSheet> {
  late final _keywordCtrl = TextEditingController(text: widget.rule?.keyword);
  late final _replyCtrl = TextEditingController(text: widget.rule?.reply);
  late String _platform = widget.rule?.platform ?? 'telegram';
  bool _saving = false;

  bool get _isEdit => widget.rule != null;

  Future<void> _save() async {
    setState(() => _saving = true);
    final body = {'platform': _platform, 'keyword': _keywordCtrl.text.trim(), 'reply': _replyCtrl.text.trim()};
    try {
      if (_isEdit) {
        await ref.read(autoReplyProvider.notifier).updateItem(widget.rule!.id, body);
      } else {
        await ref.read(autoReplyProvider.notifier).create(body);
      }
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(autoReplyProvider.notifier).deleteItem(widget.rule!.id);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(_isEdit ? 'ویرایش قانون' : 'قانون پاسخ خودکار جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          Row(
            children: [
              for (final p in _platforms)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: ChoiceChip(
                    label: Text(p.$2),
                    selected: _platform == p.$1,
                    onSelected: (_) => setState(() => _platform = p.$1),
                    selectedColor: p.$3,
                    labelStyle: TextStyle(color: _platform == p.$1 ? Colors.white : AppColors.textSecondary),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(controller: _keywordCtrl, decoration: const InputDecoration(hintText: 'کلیدواژه (مثلاً: قیمت)')),
          const SizedBox(height: 12),
          TextField(controller: _replyCtrl, maxLines: 3, decoration: const InputDecoration(hintText: 'متن پاسخ خودکار')),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('ذخیره'),
          ),
          if (_isEdit) ...[
            const SizedBox(height: 8),
            TextButton(onPressed: _delete, style: TextButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('حذف')),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
