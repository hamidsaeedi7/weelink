import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/data_providers.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

const _platforms = [
  ('instagram', 'اینستاگرام', Color(0xFFE1306C)),
  ('telegram', 'تلگرام', Color(0xFF2AABEE)),
  ('youtube', 'یوتیوب', Color(0xFFFF0000)),
  ('twitter', 'توییتر', Color(0xFF1DA1F2)),
  ('other', 'سایر', AppColors.textMuted),
];
const _contentTypes = [('post', 'پست'), ('story', 'استوری'), ('reel', 'ریلز'), ('video', 'ویدیو'), ('text', 'متن'), ('other', 'سایر')];

class ContentCalendarScreen extends ConsumerWidget {
  const ContentCalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(contentPlansProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('تقویم محتوایی')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSheet(context, ref),
        child: const Icon(Icons.add_rounded),
      ),
      body: plansAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('خطا: $e', style: const TextStyle(color: AppColors.danger))),
        data: (plans) {
          if (plans.isEmpty) {
            return const Center(child: Text('هنوز محتوایی زمان‌بندی نشده', style: TextStyle(color: AppColors.textMuted)));
          }
          final sorted = [...plans]..sort((a, b) => (a.scheduledAt ?? DateTime(0)).compareTo(b.scheduledAt ?? DateTime(0)));
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
            itemCount: sorted.length,
            itemBuilder: (context, i) {
              final p = sorted[i];
              final platform = _platforms.firstWhere((pl) => pl.$1 == p.platform, orElse: () => _platforms[0]);
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassCard(
                  onTap: () => _showSheet(context, ref, plan: p),
                  child: Row(
                    children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(color: platform.$3.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                        child: Icon(Icons.campaign_outlined, color: platform.$3, size: 18),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.title, style: const TextStyle(fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                            if (p.scheduledAt != null)
                              Text(p.scheduledAt!.toLocal().toString().split('.').first, style: const TextStyle(color: AppColors.textMuted, fontSize: 11), textDirection: TextDirection.ltr),
                          ],
                        ),
                      ),
                      Text(platform.$2, style: TextStyle(color: platform.$3, fontSize: 11, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ).animate().fadeIn(delay: (i * 40).ms),
              );
            },
          );
        },
      ),
    );
  }

  void _showSheet(BuildContext context, WidgetRef ref, {ContentPlan? plan}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _ContentPlanEditSheet(plan: plan),
    );
  }
}

class _ContentPlanEditSheet extends ConsumerStatefulWidget {
  final ContentPlan? plan;
  const _ContentPlanEditSheet({this.plan});
  @override
  ConsumerState<_ContentPlanEditSheet> createState() => _ContentPlanEditSheetState();
}

class _ContentPlanEditSheetState extends ConsumerState<_ContentPlanEditSheet> {
  late final _titleCtrl = TextEditingController(text: widget.plan?.title);
  late final _descCtrl = TextEditingController(text: widget.plan?.description);
  late String _platform = widget.plan?.platform ?? 'instagram';
  late String _contentType = widget.plan?.contentType ?? 'post';
  late DateTime _scheduledAt = widget.plan?.scheduledAt ?? DateTime.now().add(const Duration(hours: 1));
  bool _saving = false;
  String? _error;

  bool get _isEdit => widget.plan != null;

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(context: context, initialDate: _scheduledAt, firstDate: DateTime.now().subtract(const Duration(days: 1)), lastDate: DateTime.now().add(const Duration(days: 365)));
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_scheduledAt));
    if (time == null) return;
    setState(() => _scheduledAt = DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  Future<void> _save() async {
    setState(() { _saving = true; _error = null; });
    final body = {
      'title': _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'platform': _platform,
      'contentType': _contentType,
      'scheduledAt': _scheduledAt.toIso8601String(),
    };
    try {
      final notifier = ref.read(contentPlansProvider.notifier);
      if (_isEdit) {
        await notifier.updateItem(widget.plan!.id, body);
      } else {
        await notifier.create(body);
      }
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      setState(() => _error = e.code == 'PRO_REQUIRED' ? 'این ویژگی نیاز به اشتراک PRO دارد' : e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(contentPlansProvider.notifier).deleteItem(widget.plan!.id);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(_isEdit ? 'ویرایش محتوا' : 'محتوای جدید', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'عنوان محتوا')),
            const SizedBox(height: 12),
            TextField(controller: _descCtrl, maxLines: 2, decoration: const InputDecoration(hintText: 'توضیحات (اختیاری)')),
            const SizedBox(height: 12),
            const Text('پلتفرم', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              children: [
                for (final p in _platforms)
                  ChoiceChip(label: Text(p.$2, style: const TextStyle(fontSize: 11)), selected: _platform == p.$1, onSelected: (_) => setState(() => _platform = p.$1), selectedColor: p.$3, labelStyle: TextStyle(color: _platform == p.$1 ? Colors.white : AppColors.textSecondary)),
              ],
            ),
            const SizedBox(height: 12),
            const Text('نوع محتوا', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              children: [
                for (final t in _contentTypes)
                  ChoiceChip(label: Text(t.$2, style: const TextStyle(fontSize: 11)), selected: _contentType == t.$1, onSelected: (_) => setState(() => _contentType = t.$1), selectedColor: AppColors.accent, labelStyle: TextStyle(color: _contentType == t.$1 ? Colors.white : AppColors.textSecondary)),
              ],
            ),
            const SizedBox(height: 12),
            GlassCard(onTap: _pickDateTime, child: Row(children: [const Icon(Icons.event_outlined, color: AppColors.accent, size: 18), const SizedBox(width: 8), Text(_scheduledAt.toLocal().toString().split('.').first, textDirection: TextDirection.ltr)])),
            if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: AppColors.danger))),
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
      ),
    );
  }
}
